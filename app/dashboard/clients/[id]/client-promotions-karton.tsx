"use client";

import { useState, useTransition } from "react";
import { assignPromotion, removeClientPromotion, markPromotionUsed } from "@/app/actions/client-promotions";
import type { ClientPromotion, AvailablePromotion } from "@/app/actions/client-promotions";

type Props = {
  clientId: string;
  promotions: ClientPromotion[];
  available: AvailablePromotion[];
  canManage: boolean;
};

function formatDate(d: string) {
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}.${m}.${y}.`;
}

function ColorDot({ color }: { color: string | null }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: color ?? "#94a3b8" }}
    />
  );
}

const PROMO_TYPE_LABELS: Record<string, string> = {
  discount: "Popust",
  loyalty: "Loyalty",
  package: "Paket",
  gift: "Poklon",
  referral: "Preporuka",
};

export default function ClientPromotionsKarton({ clientId, promotions, available, canManage }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingUsed, setPendingUsed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!selectedId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignPromotion(clientId, selectedId, notes || null);
      if (result.error) {
        setError(result.error === "noPermission" ? "Nemate dozvolu." : "Greška pri dodavanju promocije.");
        return;
      }
      setShowForm(false);
      setSelectedId("");
      setNotes("");
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeClientPromotion(id, clientId);
      setConfirmDelete(null);
    });
  }

  async function handleToggleUsed(id: string, currentlyUsed: boolean) {
    setPendingUsed(id);
    const result = await markPromotionUsed(id, clientId, !currentlyUsed);
    setPendingUsed(null);
    if (result.error) {
      setError(result.error === "noPermission" ? "Nemate dozvolu." : "Greška pri ažuriranju statusa.");
    }
  }

  const alreadyAssigned = new Set(promotions.map((p) => p.promotion_id));
  const unassigned = available.filter((a) => !alreadyAssigned.has(a.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Promocije</h2>
          <p className="text-xs text-slate-400">
            {promotions.length === 0
              ? "Nema dodijeljenih promocija"
              : `${promotions.length} dodijeljena promocija`}
          </p>
        </div>
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 w-9 h-9 text-xl font-medium text-white hover:bg-indigo-700 transition-colors leading-none"
          >
            +
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">Dodaj promociju klijentu</p>

          {unassigned.length === 0 ? (
            <p className="text-sm text-slate-500">Nema dostupnih aktivnih promocija za dodjelu.</p>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Promocija
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">— Odaberi promociju —</option>
                {unassigned.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.ends_at ? ` (do ${formatDate(p.ends_at)})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {unassigned.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Napomena (opciono)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Npr. dogovor sa klijentom"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedId("");
                setNotes("");
                setError(null);
              }}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Zatvori
            </button>
            {unassigned.length > 0 && (
              <button
                onClick={handleAdd}
                disabled={!selectedId || isPending}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Dodajem…" : "Dodaj"}
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}

      {promotions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">Nema dodijeljenih promocija</p>
          {canManage && (
            <p className="text-slate-300 text-xs mt-1">Kliknite + da dodate promociju klijentu</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    Promocija
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    Tip
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    Datum
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    Napomena
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                    Status
                  </th>
                  {canManage && <th className="px-4 py-3 w-16" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotions.map((cp) => {
                  const isExpired =
                    !!cp.promotion.ends_at && new Date(cp.promotion.ends_at) < new Date();
                  const isUsed = cp.status === "completed";
                  return (
                    <tr key={cp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ColorDot color={cp.promotion.color} />
                          <span className={`font-medium ${isUsed ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {cp.promotion.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {PROMO_TYPE_LABELS[cp.promotion.promotion_type] ?? cp.promotion.promotion_type}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {formatDate(cp.assigned_at)}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="text-slate-700 truncate" title={cp.notes ?? ""}>
                          {cp.notes || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {canManage && !isExpired ? (
                          <button
                            onClick={() => handleToggleUsed(cp.id, isUsed)}
                            disabled={pendingUsed === cp.id}
                            title={isUsed ? "Klikni da poništiš" : "Klikni da označiš kao iskorištenu"}
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                              isUsed
                                ? "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
                                : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {pendingUsed === cp.id
                              ? "…"
                              : isUsed
                              ? `Iskorištena ${cp.used_at ? formatDate(cp.used_at) : ""}`
                              : "Aktivna"}
                          </button>
                        ) : isUsed ? (
                          <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-700">
                            Iskorištena {cp.used_at ? formatDate(cp.used_at) : ""}
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Istekla
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
                            Aktivna
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {confirmDelete === cp.id ? (
                              <>
                                <button
                                  onClick={() => handleRemove(cp.id)}
                                  disabled={isPending}
                                  className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                  Da
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                                >
                                  Ne
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(cp.id)}
                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
