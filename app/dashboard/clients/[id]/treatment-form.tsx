"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, useRef, useEffect } from "react";
import { createTreatment, updateTreatment } from "@/app/actions/clients";
import type { Treatment, TreatmentData } from "@/app/actions/clients";
import type { CustomField } from "@/app/actions/custom-fields";
import DateTimePicker from "@/components/date-time-picker";

type Employee = { id: string; full_name: string; color: string | null };
type ServiceOption = { id: string; name: string; price: number; category: string | null; color: string | null };

type Props = {
  clientId: string;
  treatment?: Treatment;
  employees: Employee[];
  services: ServiceOption[];
  customFields: CustomField[];
  currentEmployeeId: string | null;
  onClose: () => void;
  // Navigation (passed from TreatmentKarton)
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  navLabel?: string; // e.g. "3 / 5"
};

export default function TreatmentForm({
  clientId,
  treatment,
  employees,
  services,
  customFields,
  currentEmployeeId,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  navLabel,
}: Props) {
  const t = useTranslations("klijenti");
  const tCF = useTranslations("customFields");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    service_ids: treatment?.services?.map((s) => s.id) ?? [],
    treated_at: treatment?.treated_at ?? new Date().toISOString(),
    employee_id: treatment?.employee_id ?? currentEmployeeId ?? "",
    notes: treatment?.notes ?? "",
    amount_charged: treatment?.amount_charged?.toString() ?? "",
    invoice_number: treatment?.invoice_number ?? "",
  });

  const [customData, setCustomData] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {};
    customFields.forEach((f) => {
      const stored = treatment?.custom_data?.[f.field_key];
      if (f.field_type === "boolean") {
        init[f.field_key] = stored === true || stored === "true";
      } else {
        init[f.field_key] = stored != null ? String(stored) : "";
      }
    });
    return init;
  });

  useEffect(() => {
    if (!treatment) {
      // noop — treated_at already defaults to new Date().toISOString()
    }
    // Auto-open accordion if editing and has custom data
    if (treatment && customFields.some((cf) => {
      const val = treatment.custom_data?.[cf.field_key];
      return val !== null && val !== undefined && val !== "" && val !== false;
    })) {
      setCustomFieldsOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close services popover on outside click
  useEffect(() => {
    if (!servicesOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [servicesOpen]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleService(id: string) {
    setForm((f) => {
      const newIds = f.service_ids.includes(id)
        ? f.service_ids.filter((s) => s !== id)
        : [...f.service_ids, id];
      const total = services
        .filter((s) => newIds.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0);
      return {
        ...f,
        service_ids: newIds,
        amount_charged: total > 0 ? total.toFixed(2) : "",
      };
    });
  }

  const servicesTotal = services
    .filter((s) => form.service_ids.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);
  const amountMatchesTotal =
    servicesTotal > 0 &&
    form.amount_charged !== "" &&
    Math.abs(parseFloat(form.amount_charged) - servicesTotal) < 0.001;

  const selectedLabels = services
    .filter((s) => form.service_ids.includes(s.id))
    .map((s) => s.name)
    .join(", ");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const data: TreatmentData = {
      treated_at: form.treated_at,
      employee_id: form.employee_id || null,
      notes: form.notes || null,
      amount_charged: form.amount_charged ? parseFloat(form.amount_charged) : null,
      invoice_number: form.invoice_number || null,
      custom_data: customData,
    };
    startTransition(async () => {
      const result = treatment
        ? await updateTreatment(treatment.id, clientId, data, form.service_ids)
        : await createTreatment(clientId, data, form.service_ids);
      if ("error" in result) {
        setError(result.error ?? "generic");
      } else {
        onClose();
      }
    });
  }

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 shadow-sm">

      {/* ── Navigation header ── */}
      {navLabel ? (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-indigo-100 bg-indigo-50/60 rounded-t-2xl">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t("karton.prev")}
          </button>
          <span className="text-xs font-semibold text-indigo-500 tabular-nums">{navLabel}</span>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t("karton.next")}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        /* New treatment: compact header with just a close button */
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-indigo-100 bg-indigo-50/60 rounded-t-2xl">
          <span className="text-xs font-semibold text-indigo-500">{t("karton.newTreatment")}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 space-y-3">

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
            {t(`karton.errors.${error}`, { defaultValue: t("karton.errors.generic") })}
          </div>
        )}

        {/* ── Row 1: Services · DateTime · Employee ── */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_14rem_11rem] gap-3">

          {/* Services */}
          <div>
            <label className={labelCls}>{t("karton.services")}</label>
            {services.length === 0 ? (
              <p className="text-sm text-slate-400">{t("karton.noServicesAvailable")}</p>
            ) : (
              <div ref={servicesRef} className="relative">
                <button
                  type="button"
                  onClick={() => setServicesOpen((o) => !o)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors min-h-[38px]"
                >
                  {form.service_ids.length === 0 ? (
                    <span className="text-slate-400 truncate text-left">{t("karton.servicesPlaceholder")}</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                      {services.filter((s) => form.service_ids.includes(s.id)).map((s) => (
                        <span
                          key={s.id}
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${s.color ? "" : "bg-indigo-50 border-indigo-100 text-indigo-700"}`}
                          style={s.color ? { backgroundColor: `${s.color}18`, borderColor: `${s.color}40`, color: s.color } : undefined}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${servicesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {servicesOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {services.map((s) => {
                      const selected = form.service_ids.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${selected ? "bg-slate-50" : "hover:bg-slate-50"}`}
                        >
                          <input type="checkbox" checked={selected} onChange={() => toggleService(s.id)} className="w-4 h-4 rounded accent-indigo-600 shrink-0" />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {s.color && (
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: s.color }}
                              />
                            )}
                            <span className="text-sm text-slate-700 truncate">{s.name}</span>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0 tabular-nums">{s.price.toFixed(2).replace(".", ",") + " €"}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <label className={labelCls}>{t("karton.col.date")} *</label>
            <DateTimePicker
              name="_treated_at_ignored"
              defaultValue={form.treated_at}
              onChange={(iso) => set("treated_at", iso)}
            />
          </div>

          {/* Employee */}
          <div>
            <label className={labelCls}>{t("karton.employee")}</label>
            <select value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)} className={inputCls}>
              <option value="">{t("karton.noEmployee")}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Row 2: Notes · Amount · Invoice ── */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_7.5rem_9rem] gap-3 items-start">

          {/* Notes */}
          <div>
            <label className={labelCls}>{t("karton.col.notes")}</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder={t("karton.notesPlaceholder")}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>{t("karton.col.amount")}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount_charged}
                onChange={(e) => set("amount_charged", e.target.value)}
                placeholder="0.00"
                className={`${inputCls} pr-6`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">€</span>
            </div>
            {amountMatchesTotal && (
              <p className="mt-1 text-[10px] text-indigo-500 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
                {t("karton.amountFromServices")}
              </p>
            )}
          </div>

          {/* Invoice */}
          <div>
            <label className={labelCls}>{t("karton.col.invoice")}</label>
            <input
              type="text"
              value={form.invoice_number}
              onChange={(e) => set("invoice_number", e.target.value)}
              placeholder={t("karton.invoicePlaceholder")}
              className={inputCls}
            />
          </div>
        </div>

        {/* ── Row 3: Additional fields accordion ── */}
        {customFields.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setCustomFieldsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {tCF("additionalFields")}
                {customFields.some((cf) => {
                  const v = customData[cf.field_key];
                  return v !== "" && v !== false;
                }) && (
                  <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                    {customFields.filter((cf) => { const v = customData[cf.field_key]; return v !== "" && v !== false; }).length}
                  </span>
                )}
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${customFieldsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {customFieldsOpen && (
              <div className="border-t border-slate-100 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customFields.map((cf) => (
                  <div key={cf.id} className={cf.field_type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className={labelCls}>
                      {cf.label}
                      {cf.is_required && <span className="ml-0.5 text-red-400"> *</span>}
                    </label>

                    {cf.field_type === "text" && (
                      <input type="text" required={cf.is_required} value={(customData[cf.field_key] as string) ?? ""} onChange={(e) => setCustomData((d) => ({ ...d, [cf.field_key]: e.target.value }))} className={inputCls} />
                    )}
                    {cf.field_type === "textarea" && (
                      <textarea required={cf.is_required} rows={2} value={(customData[cf.field_key] as string) ?? ""} onChange={(e) => setCustomData((d) => ({ ...d, [cf.field_key]: e.target.value }))} className={`${inputCls} resize-none`} />
                    )}
                    {cf.field_type === "number" && (
                      <input type="number" step="any" required={cf.is_required} value={(customData[cf.field_key] as string) ?? ""} onChange={(e) => setCustomData((d) => ({ ...d, [cf.field_key]: e.target.value }))} className={inputCls} />
                    )}
                    {cf.field_type === "boolean" && (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                        <input type="checkbox" id={`cf_${cf.field_key}`} checked={(customData[cf.field_key] as boolean) ?? false} onChange={(e) => setCustomData((d) => ({ ...d, [cf.field_key]: e.target.checked }))} className="w-4 h-4 rounded accent-indigo-600" />
                        <label htmlFor={`cf_${cf.field_key}`} className="text-sm text-slate-700 cursor-pointer">{cf.label}</label>
                      </div>
                    )}
                    {cf.field_type === "select" && (
                      <select required={cf.is_required} value={(customData[cf.field_key] as string) ?? ""} onChange={(e) => setCustomData((d) => ({ ...d, [cf.field_key]: e.target.value }))} className={inputCls}>
                        <option value="">{tCF("selectPlaceholder")}</option>
                        {cf.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            {t("karton.cancel")}
          </button>
          <button type="submit" disabled={isPending} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {isPending ? t("karton.saving") : treatment ? t("karton.saveButton") : t("karton.addTreatment")}
          </button>
        </div>
      </form>
    </div>
  );
}
