"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { findFreeSlots } from "@/app/actions/appointments";
import type { Appointment, SlotSuggestion } from "@/app/actions/appointments";
import AppointmentForm from "./appointment-form";

type Employee = { id: string; full_name: string; color: string | null };
type Service = { id: string; name: string; price: number; duration_minutes: number | null; color: string | null };
type Client = { id: string; display_name: string };

type WorkingHours = Record<string, { open: string; close: string; closed: boolean }>;

type Props = {
  date: string; // YYYY-MM-DD
  employees: Employee[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  workingHours: WorkingHours;
  canManage: boolean;
};

const WEEKDAYS = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"];
const MONTHS = [
  "januar", "februar", "mart", "april", "maj", "juni",
  "juli", "august", "septembar", "oktobar", "novembar", "decembar",
];

function formatDateDisplay(dateStr: string) {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const d = new Date(y, mo - 1, day);
  return `${WEEKDAYS[d.getDay()]}, ${day}. ${MONTHS[mo - 1]} ${y}.`;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function isoToMinutes(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

const STATUS_BG: Record<string, string> = {
  scheduled: "bg-blue-500",
  confirmed: "bg-indigo-600",
  completed: "bg-emerald-500",
  cancelled: "bg-red-400",
  no_show: "bg-slate-400",
};

const STATUS_CARD: Record<string, string> = {
  scheduled: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  confirmed: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
  completed: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  cancelled: "bg-red-50 border-red-100 hover:bg-red-100 opacity-60",
  no_show: "bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-60",
};

const SLOT_HEIGHT = 48; // px per 30 min block
const HOUR_HEIGHT = SLOT_HEIGHT * 2; // px per hour

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
  const [isPending, startTransition] = useTransition();

  // Slot finder state
  const [finderOpen, setFinderOpen] = useState(false);
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
  const [formPrefill, setFormPrefill] = useState<{ employee_id?: string; starts_at?: string; ends_at?: string } | undefined>();

  // Date navigation
  function navigate(delta: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const newDate = toYMD(d);
    setDate(newDate);
    setFinderDate(newDate);
    // Re-fetch via router refresh
    startTransition(() => {
      window.location.href = `/dashboard/calendar?date=${newDate}`;
    });
  }

  // Working hours for this day
  const jsDay = new Date(date + "T12:00:00").getDay();
  const dayKey = String(jsDay);
  const dayHours = workingHours[dayKey];
  const salonOpen = dayHours?.closed ? null : timeToMinutes(dayHours?.open ?? "09:00");
  const salonClose = dayHours?.closed ? null : timeToMinutes(dayHours?.close ?? "18:00");

  const startHour = salonOpen != null ? Math.floor(salonOpen / 60) : 8;
  const endHour = salonClose != null ? Math.ceil(salonClose / 60) : 20;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Grid positioning
  function getTopOffset(iso: string) {
    const mins = isoToMinutes(iso);
    const offsetMins = mins - startHour * 60;
    return Math.max(0, (offsetMins / 30) * SLOT_HEIGHT);
  }

  function getHeight(startsAt: string, endsAt: string) {
    const startMins = isoToMinutes(startsAt);
    const endMins = isoToMinutes(endsAt);
    const durationMins = Math.max(30, endMins - startMins);
    return (durationMins / 30) * SLOT_HEIGHT;
  }

  const totalGridHeight = hours.length * HOUR_HEIGHT;

  // Group appointments by employee
  function getApptsByEmployee(empId: string) {
    return appointments.filter((a) => a.employee_id === empId);
  }

  // Slot finder
  function handleFindSlots() {
    setFinderLoading(true);
    setSuggestions([]);
    setNoSlots(false);
    startTransition(async () => {
      const slots = await findFreeSlots(
        finderDate,
        finderDuration,
        finderEmployee || null,
        5
      );
      setFinderLoading(false);
      if (slots.length === 0) setNoSlots(true);
      setSuggestions(slots);
    });
  }

  function handleSelectSuggestion(slot: SlotSuggestion) {
    setFormPrefill({ employee_id: slot.employee_id, starts_at: slot.starts_at, ends_at: slot.ends_at });
    setSelectedAppointment(null);
    setFormOpen(true);
    setSuggestions([]);
    setFinderOpen(false);
  }

  function openNew(empId?: string, startsAt?: string) {
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
    setSelectedAppointment(appt);
    setFormPrefill(undefined);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSelectedAppointment(null);
    setFormPrefill(undefined);
  }

  // Auto-fill duration when service is selected
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

  function formatSlotDate(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (toYMD(d) === toYMD(today)) return "Danas";
    if (toYMD(d) === toYMD(tomorrow)) return "Sutra";
    return d.toLocaleDateString("bs-BA", { weekday: "short", day: "numeric", month: "short" });
  }

  // Click on empty grid cell
  function handleGridClick(empId: string, e: React.MouseEvent<HTMLDivElement>) {
    if (!canManage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const mins = Math.floor((y / SLOT_HEIGHT) * 30);
    const totalMins = startHour * 60 + mins;
    const roundedMins = Math.round(totalMins / 15) * 15;
    const h = Math.floor(roundedMins / 60);
    const m = roundedMins % 60;
    const startsAt = `${date}T${pad(h)}:${pad(m)}:00`;
    openNew(empId, startsAt);
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top bar: date nav + slot finder toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
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
            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${isToday ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
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
          <span className="text-sm font-semibold text-slate-700 ml-1 hidden sm:block">
            {formatDateDisplay(date)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => openNew()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t("newAppointment")}
            </button>
          )}
          <button
            onClick={() => setFinderOpen((o) => !o)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${finderOpen ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            {t("slotFinder")}
          </button>
        </div>
      </div>

      {/* Mobile date */}
      <p className="sm:hidden text-sm font-semibold text-slate-700">{formatDateDisplay(date)}</p>

      {/* Slot finder panel */}
      {finderOpen && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">{t("slotFinderTitle")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t("fieldService")}</label>
              <select
                value={finderService}
                onChange={(e) => setFinderService(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">— odaberi tretman —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.duration_minutes ? `(${s.duration_minutes} min)` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t("fieldDuration")}</label>
              <input
                type="number"
                min={5}
                step={5}
                value={finderDuration}
                onChange={(e) => setFinderDuration(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t("fieldEmployee")}</label>
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
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t("fieldDate")}</label>
              <input
                type="date"
                value={finderDate}
                onChange={(e) => setFinderDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFindSlots}
              disabled={finderLoading || isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {finderLoading ? t("findingSlots") : t("findBtn")}
            </button>
          </div>

          {/* Suggestions */}
          {noSlots && (
            <p className="text-sm text-slate-500">{t("noSlots")}</p>
          )}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("suggestionsTitle")}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSuggestion(slot)}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm hover:bg-indigo-50 transition-colors"
                  >
                    <span className="font-semibold text-indigo-700">
                      {formatSlotDate(slot.starts_at)} {formatSlotTime(slot.starts_at)}–{formatSlotTime(slot.ends_at)}
                    </span>
                    <span className="text-slate-500">— {slot.employee_name}</span>
                    <span className="rounded-lg bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">{t("bookThis")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Salon closed */}
      {dayHours?.closed && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-400 text-sm">{t("salonClosed")}</p>
        </div>
      )}

      {/* No employees */}
      {!dayHours?.closed && employees.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-400 text-sm">{t("noEmployees")}</p>
        </div>
      )}

      {/* Calendar grid */}
      {!dayHours?.closed && employees.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
            <div style={{ minWidth: `${employees.length * 160 + 56}px` }}>
              {/* Employee header row */}
              <div className="flex border-b border-slate-100 bg-slate-50/80 sticky top-0 z-20">
                <div className="w-14 shrink-0 border-r border-slate-100" />
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex-1 min-w-40 px-3 py-3 border-r border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white shrink-0"
                        style={{ backgroundColor: emp.color ?? "#6366f1" }}
                      >
                        {emp.full_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-slate-700 truncate">{emp.full_name}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="flex">
                {/* Time labels column */}
                <div className="w-14 shrink-0 border-r border-slate-100 relative" style={{ height: totalGridHeight }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 flex items-center justify-end pr-2"
                      style={{ top: (h - startHour) * HOUR_HEIGHT - 9, height: HOUR_HEIGHT }}
                    >
                      <span className="text-[10px] text-slate-400 tabular-nums">{pad(h)}:00</span>
                    </div>
                  ))}
                </div>

                {/* Employee columns */}
                {employees.map((emp) => {
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
                          key={`${h}-half`}
                          className="absolute left-0 right-0 border-t border-slate-50"
                          style={{ top: (h - startHour) * HOUR_HEIGHT + SLOT_HEIGHT }}
                        />
                      ))}

                      {/* Appointments */}
                      {empAppts.map((appt) => {
                        const top = getTopOffset(appt.starts_at);
                        const height = getHeight(appt.starts_at, appt.ends_at);
                        const statusClass = STATUS_CARD[appt.status] ?? STATUS_CARD.scheduled;
                        const dotClass = STATUS_BG[appt.status] ?? STATUS_BG.scheduled;
                        const startTime = `${pad(new Date(appt.starts_at).getHours())}:${pad(new Date(appt.starts_at).getMinutes())}`;
                        const endTime = `${pad(new Date(appt.ends_at).getHours())}:${pad(new Date(appt.ends_at).getMinutes())}`;
                        const serviceNames = appt.items.map((i) => i.service_name).join(", ");

                        return (
                          <div
                            key={appt.id}
                            onClick={(e) => { e.stopPropagation(); openEdit(appt); }}
                            className={`absolute left-1 right-1 rounded-xl border px-2 py-1.5 cursor-pointer transition-all shadow-sm z-10 overflow-hidden ${statusClass}`}
                            style={{ top, height: Math.max(height, 28) }}
                          >
                            <div className="flex items-start gap-1.5 h-full">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${dotClass}`} />
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-[11px] font-semibold text-slate-700 leading-tight truncate">
                                  {startTime}–{endTime}
                                </p>
                                {height >= 44 && serviceNames && (
                                  <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">{serviceNames}</p>
                                )}
                                {height >= 60 && appt.client_name && (
                                  <p className="text-[10px] text-slate-400 leading-tight truncate">{appt.client_name}</p>
                                )}
                              </div>
                            </div>
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

      {/* Appointment form drawer */}
      {formOpen && (
        <AppointmentForm
          onClose={closeForm}
          employees={employees}
          services={services}
          clients={clients}
          prefill={formPrefill}
          appointment={selectedAppointment}
          canManage={canManage}
        />
      )}
    </div>
  );
}
