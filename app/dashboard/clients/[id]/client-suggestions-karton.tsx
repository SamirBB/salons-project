"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  addClientSuggestion,
  updateClientSuggestion,
  deleteClientSuggestion,
} from "@/app/actions/client-suggestions";
import type { ClientSuggestion } from "@/app/actions/client-suggestions";

type Props = {
  clientId: string;
  suggestions: ClientSuggestion[];
  canManage: boolean;
};

function formatDate(d: string) {
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}.${m}.${y}.`;
}

export default function ClientSuggestionsKarton({ clientId, suggestions, canManage }: Props) {
  const t = useTranslations("klijenti.clientSuggestions");

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ClientSuggestion | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setEditItem(null);
    setTitle("");
    setNotes("");
    setError(null);
    setShowForm(true);
  }

  function openEdit(s: ClientSuggestion) {
    setEditItem(s);
    setTitle(s.title);
    setNotes(s.notes ?? "");
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
    setTitle("");
    setNotes("");
    setError(null);
  }

  function handleSave() {
    if (!title.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = editItem
        ? await updateClientSuggestion(editItem.id, clientId, title, notes || null)
        : await addClientSuggestion(clientId, title, notes || null);

      if (result.error) {
        setError(result.error === "noPermission" ? t("errorNoPermission") : t("errorSave"));
        return;
      }
      closeForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteClientSuggestion(id, clientId);
      setConfirmDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{t("title")}</h2>
          <p className="text-xs text-slate-400">
            {suggestions.length === 0
              ? t("subtitleEmpty")
              : t("subtitleCount", { count: suggestions.length })}
          </p>
        </div>
        {canManage && !showForm && (
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 w-9 h-9 text-xl font-medium text-white hover:bg-indigo-700 transition-colors leading-none"
          >
            +
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {editItem ? t("formTitleEdit") : t("formTitleNew")}
          </p>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t("nameLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {t("notesLabel")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              onClick={closeForm}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? t("saving") : editItem ? t("save") : t("add")}
            </button>
          </div>
        </div>
      )}

      {suggestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">{t("emptyTitle")}</p>
          {canManage && (
            <p className="text-slate-300 text-xs mt-1">{t("emptyHint")}</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    {t("colName")}
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    {t("colNotes")}
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {t("colDate")}
                  </th>
                  {canManage && <th className="px-4 py-3 w-20" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggestions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px]">
                      <div className="truncate" title={s.title}>
                        {s.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="text-slate-600 truncate" title={s.notes ?? ""}>
                        {s.notes || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(s.created_at)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {confirmDelete === s.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(s.id)}
                                disabled={isPending}
                                className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                {t("confirmYes")}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                              >
                                {t("confirmNo")}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(s)}
                                className="rounded p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setConfirmDelete(s.id)}
                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
