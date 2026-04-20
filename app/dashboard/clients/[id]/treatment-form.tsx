"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createTreatment, updateTreatment } from "@/app/actions/clients";
import type { Treatment, TreatmentData } from "@/app/actions/clients";

type Employee = { id: string; full_name: string; color: string | null };
type ServiceOption = { id: string; name: string; price: number; category: string | null };

type Props = {
  clientId: string;
  treatment?: Treatment;
  employees: Employee[];
  services: ServiceOption[];
  currentEmployeeId: string | null;
  onClose: () => void;
  roundedTop?: boolean;
};

export default function TreatmentForm({
  clientId,
  treatment,
  employees,
  services,
  currentEmployeeId,
  onClose,
  roundedTop = true,
}: Props) {
  const t = useTranslations("klijenti");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    service_ids: treatment?.services?.map((s) => s.id) ?? [],
    treated_at: treatment?.treated_at ?? today,
    employee_id: treatment?.employee_id ?? currentEmployeeId ?? "",
    notes: treatment?.notes ?? "",
    amount_charged: treatment?.amount_charged?.toString() ?? "",
    invoice_number: treatment?.invoice_number ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleService(id: string) {
    setForm((f) => ({
      ...f,
      service_ids: f.service_ids.includes(id)
        ? f.service_ids.filter((s) => s !== id)
        : [...f.service_ids, id],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const data: TreatmentData = {
      treated_at: form.treated_at,
      employee_id: form.employee_id || null,
      notes: form.notes || null,
      amount_charged: form.amount_charged ? parseFloat(form.amount_charged) : null,
      invoice_number: form.invoice_number || null,
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
        {/* Row 1: datum, radnik */}
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

        {/* Usluge — multi-select chips */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">
            {t("karton.services")}
          </label>
          {services.length === 0 ? (
            <p className="text-sm text-slate-400">{t("karton.noServicesAvailable")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {services.map((s) => {
                const selected = form.service_ids.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "border-indigo-300 bg-indigo-100 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                    }`}
                  >
                    {selected && (
                      <svg
                        className="w-3 h-3 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Row 2: napomene */}
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

        {/* Row 3: iznos, račun */}
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                €
              </span>
            </div>
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
