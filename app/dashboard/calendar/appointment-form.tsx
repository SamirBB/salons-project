"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/app/actions/appointments";
import type { Appointment, AppointmentStatus } from "@/app/actions/appointments";

type Employee = { id: string; full_name: string; color: string | null };
type Service = { id: string; name: string; price: number; duration_minutes: number | null; color: string | null };
type Client = { id: string; display_name: string };

type Props = {
  onClose: () => void;
  employees: Employee[];
  services: Service[];
  clients: Client[];
  prefill?: {
    employee_id?: string;
    starts_at?: string;
    ends_at?: string;
    service_id?: string;
  };
  appointment?: Appointment | null;
  canManage: boolean;
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function formatTimeLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const ymd = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const isoDate = ymd(d);
  const prefix =
    isoDate === ymd(today) ? "Danas" : isoDate === ymd(tomorrow) ? "Sutra" : formatDateLabel(iso);
  return `${prefix} u ${formatTime(iso)}`;
}

function toLocalISOString(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToISO(val: string) {
  return new Date(val).toISOString();
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AppointmentForm({
  onClose,
  employees,
  services,
  clients,
  prefill,
  appointment,
  canManage,
}: Props) {
  const t = useTranslations("kalendar");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropOpen, setClientDropOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const defaultStart = prefill?.starts_at
    ? toLocalISOString(prefill.starts_at)
    : `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
  const defaultEnd = prefill?.ends_at
    ? toLocalISOString(prefill.ends_at)
    : `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours() + 1)}:00`;

  const [form, setForm] = useState({
    client_id: appointment?.client_id ?? "",
    employee_id: appointment?.employee_id ?? prefill?.employee_id ?? "",
    starts_at: appointment ? toLocalISOString(appointment.starts_at) : defaultStart,
    ends_at: appointment ? toLocalISOString(appointment.ends_at) : defaultEnd,
    notes: appointment?.notes ?? "",
    status: (appointment?.status ?? "scheduled") as AppointmentStatus,
    selectedServiceIds:
      appointment?.items.map((i) => i.service_id) ??
      (prefill?.service_id ? [prefill.service_id] : []),
  });

  const selectedClient = clients.find((c) => c.id === form.client_id);
  const selectedEmployee = employees.find((e) => e.id === form.employee_id);
  const filteredClients = clients.filter((c) =>
    c.display_name.toLowerCase().includes(clientSearch.toLowerCase())
  );
  const selectedServices = services.filter((s) => form.selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const isEditing = !!appointment;
  const displayIso = isEditing && appointment
    ? appointment.starts_at
    : prefill?.starts_at ?? null;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node))
        setClientDropOpen(false);
      if (serviceRef.current && !serviceRef.current.contains(e.target as Node))
        setServicePickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function toggleService(svcId: string) {
    setForm((f) => {
      const newIds = f.selectedServiceIds.includes(svcId)
        ? f.selectedServiceIds.filter((id) => id !== svcId)
        : [...f.selectedServiceIds, svcId];

      const totalMin = services
        .filter((s) => newIds.includes(s.id))
        .reduce((sum, s) => sum + (s.duration_minutes ?? 30), 0);

      if (totalMin > 0 && f.starts_at) {
        const startDate = new Date(f.starts_at);
        const endDate = new Date(startDate.getTime() + totalMin * 60000);
        const p = (n: number) => String(n).padStart(2, "0");
        const newEnd = `${endDate.getFullYear()}-${p(endDate.getMonth() + 1)}-${p(endDate.getDate())}T${p(endDate.getHours())}:${p(endDate.getMinutes())}`;
        return { ...f, selectedServiceIds: newIds, ends_at: newEnd };
      }
      return { ...f, selectedServiceIds: newIds };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createAppointment({
        client_id: form.client_id || null,
        employee_id: form.employee_id || null,
        starts_at: localInputToISO(form.starts_at),
        ends_at: localInputToISO(form.ends_at),
        notes: form.notes || null,
        internal_note: null,
        items: selectedServices.map((s) => ({
          service_id: s.id,
          employee_id: form.employee_id || null,
          duration_minutes: s.duration_minutes ?? 30,
          price: s.price,
          final_price: s.price,
          notes: null,
        })),
      });
      if (result.error) {
        setError(
          result.error === "noPermission" ? t("errorNoPermission") : t("errorCreate")
        );
        return;
      }
      onClose();
    });
  }

  function handleStatusChange(status: AppointmentStatus) {
    if (!appointment) return;
    startTransition(async () => {
      await updateAppointmentStatus(appointment.id, status);
      setForm((f) => ({ ...f, status }));
    });
  }

  function handleDelete() {
    if (!appointment) return;
    startTransition(async () => {
      const result = await deleteAppointment(appointment.id);
      if (result.error) {
        setError(t("errorDelete"));
        return;
      }
      onClose();
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
        <h3 className="text-sm font-semibold text-slate-800">
          {isEditing
            ? t("editAppointment")
            : displayIso
            ? t("suggestedAppointment")
            : t("newAppointment")}
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Time card */}
      {displayIso && (
        <div className="mx-3 mt-3 rounded-xl bg-indigo-600 px-4 py-3 text-white shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">{formatTimeLabel(displayIso)}</span>
          </div>
          <p className="text-indigo-200 text-xs mt-0.5 ml-6">{formatDateLabel(displayIso)}</p>
        </div>
      )}

      {/* Status badges — edit only */}
      {isEditing && (
        <div className="mx-3 mt-3 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {(
              ["scheduled", "confirmed", "completed", "cancelled", "no_show"] as AppointmentStatus[]
            ).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                disabled={isPending}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  form.status === s
                    ? STATUS_COLORS[s] + " ring-2 ring-offset-1 ring-indigo-300"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {t(
                  `status${s
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join("")}` as never
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable form */}
      <form
        id="appt-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
      >
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Client */}
        <div ref={clientRef} className="relative">
          <p className="text-xs text-slate-400 mb-1.5 font-medium">{t("fieldClient")}</p>
          <button
            type="button"
            onClick={() => {
              setClientDropOpen((o) => !o);
              setClientSearch("");
            }}
            className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              {selectedClient ? (
                <span className="text-xs font-semibold text-slate-600">
                  {selectedClient.display_name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>
            <span className={`flex-1 text-sm ${selectedClient ? "text-slate-800" : "text-slate-400"}`}>
              {selectedClient?.display_name ?? t("noClient")}
            </span>
            <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          {clientDropOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="p-2 border-b border-slate-100">
                <input
                  autoFocus
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder={t("clientPlaceholder")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, client_id: "" }));
                    setClientDropOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-50"
                >
                  {t("noClient")}
                </button>
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, client_id: c.id }));
                      setClientDropOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${
                      form.client_id === c.id
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-slate-700"
                    }`}
                  >
                    {c.display_name}
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <p className="px-4 py-3 text-sm text-slate-400">Nema rezultata</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Services */}
        <div ref={serviceRef} className="relative">
          <p className="text-xs text-slate-400 mb-1.5 font-medium">{t("fieldServices")}</p>
          <button
            type="button"
            onClick={() => setServicePickerOpen((o) => !o)}
            className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
          >
            {selectedServices.length > 0 ? (
              <>
                <span
                  className="h-4 w-4 rounded shrink-0"
                  style={{ backgroundColor: selectedServices[0].color ?? "#6366f1" }}
                />
                <span className="flex-1 text-sm text-slate-800 truncate">
                  {selectedServices.map((s) => s.name).join(", ")}
                </span>
                {selectedServices.length === 1 && selectedServices[0].duration_minutes && (
                  <span className="text-xs text-slate-400 shrink-0">
                    {selectedServices[0].duration_minutes} {t("durationMin")}
                  </span>
                )}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="flex-1 text-sm text-slate-400">{t("selectTreatment")}</span>
              </>
            )}
            <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          {servicePickerOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="max-h-52 overflow-y-auto">
                {services.map((s) => {
                  const selected = form.selectedServiceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50 ${
                        selected ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: s.color ?? "#e2e8f0" }}
                      />
                      <span className={`flex-1 text-sm ${selected ? "text-indigo-700 font-medium" : "text-slate-700"}`}>
                        {s.name}
                      </span>
                      {s.duration_minutes && (
                        <span className="text-xs text-slate-400">{s.duration_minutes} min</span>
                      )}
                      <span className="text-xs font-medium text-slate-600 tabular-nums">
                        {s.price.toFixed(2).replace(".", ",")} €
                      </span>
                      {selected && (
                        <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedServices.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {selectedServices.reduce((s, sv) => s + (sv.duration_minutes ?? 0), 0)}{" "}
                    {t("durationMin")}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {totalPrice.toFixed(2).replace(".", ",")} €
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Employee */}
        <div>
          <p className="text-xs text-slate-400 mb-1.5 font-medium">{t("fieldEmployee")}</p>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {employees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    employee_id: f.employee_id === emp.id ? "" : emp.id,
                  }))
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50 ${
                  form.employee_id === emp.id ? "bg-indigo-50/60" : ""
                }`}
              >
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                  style={{ backgroundColor: emp.color ?? "#6366f1" }}
                >
                  {emp.full_name.charAt(0).toUpperCase()}
                </span>
                <span
                  className={`flex-1 text-sm ${
                    form.employee_id === emp.id ? "text-indigo-700 font-medium" : "text-slate-700"
                  }`}
                >
                  {emp.full_name}
                </span>
                {form.employee_id === emp.id && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                )}
              </button>
            ))}
            {employees.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400">Nema radnika</p>
            )}
          </div>
        </div>

        {/* Price summary */}
        {selectedServices.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1.5 font-medium">Cijena</p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              <span className="text-sm font-medium text-slate-700">
                {totalPrice.toFixed(2).replace(".", ",")} €
              </span>
            </div>
          </div>
        )}

        {/* Time pickers — only when no prefill time and not editing */}
        {!displayIso && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-400 mb-1.5 font-medium">{t("fieldStartsAt")}</p>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5 font-medium">{t("fieldEndsAt")}</p>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <p className="text-xs text-slate-400 mb-1.5 font-medium">{t("fieldNotes")}</p>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none placeholder:text-slate-300"
            placeholder="Dodajte napomenu..."
          />
        </div>
      </form>

      {/* Footer */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-100 shrink-0 space-y-2">
        {/* Delete — edit mode */}
        {isEditing && canManage && (
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500 flex-1">{t("confirmDelete")}</span>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  {t("confirmYes")}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {t("confirmNo")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-200 mb-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t("delete")}
              </button>
            )}
          </div>
        )}

        {/* Book / Cancel */}
        {!isEditing && canManage && (
          <button
            form="appt-form"
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            )}
            {isPending ? t("saving") : t("bookBtn")}
          </button>
        )}
        <button
          onClick={onClose}
          type="button"
          className="w-full rounded-xl py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

export { formatTime };
