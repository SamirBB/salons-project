"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteTreatment } from "@/app/actions/clients";
import TreatmentForm from "./treatment-form";
import type { Treatment } from "@/app/actions/clients";

type Employee = { id: string; full_name: string; color: string | null };

type Props = {
  clientId: string;
  treatments: Treatment[];
  employees: Employee[];
  canManage: boolean;
  currentEmployeeId: string | null;
};

function formatDate(d: string) {
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}.${m}.${y}.`;
}

function formatPrice(p: number | null) {
  if (p === null || p === undefined) return "—";
  return p.toFixed(2).replace(".", ",") + " €";
}

export default function TreatmentKarton({ clientId, treatments, employees, canManage, currentEmployeeId }: Props) {
  const t = useTranslations("klijenti");
  const [showForm, setShowForm] = useState(false);
  const [editTreatment, setEditTreatment] = useState<Treatment | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const isEditing = editTreatment !== null;
  const total = treatments.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{t("karton.title")}</h2>
          <p className="text-xs text-slate-400">{t("karton.subtitle", { count: treatments.length })}</p>
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
        <div className="space-y-0">
          {/* Navigacija između tretmana */}
          {isEditing && total > 1 && editIndex !== null && (
            <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-indigo-200 bg-indigo-50/60 px-4 py-2">
              <button
                onClick={() => goToIndex(editIndex - 1)}
                disabled={editIndex <= 0}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Prethodni
              </button>
              <span className="text-xs font-medium text-indigo-500">
                {total - editIndex} / {total}
              </span>
              <button
                onClick={() => goToIndex(editIndex + 1)}
                disabled={editIndex >= total - 1}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Sljedeći
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          <TreatmentForm
            key={editTreatment?.id ?? "new"}
            clientId={clientId}
            treatment={editTreatment ?? undefined}
            employees={employees}
            currentEmployeeId={currentEmployeeId}
            onClose={() => { setShowForm(false); setEditTreatment(null); setEditIndex(null); }}
            roundedTop={!(isEditing && total > 1)}
          />
        </div>
      )}

      {treatments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">{t("karton.noTreatments")}</p>
          {canManage && <p className="text-slate-300 text-xs mt-1">{t("karton.noTreatmentsHint")}</p>}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 w-8">#</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{t("karton.col.date")}</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{t("karton.col.notes")}</th>
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{t("karton.col.amount")}</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{t("karton.col.invoice")}</th>
                  {canManage && <th className="px-4 py-3 w-20" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {treatments.map((tr, idx) => (
                  <tr key={tr.id} className={`hover:bg-slate-50 transition-colors ${tr.is_trial ? "bg-amber-50/40" : ""}`}>
                    <td className="px-4 py-3 text-xs">
                      {tr.is_trial ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">P</span>
                      ) : (
                        <span className="text-slate-400">{treatments.length - idx}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(tr.treated_at)}</td>
                    <td className="px-4 py-3 max-w-[300px]">
                      <div className="text-slate-700 truncate" title={tr.notes ?? ""}>
                        {tr.notes || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800 whitespace-nowrap">{formatPrice(tr.amount_charged)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{tr.invoice_number || "—"}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {confirmDelete === tr.id ? (
                            <>
                              <button onClick={() => handleDelete(tr.id)} disabled={isPending} className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100">{t("karton.yes")}</button>
                              <button onClick={() => setConfirmDelete(null)} className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">{t("karton.no")}</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => openEdit(tr, idx)} className="rounded p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => setConfirmDelete(tr.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
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
