"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, useRef, useEffect } from "react";
import { createTreatment, updateTreatment } from "@/app/actions/clients";
import type { Treatment, TreatmentData } from "@/app/actions/clients";
import type { CustomField } from "@/app/actions/custom-fields";
// useTranslations used twice: "klijenti" + "customFields"

type Employee = { id: string; full_name: string; color: string | null };
type ServiceOption = { id: string; name: string; price: number; category: string | null };

type Props = {
  clientId: string;
  treatment?: Treatment;
  employees: Employee[];
  services: ServiceOption[];
  customFields: CustomField[];
  currentEmployeeId: string | null;
  onClose: () => void;
  roundedTop?: boolean;
};

export default function TreatmentForm({
  clientId,
  treatment,
  employees,
  services,
  customFields,
  currentEmployeeId,
  onClose,
  roundedTop = true,
}: Props) {
  const t = useTranslations("klijenti");
  const tCF = useTranslations("customFields");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    service_ids: treatment?.services?.map((s) => s.id) ?? [],
    treated_at: treatment?.treated_at ?? today,
    employee_id: treatment?.employee_id ?? currentEmployeeId ?? "",
    notes: treatment?.notes ?? "",
    amount_charged: treatment?.amount_charged?.toString() ?? "",
    invoice_number: treatment?.invoice_number ?? "",
  });

  // Custom fields state: Record<field_key, string | boolean>
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

  // Zatvori popover klikom izvan
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

  const selectedLabels = services
    .filter((s) => form.service_ids.includes(s.id))
    .map((s) => s.name)
    .join(", ");

  return (
    <div
      className={`${
        roundedTop ? "rounded-2xl" : "rounded-b-2xl"
      } border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm space-y-5`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">
          {treatment ? t("karton.editTreatment") : t("karton.newTreatment")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {t(`karton.errors.${error}`, { defaultValue: t("karton.errors.generic") })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Row 1: Usluge — popover */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t("karton.services")}
          </label>
          {services.length === 0 ? (
            <p className="text-sm text-slate-400">{t("karton.noServicesAvailable")}</p>
          ) : (
            <div ref={servicesRef} className="relative">
              <button
                type="button"
                onClick={() => setServicesOpen((o) => !o)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors"
              >
                <span
                  className={`truncate text-left ${
                    form.service_ids.length === 0 ? "text-slate-400" : "text-slate-700"
                  }`}
                >
                  {form.service_ids.length === 0
                    ? t("karton.servicesPlaceholder")
                    : selectedLabels}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {form.service_ids.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {form.service_ids.length}
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
                      servicesOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {servicesOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  {services.map((s) => {
                    const selected = form.service_ids.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          selected ? "bg-indigo-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleService(s.id)}
                          className="w-4 h-4 rounded accent-indigo-600 shrink-0"
                        />
                        <span className="flex-1 text-sm text-slate-700">{s.name}</span>
                        <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                          {s.price.toFixed(2).replace(".", ",") + " €"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 2: datum, radnik */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("karton.col.date")} *
            </label>
            <input
              type="date"
              required
              value={form.treated_at}
              onChange={(e) => set("treated_at", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("karton.employee")}
            </label>
            <select
              value={form.employee_id}
              onChange={(e) => set("employee_id", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t("karton.noEmployee")}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: napomene */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t("karton.col.notes")}
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={t("karton.notesPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Row 4: iznos, račun */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("karton.col.amount")}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount_charged}
                onChange={(e) => set("amount_charged", e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
            </div>
            {amountMatchesTotal && (
              <p className="mt-1 text-[11px] text-indigo-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
                {t("karton.amountFromServices")}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("karton.col.invoice")}
            </label>
            <input
              type="text"
              value={form.invoice_number}
              onChange={(e) => set("invoice_number", e.target.value)}
              placeholder={t("karton.invoicePlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Custom fields */}
        {customFields.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-slate-200/80 pt-1" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {tCF("additionalFields")}
            </p>
            {customFields.map((cf) => (
              <div key={cf.id}>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {cf.label}
                  {cf.is_required && <span className="ml-0.5 text-red-400"> *</span>}
                </label>

                {cf.field_type === "text" && (
                  <input
                    type="text"
                    required={cf.is_required}
                    value={(customData[cf.field_key] as string) ?? ""}
                    onChange={(e) =>
                      setCustomData((d) => ({ ...d, [cf.field_key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                {cf.field_type === "textarea" && (
                  <textarea
                    required={cf.is_required}
                    rows={2}
                    value={(customData[cf.field_key] as string) ?? ""}
                    onChange={(e) =>
                      setCustomData((d) => ({ ...d, [cf.field_key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                )}

                {cf.field_type === "number" && (
                  <input
                    type="number"
                    step="any"
                    required={cf.is_required}
                    value={(customData[cf.field_key] as string) ?? ""}
                    onChange={(e) =>
                      setCustomData((d) => ({ ...d, [cf.field_key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                {cf.field_type === "boolean" && (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                    <input
                      type="checkbox"
                      id={`cf_${cf.field_key}`}
                      checked={(customData[cf.field_key] as boolean) ?? false}
                      onChange={(e) =>
                        setCustomData((d) => ({ ...d, [cf.field_key]: e.target.checked }))
                      }
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <label
                      htmlFor={`cf_${cf.field_key}`}
                      className="text-sm text-slate-700 cursor-pointer"
                    >
                      {cf.label}
                    </label>
                  </div>
                )}

                {cf.field_type === "select" && (
                  <select
                    required={cf.is_required}
                    value={(customData[cf.field_key] as string) ?? ""}
                    onChange={(e) =>
                      setCustomData((d) => ({ ...d, [cf.field_key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{tCF("selectPlaceholder")}</option>
                    {cf.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {t("karton.cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {isPending
              ? t("karton.saving")
              : treatment
              ? t("karton.saveButton")
              : t("karton.addTreatment")}
          </button>
        </div>
      </form>
    </div>
  );
}
