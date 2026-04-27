"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteTreatment, toggleTreatmentCancelled } from "@/app/actions/clients";
import TreatmentForm from "./treatment-form";
import type { Treatment } from "@/app/actions/clients";
import type { CustomField } from "@/app/actions/custom-fields";
// useTranslations used twice: "klijenti" + "customFields"

type Employee = { id: string; full_name: string; color: string | null };
type ServiceOption = { id: string; name: string; price: number; category: string | null; color: string | null };

/** Generates chip styles from a hex color. Falls back to indigo if no color set. */
function serviceChipStyle(color: string | null | undefined, cancelled: boolean): React.CSSProperties {
  if (cancelled || !color) return {};
  return {
    backgroundColor: `${color}18`,
    borderColor: `${color}40`,
    color,
  };
}

type Props = {
  clientId: string;
  treatments: Treatment[];
  employees: Employee[];
  services: ServiceOption[];
  customFields: CustomField[];
  canManage: boolean;
  currentEmployeeId: string | null;
};

function formatDateTime(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d.slice(0, 10);
  const day = String(date.getDate()).padStart(2, "0");
  const m   = String(date.getMonth() + 1).padStart(2, "0");
  const y   = date.getFullYear();
  const h   = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  if (h === "00" && min === "00") return `${day}.${m}.${y}.`;
  return `${day}.${m}.${y}. ${h}:${min}`;
}

function formatPrice(p: number | null) {
  if (p === null || p === undefined) return "—";
  return p.toFixed(2).replace(".", ",") + " €";
}

function renderCustomValue(value: unknown, fieldType: string, boolTrue: string, boolFalse: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (fieldType === "boolean") return value === true || value === "true" ? boolTrue : boolFalse;
  return String(value);
}

export default function TreatmentKarton({
  clientId,
  treatments,
  employees,
  services,
  customFields,
  canManage,
  currentEmployeeId,
}: Props) {
  const t = useTranslations("klijenti");
  const tCF = useTranslations("customFields");
  const boolTrue = tCF("booleanTrue");
  const boolFalse = tCF("booleanFalse");
  const [showForm, setShowForm] = useState(false);
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  function openEdit(tr: Treatment, idx: number) {
    setEditTreatment(tr);
    setEditIndex(idx);
    setShowForm(false);
  }

  function goToIndex(idx: number) {
    if (idx < 0 || idx >= treatments.length) return;
    setEditTreatment(treatments[idx]);
    setEditIndex(idx);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTreatment(id, clientId);
      setConfirmDelete(null);
    });
  }

  function handleCancel(id: string, currentlyCancelled: boolean) {
    toggleTreatmentCancelled(id, clientId, !currentlyCancelled);
    setConfirmCancel(null);
  }

  const isEditing = editTreatment !== null;
  const total = treatments.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{t("karton.title")}</h2>
          <p className="text-xs text-slate-400">
            {t("karton.subtitle", { count: treatments.length })}
          </p>
        </div>
        {canManage && !showForm && !editTreatment && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 w-9 h-9 text-xl font-medium text-white hover:bg-indigo-700 transition-colors leading-none"
          >
            +
          </button>
        )}
      </div>

      {(showForm || isEditing) && (
        <TreatmentForm
          key={editTreatment?.id ?? "new"}
          clientId={clientId}
          treatment={editTreatment ?? undefined}
          employees={employees}
          services={services}
          customFields={customFields}
          currentEmployeeId={currentEmployeeId}
          onClose={() => {
            setShowForm(false);
            setEditTreatment(null);
            setEditIndex(null);
          }}
          navLabel={isEditing && total > 1 && editIndex !== null ? `${total - editIndex} / ${total}` : undefined}
          onPrev={editIndex !== null ? () => goToIndex(editIndex - 1) : undefined}
          onNext={editIndex !== null ? () => goToIndex(editIndex + 1) : undefined}
          hasPrev={editIndex !== null && editIndex > 0}
          hasNext={editIndex !== null && editIndex < total - 1}
        />
      )}

      {treatments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">{t("karton.noTreatments")}</p>
          {canManage && (
            <p className="text-slate-300 text-xs mt-1">{t("karton.noTreatmentsHint")}</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 w-8">
                    #
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    {t("karton.col.services")}
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {t("karton.col.date")}
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    {t("karton.col.notes")}
                  </th>
                  {customFields.map((cf) => (
                    <th
                      key={cf.id}
                      className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                    >
                      {cf.label}
                    </th>
                  ))}
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    {t("karton.col.amount")}
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    {t("karton.col.invoice")}
                  </th>
                  {canManage && <th className="px-4 py-3 w-20" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {treatments.map((tr, idx) => (
                  <tr
                    key={tr.id}
                    className={`transition-colors ${tr.is_cancelled ? "bg-red-50/60" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {treatments.length - idx}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex flex-wrap items-center gap-1">
                        {tr.is_cancelled && (
                          <span className="inline-flex items-center rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-500 uppercase tracking-wide shrink-0">
                            {t("karton.cancelled")}
                          </span>
                        )}
                        {tr.services && tr.services.length > 0 ? (
                          tr.services.map((s) => (
                            <span
                              key={s.id}
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                                tr.is_cancelled
                                  ? "bg-red-50 border-red-100 text-red-300 line-through"
                                  : s.color
                                  ? ""
                                  : "bg-indigo-50 border-indigo-100 text-indigo-700"
                              }`}
                              style={serviceChipStyle(s.color, tr.is_cancelled)}
                            >
                              {s.name}
                            </span>
                          ))
                        ) : !tr.is_cancelled ? (
                          <span className="text-slate-400">—</span>
                        ) : null}
                      </div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${tr.is_cancelled ? "text-red-300 line-through" : "text-slate-700"}`}>
                      {formatDateTime(tr.treated_at)}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <div className={`truncate ${tr.is_cancelled ? "text-red-300" : "text-slate-700"}`} title={tr.notes ?? ""}>
                        {tr.notes || "—"}
                      </div>
                    </td>
                    {customFields.map((cf) => (
                      <td key={cf.id} className={`px-4 py-3 text-sm whitespace-nowrap ${tr.is_cancelled ? "text-red-300" : "text-slate-600"}`}>
                        {renderCustomValue(tr.custom_data?.[cf.field_key], cf.field_type, boolTrue, boolFalse)}
                      </td>
                    ))}
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tr.is_cancelled ? "text-red-300 line-through" : "text-slate-800"}`}>
                      {formatPrice(tr.amount_charged)}
                    </td>
                    <td className={`px-4 py-3 text-xs ${tr.is_cancelled ? "text-red-300" : "text-slate-500"}`}>
                      {tr.invoice_number || "—"}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {confirmDelete === tr.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(tr.id)}
                                disabled={isPending}
                                className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                {t("karton.yes")}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                              >
                                {t("karton.no")}
                              </button>
                            </>
                          ) : confirmCancel === tr.id ? (
                            <>
                              <button
                                onClick={() => handleCancel(tr.id, tr.is_cancelled)}
                                className="rounded px-2 py-1 text-xs bg-amber-50 text-amber-600 hover:bg-amber-100"
                              >
                                {t("karton.yes")}
                              </button>
                              <button
                                onClick={() => setConfirmCancel(null)}
                                className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                              >
                                {t("karton.no")}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(tr, idx)}
                                className="rounded p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                                title={t("karton.editTreatment")}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {/* Cancel / Restore button */}
                              {tr.is_cancelled ? (
                                <button
                                  onClick={() => handleCancel(tr.id, tr.is_cancelled)}
                                  className="rounded p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                                  title={t("karton.restoreTreatment")}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmCancel(tr.id)}
                                  className="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                                  title={t("karton.cancelTreatment")}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmDelete(tr.id)}
                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                title={t("karton.deleteTreatment")}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
