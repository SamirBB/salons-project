"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { findFreeSlots } from "@/app/actions/appointments";
import type { Appointment, SlotSuggestion } from "@/app/actions/appointments";
import AppointmentForm from "./appointment-form";

type Employee = { id: string; full_name: string; color: string | null };
type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
  color: string | null;
};
type Client = { id: string; display_name: string };
type WorkingHours = Record<string, { open: string; close: string; closed: boolean }>;

type Props = {
  date: string;
  employees: Employee[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  workingHours: WorkingHours;
  canManage: boolean;
};

// ── helpers ──────────────────────────────────────────────────────────────────

const WEEKDAYS = [
  "nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota",
];
const MONTHS = [
  "januar", "februar", "mart", "april", "maj", "juni",
  "juli", "august", "septembar", "oktobar", "novembar", "decembar",
];

function pad(n: number) { return String(n).padStart(2, "0"); }

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateDisplay(dateStr: string) {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const d = new Date(y, mo - 1, day);
  return `${WEEKDAYS[d.getDay()]}, ${day}. ${MONTHS[mo - 1]} ${y}.`;
}

function formatDateShort(dateStr: string) {
  const [, mo, day] = dateStr.split("-").map(Number);
  return `${pad(day)}.${pad(mo)}.${dateStr.split("-")[0]}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function isoToMinutes(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(99,102,241,${alpha})`;
  return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
}

const SLOT_HEIGHT = 48; // px per 30 min
const HOUR_HEIGHT = SLOT_HEIGHT * 2;

// ── component ─────────────────────────────────────────────────────────────────

export default function CalendarView({
  date: initialDate,
  employees,
  services,
  clients,
  appointments: initialAppointments,
  workingHours,
  canManage,
}: Props) {
  const t = useTranslations("kalendar");

  const [date, setDate] = useState(initialDate);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

  // Sync when server sends fresh props after router.refresh()
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);
  const [isPending, startTransition] = useTransition();

  // Slot finder state
  const [finderService, setFinderService] = useState("");
  const [finderDuration, setFinderDuration] = useState(30);
  const [finderEmployee, setFinderEmployee] = useState("");
  const [finderDate, setFinderDate] = useState(initialDate);
  const [finderLoading, setFinderLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SlotSuggestion[]>([]);
  const [noSlots, setNoSlots] = useState(false);

  // Appointment form state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formPrefill, setFormPrefill] = useState<
    { employee_id?: string; starts_at?: string; ends_at?: string; service_id?: string } | undefined
  >();
  const [selectedSuggestion, setSelectedSuggestion] = useState<SlotSuggestion | null>(null);

  // Employee column filter
  const [filterEmployee, setFilterEmployee] = useState("");

  // Date navigation
  function navigate(delta: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const newDate = toYMD(d);
    setDate(newDate);
    setFinderDate(newDate);
    startTransition(() => {
      window.location.href = `/dashboard/calendar?date=${newDate}`;
    });
  }

  // Working hours for this day
  const jsDay = new Date(date + "T12:00:00").getDay();
  const dayHours = workingHours[String(jsDay)];
  const salonOpen = dayHours?.closed ? null : timeToMinutes(dayHours?.open ?? "09:00");
  const salonClose = dayHours?.closed ? null : timeToMinutes(dayHours?.close ?? "18:00");

  const startHour = salonOpen != null ? Math.floor(salonOpen / 60) : 8;
  const endHour = salonClose != null ? Math.ceil(salonClose / 60) : 20;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const totalGridHeight = hours.length * HOUR_HEIGHT;

  // Stats
  const displayedEmployees = filterEmployee
    ? employees.filter((e) => e.id === filterEmployee)
    : employees;

  const totalSlots =
    salonOpen != null && salonClose != null
      ? Math.floor((salonClose - salonOpen) / 30) * displayedEmployees.length
      : 0;
  const usedSlots = appointments.reduce((acc, a) => {
    const dur = Math.ceil(
      (new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / (30 * 60000)
    );
    return acc + Math.max(1, dur);
  }, 0);
  const freeSlots = Math.max(0, totalSlots - usedSlots);

  // Grid helpers
  function getTopOffset(iso: string) {
    const mins = isoToMinutes(iso);
    return Math.max(0, ((mins - startHour * 60) / 30) * SLOT_HEIGHT);
  }
  function getHeight(startsAt: string, endsAt: string) {
    const dur = Math.max(30, isoToMinutes(endsAt) - isoToMinutes(startsAt));
    return (dur / 30) * SLOT_HEIGHT;
  }
  function getApptsByEmployee(empId: string) {
    return appointments.filter((a) => a.employee_id === empId);
  }

  // Slot finder
  function handleFindSlots() {
    setFinderLoading(true);
    setSuggestions([]);
    setNoSlots(false);
    startTransition(async () => {
      const slots = await findFreeSlots(finderDate, finderDuration, finderEmployee || null, 5);
      setFinderLoading(false);
      if (slots.length === 0) setNoSlots(true);
      setSuggestions(slots);
    });
  }

  function handleSelectSuggestion(slot: SlotSuggestion) {
    setSelectedSuggestion(slot);
    setFormPrefill({
      employee_id: slot.employee_id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      service_id: finderService || undefined,
    });
    setSelectedAppointment(null);
    setFormOpen(true);
  }

  function openNew(empId?: string, startsAt?: string) {
    setSelectedSuggestion(null);
    setSelectedAppointment(null);
    if (startsAt) {
      const endsAt = new Date(new Date(startsAt).getTime() + 30 * 60000).toISOString();
      setFormPrefill({ employee_id: empId, starts_at: startsAt, ends_at: endsAt });
    } else {
      setFormPrefill({ employee_id: empId });
    }
    setFormOpen(true);
  }

  function openEdit(appt: Appointment) {
    setSelectedSuggestion(null);
    setSelectedAppointment(appt);
    setFormPrefill(undefined);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSelectedAppointment(null);
    setFormPrefill(undefined);
    setSelectedSuggestion(null);
  }

  // Auto-fill duration when service selected in finder
  useEffect(() => {
    if (finderService) {
      const svc = services.find((s) => s.id === finderService);
      if (svc?.duration_minutes) setFinderDuration(svc.duration_minutes);
    }
  }, [finderService, services]);

  const isToday = date === toYMD(new Date());

  function formatSlotTime(iso: string) {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function formatSlotDateLabel(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (toYMD(d) === toYMD(today)) return "Danas";
    if (toYMD(d) === toYMD(tomorrow)) return "Sutra";
    return d.toLocaleDateString("bs-BA", { weekday: "short", day: "numeric", month: "short" });
  }

  function handleGridClick(empId: string, e: React.MouseEvent<HTMLDivElement>) {
    if (!canManage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMins = startHour * 60 + Math.floor((y / SLOT_HEIGHT) * 30);
    const rounded = Math.round(totalMins / 15) * 15;
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    openNew(empId, `${date}T${pad(h)}:${pad(m)}:00`);
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Row 1: Slot finder + Stats ── */}
      <div className="flex gap-3 items-stretch flex-wrap lg:flex-nowrap">

        {/* Slot finder card */}
        <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Tretman */}
            <div className="flex-1 min-w-36">
              <label className="block text-xs font-medium text-slate-400 mb-1">{t("fieldService")}</label>
              <select
                value={finderService}
                onChange={(e) => setFinderService(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">— odaberi —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Trajanje */}
            <div className="w-36 shrink-0">
              <label className="block text-xs font-medium text-slate-400 mb-1">{t("fieldDuration")}</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <select
                  value={finderDuration}
                  onChange={(e) => setFinderDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Radnik */}
            <div className="flex-1 min-w-36">
              <label className="block text-xs font-medium text-slate-400 mb-1">{t("fieldEmployee")}</label>
              <select
                value={finderEmployee}
                onChange={(e) => setFinderEmployee(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">{t("anyEmployee")}</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>

            {/* Datum */}
            <div className="w-40 shrink-0">
              <label className="block text-xs font-medium text-slate-400 mb-1">{t("fieldDate")}</label>
              <input
                type="date"
                value={finderDate}
                onChange={(e) => setFinderDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Button */}
            <button
              onClick={handleFindSlots}
              disabled={finderLoading || isPending}
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {finderLoading ? t("findingSlots") : t("findFirstBtn")}
            </button>
          </div>

          {/* Results */}
          {noSlots && !finderLoading && (
            <p className="text-sm text-slate-400">{t("noSlots")}</p>
          )}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap items-start gap-6 pt-3 border-t border-slate-100">
              {/* First suggestion */}
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">{t("firstSlotLabel")}</p>
                  <button
                    onClick={() => handleSelectSuggestion(suggestions[0])}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {formatSlotDateLabel(suggestions[0].starts_at)} u {formatSlotTime(suggestions[0].starts_at)}
                    {" "}•{" "}
                    {suggestions[0].employee_name}
                  </button>
                </div>
              </div>

              {/* Alternatives */}
              {suggestions.length > 1 && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">{t("altSlotsLabel")}</p>
                  <ul className="space-y-0.5">
                    {suggestions.slice(1, 5).map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                        <button
                          onClick={() => handleSelectSuggestion(s)}
                          className="text-xs text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          {formatSlotDateLabel(s.starts_at)} u {formatSlotTime(s.starts_at)}
                          {" "}•{" "}
                          <span className="text-slate-400">{s.employee_name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="flex gap-3 shrink-0">
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            }
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
            value={appointments.length}
            label={t("statTodayLabel")}
            sub={t("today")}
          />
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
            value={freeSlots}
            label={t("statSlotsLabel")}
            sub={t("today")}
          />
          <StatCard
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            value={employees.length}
            label={t("statEmployeesLabel")}
            sub={`Od ${employees.length} ukupno`}
          />
        </div>
      </div>

      {/* ── Row 2: Calendar + Form panel ── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* Calendar */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Calendar nav */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const today = toYMD(new Date());
                  setDate(today);
                  setFinderDate(today);
                  window.location.href = `/dashboard/calendar?date=${today}`;
                }}
                className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isToday
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("today")}
              </button>
              <button
                onClick={() => navigate(1)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-slate-700 ml-1 capitalize">
                {formatDateDisplay(date)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dan / Sedmica toggle */}
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5">
                <button className="rounded-[10px] bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white">
                  {t("dayView")}
                </button>
                <button className="rounded-[10px] px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                  {t("weekView")}
                </button>
              </div>

              {/* Employee filter */}
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">{t("allEmployees")}</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>

              {/* New appointment */}
              {canManage && (
                <button
                  onClick={() => openNew()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t("newAppointment")}
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          {dayHours?.closed ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="text-slate-400 text-sm">{t("salonClosed")}</p>
            </div>
          ) : displayedEmployees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="text-slate-400 text-sm">{t("noEmployees")}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1">
              <div
                className="overflow-x-auto overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 340px)" }}
              >
                <div style={{ minWidth: `${displayedEmployees.length * 168 + 56}px` }}>

                  {/* Employee header row */}
                  <div className="flex border-b border-slate-100 bg-slate-50/80 sticky top-0 z-20">
                    <div className="w-14 shrink-0 border-r border-slate-100" />
                    {displayedEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex-1 min-w-40 px-3 py-3 border-r border-slate-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0"
                            style={{ backgroundColor: emp.color ?? "#6366f1" }}
                          >
                            {emp.full_name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate leading-tight">
                              {emp.full_name}
                            </p>
                            <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 mt-0.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {t("available")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time grid */}
                  <div className="flex">
                    {/* Time column */}
                    <div
                      className="w-14 shrink-0 border-r border-slate-100 relative"
                      style={{ height: totalGridHeight }}
                    >
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 flex items-center justify-end pr-2"
                          style={{ top: (h - startHour) * HOUR_HEIGHT - 9 }}
                        >
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {pad(h)}:00
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Employee columns */}
                    {displayedEmployees.map((emp) => {
                      const empAppts = getApptsByEmployee(emp.id);
                      return (
                        <div
                          key={emp.id}
                          className="flex-1 min-w-40 relative border-r border-slate-100 last:border-0 cursor-pointer"
                          style={{ height: totalGridHeight }}
                          onClick={(e) => handleGridClick(emp.id, e)}
                        >
                          {/* Hour lines */}
                          {hours.map((h) => (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t border-slate-100"
                              style={{ top: (h - startHour) * HOUR_HEIGHT }}
                            />
                          ))}
                          {/* Half-hour lines */}
                          {hours.map((h) => (
                            <div
                              key={`${h}h`}
                              className="absolute left-0 right-0 border-t border-slate-50"
                              style={{ top: (h - startHour) * HOUR_HEIGHT + SLOT_HEIGHT }}
                            />
                          ))}

                          {/* Ghost slot — selected suggestion */}
                          {selectedSuggestion?.employee_id === emp.id && (
                            <div
                              className="absolute left-1 right-1 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/70 px-2 py-1.5 z-10 pointer-events-none"
                              style={{
                                top: getTopOffset(selectedSuggestion.starts_at),
                                height: Math.max(
                                  getHeight(selectedSuggestion.starts_at, selectedSuggestion.ends_at),
                                  32
                                ),
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3 h-3 text-indigo-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                                <p className="text-[10px] text-indigo-500 font-medium leading-tight truncate">
                                  {t("suggestedAppointment")}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Appointment cards */}
                          {empAppts.map((appt) => {
                            const top = getTopOffset(appt.starts_at);
                            const height = getHeight(appt.starts_at, appt.ends_at);
                            const svcColor = appt.items[0]?.service_color ?? null;
                            const startTime = `${pad(new Date(appt.starts_at).getHours())}:${pad(new Date(appt.starts_at).getMinutes())}`;
                            const endTime = `${pad(new Date(appt.ends_at).getHours())}:${pad(new Date(appt.ends_at).getMinutes())}`;
                            const primaryService = appt.items[0]?.service_name ?? "";

                            return (
                              <div
                                key={appt.id}
                                onClick={(e) => { e.stopPropagation(); openEdit(appt); }}
                                className="absolute left-1 right-1 rounded-xl border cursor-pointer transition-all shadow-sm z-10 overflow-hidden px-2 py-1.5"
                                style={{
                                  top,
                                  height: Math.max(height, 28),
                                  backgroundColor: svcColor
                                    ? hexToRgba(svcColor, 0.1)
                                    : "rgb(239 246 255)",
                                  borderColor: svcColor
                                    ? hexToRgba(svcColor, 0.4)
                                    : "rgb(191 219 254)",
                                }}
                              >
                                <p
                                  className="text-[10px] font-medium leading-tight"
                                  style={{ color: svcColor ? hexToRgba(svcColor, 0.75) : "#6366f1" }}
                                >
                                  {startTime} – {endTime}
                                </p>
                                {height >= 36 && primaryService && (
                                  <p
                                    className="text-[11px] font-semibold leading-tight mt-0.5 truncate"
                                    style={{ color: svcColor ?? "#4338ca" }}
                                  >
                                    {primaryService}
                                  </p>
                                )}
                                {height >= 52 && appt.client_name && (
                                  <p className="text-[10px] text-slate-500 leading-tight truncate">
                                    {appt.client_name}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel — appointment form ── */}
        {formOpen && (
          <div className="w-72 shrink-0">
            <AppointmentForm
              onClose={closeForm}
              employees={employees}
              services={services}
              clients={clients}
              prefill={formPrefill}
              appointment={selectedAppointment}
              canManage={canManage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3 flex flex-col items-center justify-center min-w-[88px] gap-1">
      <div className={`${iconBg} ${iconColor} rounded-xl p-2`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{value}</p>
      <p className="text-xs font-medium text-slate-600 text-center leading-tight">{label}</p>
      <p className="text-[10px] text-slate-400 text-center">{sub}</p>
    </div>
  );
}
