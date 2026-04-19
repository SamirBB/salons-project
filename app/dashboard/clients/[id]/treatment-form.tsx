"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createTreatment, updateTreatment } from "@/app/actions/clients";
import type { Treatment } from "@/app/actions/clients";

type Employee = { id: string; full_name: string; color: string | null };

type Props = {
  clientId: string;
  treatment?: Treatment;
  employees: Employee[];
  currentEmployeeId: string | null;
  onClose: () => void;
  roundedTop?: boolean;
};

const TREATMENT_TYPES = ["IPL", "SHR", "RF", "Elight", "Laser", "Mezoterapija", "Drugi"];
const PHOTOTYPES = ["I", "II", "III", "IV", "V", "VI"];

export default function TreatmentForm({ clientId, treatment, employees, currentEmployeeId, onClose, roundedTop = true }: Props) {
  const t = useTranslations("klijenti");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    is_trial: treatment?.is_trial ?? false,
    session_number: treatment?.session_number?.toString() ?? "",
    treated_at: treatment?.treated_at ?? today,
    employee_id: treatment?.employee_id ?? currentEmployeeId ?? "",
    zone: treatment?.zone ?? "",
    treatment_type: treatment?.treatment_type ?? "",
    phototype: treatment?.phototype ?? "",
    energy_level: treatment?.energy_level ?? "",
    impulses_count: treatment?.impulses_count?.toString() ?? "",
    notes: treatment?.notes ?? "",
    side_effects: treatment?.side_effects ?? "",
    amount_charged: treatment?.amount_charged?.toString() ?? "",
    invoice_number: treatment?.invoice_number ?? "",
  });

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      is_trial: form.is_trial,
      session_number: form.session_number ? parseInt(form.session_number) : null,
      treated_at: form.treated_at,
      employee_id: form.employee_id || null,
      zone: form.zone || null,
      treatment_type: form.treatment_type || null,
      phototype: form.phototype || null,
      energy_level: form.energy_level || null,
      impulses_count: form.impulses_count ? parseInt(form.impulses_count) : null,
      notes: form.notes || null,
      side_effects: form.side_effects || null,
      amount_charged: form.amount_charged ? parseFloat(form.amount_charged) : null,
      invoice_number: form.invoice_number || null,
    };

    startTransition(async () => {
      const result = treatment
        ? await updateTreatment(treatment.id, clientId, payload)
        : await createTreatment(clientId, payload);

      if ("error" in result) {
        setError(result.error ?? "generic");
      } else {
        onClose();
      }
    });
  }

  return (
    <div className={`${roundedTop ? "rounded-2xl" : "rounded-b-2xl"} border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm space-y-5`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">
          {treatment ? t("karton.editTreatment") : t("karton.newTreatment")}
        </h3>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
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
        {/* Row 1: trial, sesija, datum, radnik */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2 sm:col-span-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <input
              type="checkbox"
              id="is_trial"
              checked={form.is_trial}
              onChange={(e) => set("is_trial", e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500"
            />
            <label htmlFor="is_trial" className="text-sm font-medium text-slate-700 cursor-pointer">
              {t("karton.isTrial")}
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.sessionNumber")}</label>
            <input type="number" min="1" value={form.session_number} onChange={(e) => set("session_number", e.target.value)} placeholder="1"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.date")} *</label>
            <input type="date" required value={form.treated_at} onChange={(e) => set("treated_at", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.employee")}</label>
            <select value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{t("karton.noEmployee")}</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: zona, vrsta, fototip, energija, impulsi */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.zone")}</label>
            <input type="text" value={form.zone} onChange={(e) => set("zone", e.target.value)} placeholder={t("karton.zonePlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.type")}</label>
            <select value={form.treatment_type} onChange={(e) => set("treatment_type", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">—</option>
              {TREATMENT_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.phototype")}</label>
            <select value={form.phototype} onChange={(e) => set("phototype", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">—</option>
              {PHOTOTYPES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.energy")}</label>
            <input type="text" value={form.energy_level} onChange={(e) => set("energy_level", e.target.value)} placeholder="npr. 15J"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.impulses")}</label>
            <input type="number" min="0" value={form.impulses_count} onChange={(e) => set("impulses_count", e.target.value)} placeholder="0"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Row 3: napomene, nuspojave */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.notes")}</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={t("karton.notesPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.sideEffects")}</label>
            <textarea rows={2} value={form.side_effects} onChange={(e) => set("side_effects", e.target.value)} placeholder={t("karton.sideEffectsPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        </div>

        {/* Row 4: iznos, račun */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.amount")}</label>
            <div className="relative">
              <input type="number" min="0" step="0.01" value={form.amount_charged} onChange={(e) => set("amount_charged", e.target.value)} placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t("karton.col.invoice")}</label>
            <input type="text" value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)} placeholder={t("karton.invoicePlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            {t("karton.cancel")}
          </button>
          <button type="submit" disabled={isPending} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {isPending ? t("karton.saving") : treatment ? t("karton.saveButton") : t("karton.addTreatment")}
          </button>
        </div>
      </form>
    </div>
  );
}
