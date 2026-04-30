"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteTreatment, toggleTreatmentCancelled } from "@/app/actions/clients";
import TreatmentForm from "./treatment-form";
import type { Treatment } from "@/app/actions/clients";
import type { CustomField } from "@/app/actions/custom-fields";
// useTranslations used twice: "klijenti" + "customFields"

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-30 shadow-sm">
        {label}
      </span>
    </div>
  );
}

type Employee = { id: string; full_name: string; color: string | null };
type ServiceOption = { id: string; name: string; price: number; duration_minutes: number | null; category: string | null; color: string | null };

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
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("karton.addTreatment")}
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
          navLabel={isEditing && total > 1 && editIndex !== null ? `${editIndex + 1} / ${total}` : undefined}
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
        <>
          {/* ── Mobile cards (< md) ── */}
          <div className="md:hidden space-y-3">
            {treatments.map((tr, idx) => (
              <div
                key={tr.id}
                className={`rounded-2xl border p-4 shadow-sm ${tr.is_cancelled ? "bg-red-50/60 border-red-100" : "bg-white border-slate-200"}`}
              >
                {/* Top row: number + chips + actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-xs text-slate-400 shrink-0 mt-0.5 w-5 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="flex flex-wrap gap-1">
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
                        <span className="text-slate-400 text-xs">—</span>
                      ) : null}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      {confirmDelete === tr.id ? (
                        <>
                          <button onClick={() => handleDelete(tr.id)} disabled={isPending} className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100">
                            {t("karton.yes")}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">
                            {t("karton.no")}
                          </button>
                        </>
                      ) : confirmCancel === tr.id ? (
                        <>
                          <button onClick={() => handleCancel(tr.id, tr.is_cancelled)} className="rounded px-2 py-1 text-xs bg-amber-50 text-amber-600 hover:bg-amber-100">
                            {t("karton.yes")}
                          </button>
                          <button onClick={() => setConfirmCancel(null)} className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">
                            {t("karton.no")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openEdit(tr, idx)} className="rounded p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors" title={t("karton.editTreatment")}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {tr.is_cancelled ? (
                            <button onClick={() => handleCancel(tr.id, tr.is_cancelled)} className="rounded p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors" title={t("karton.restoreTreatment")}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          ) : (
                            <button onClick={() => setConfirmCancel(tr.id)} className="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors" title={t("karton.cancelTreatment")}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => setConfirmDelete(tr.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title={t("karton.deleteTreatment")}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className={`mt-2 text-sm font-medium ${tr.is_cancelled ? "text-red-300 line-through" : "text-slate-700"}`}>
                  {formatDateTime(tr.treated_at)}
                </div>

                {/* Notes */}
                {tr.notes && (
                  <div className={`mt-1 text-xs ${tr.is_cancelled ? "text-red-300" : "text-slate-500"}`}>
                    {tr.notes}
                  </div>
                )}

                {/* Custom fields */}
                {customFields.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {customFields.map((cf) => {
                      const val = renderCustomValue(tr.custom_data?.[cf.field_key], cf.field_type, boolTrue, boolFalse);
                      if (val === "—") return null;
                      return (
                        <div key={cf.id} className="text-xs">
                          <span className="text-slate-400">{cf.label}: </span>
                          <span className={tr.is_cancelled ? "text-red-300" : "text-slate-600"}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Duration + Amount + Invoice */}
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs ${tr.is_cancelled ? "text-red-300" : "text-slate-400"}`}>
                    {tr.invoice_number || "—"}
                  </span>
                  <div className="flex items-center gap-2">
                    {tr.duration_minutes != null && (
                      <span className={`inline-flex items-center gap-1 text-xs ${tr.is_cancelled ? "text-red-300" : "text-slate-400"}`}>
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tr.duration_minutes} {t("karton.minShort")}
                      </span>
                    )}
                    <span className={`text-sm font-semibold ${tr.is_cancelled ? "text-red-300 line-through" : "text-slate-800"}`}>
                      {formatPrice(tr.amount_charged)}
                    </span>
                  </div>
                </div>

                {/* Created by */}
                {tr.created_by_name && (
                  <div className="mt-1.5 text-xs text-slate-400">
                    {t("karton.col.createdBy")}: <span className="text-slate-600">{tr.created_by_name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Desktop table (≥ md) ── */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 w-8">#</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                        </svg>
                        {t("karton.col.services")}
                      </span>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t("karton.col.duration")}
                      </span>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {t("karton.col.date")}
                      </span>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        {t("karton.col.notes")}
                      </span>
                    </th>
                    {customFields.map((cf) => (
                      <th key={cf.id} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                        {cf.label}
                      </th>
                    ))}
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t("karton.col.amount")}
                      </span>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        {t("karton.col.invoice")}
                      </span>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {t("karton.col.createdBy")}
                      </span>
                    </th>
                    {canManage && <th className="px-4 py-3 w-24" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {treatments.map((tr, idx) => (
                    <tr
                      key={tr.id}
                      className={`transition-colors ${tr.is_cancelled ? "bg-red-50/40" : "hover:bg-slate-50/70"}`}
                    >
                      <td className={`px-4 py-3 text-xs tabular-nums ${tr.is_cancelled ? "text-red-300" : "text-slate-400"}`}>
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex flex-wrap items-center gap-1">
                          {tr.is_cancelled && (
                            <span className="inline-flex items-center rounded-md bg-red-100 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-500 uppercase tracking-wider shrink-0">
                              {t("karton.cancelled")}
                            </span>
                          )}
                          {tr.services && tr.services.length > 0 ? (
                            tr.services.map((s) => (
                              <span
                                key={s.id}
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                                  tr.is_cancelled
                                    ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
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
                      <td className={`px-4 py-3 whitespace-nowrap text-xs tabular-nums ${tr.is_cancelled ? "text-slate-400" : "text-slate-500"}`}>
                        {tr.duration_minutes != null ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {tr.duration_minutes} {t("karton.minShort")}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${tr.is_cancelled ? "text-slate-400 line-through" : "text-slate-600"}`}>
                        {formatDateTime(tr.treated_at)}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <div className={`truncate text-sm ${tr.is_cancelled ? "text-slate-400" : "text-slate-600"}`} title={tr.notes ?? ""}>
                          {tr.notes || <span className="text-slate-300">—</span>}
                        </div>
                      </td>
                      {customFields.map((cf) => (
                        <td key={cf.id} className={`px-4 py-3 text-sm whitespace-nowrap ${tr.is_cancelled ? "text-slate-400" : "text-slate-600"}`}>
                          {renderCustomValue(tr.custom_data?.[cf.field_key], cf.field_type, boolTrue, boolFalse)}
                        </td>
                      ))}
                      <td className={`px-4 py-3 text-right text-sm font-semibold whitespace-nowrap tabular-nums ${tr.is_cancelled ? "text-slate-400 line-through" : "text-slate-800"}`}>
                        {formatPrice(tr.amount_charged)}
                      </td>
                      <td className={`px-4 py-3 text-xs ${tr.is_cancelled ? "text-slate-400" : "text-slate-500"}`}>
                        {tr.invoice_number || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {tr.created_by_name || <span className="text-slate-300">—</span>}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            {confirmDelete === tr.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDelete(tr.id)} disabled={isPending} className="rounded-lg px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                  {t("karton.yes")}
                                </button>
                                <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                  {t("karton.no")}
                                </button>
                              </div>
                            ) : confirmCancel === tr.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleCancel(tr.id, tr.is_cancelled)} className="rounded-lg px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                                  {t("karton.yes")}
                                </button>
                                <button onClick={() => setConfirmCancel(null)} className="rounded-lg px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                  {t("karton.no")}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-0.5">
                                <Tip label={t("karton.editTreatment")}>
                                  <button onClick={() => openEdit(tr, idx)} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </Tip>
                                {tr.is_cancelled ? (
                                  <Tip label={t("karton.restoreTreatment")}>
                                    <button onClick={() => handleCancel(tr.id, tr.is_cancelled)} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                  </Tip>
                                ) : (
                                  <Tip label={t("karton.cancelTreatment")}>
                                    <button onClick={() => setConfirmCancel(tr.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      </svg>
                                    </button>
                                  </Tip>
                                )}
                                <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                <Tip label={t("karton.deleteTreatment")}>
                                  <button onClick={() => setConfirmDelete(tr.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </Tip>
                              </div>
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
        </>
      )}
    </div>
  );
}
