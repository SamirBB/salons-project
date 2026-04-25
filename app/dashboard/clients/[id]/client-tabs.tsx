"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { assignPromotion, removeClientPromotion, markPromotionUsed } from "@/app/actions/client-promotions";
import type { ClientPromotion, AvailablePromotion } from "@/app/actions/client-promotions";

const MAX_PROMOTIONS = 5;
const MAX_NOTES = 500;

type ActiveTab = "prijedlozi" | "karton" | string;

type Props = {
  karton: React.ReactNode;
  prijedlozi: React.ReactNode;
  clientId: string;
  promotions: ClientPromotion[];
  available: AvailablePromotion[];
  canManage: boolean;
};

function formatDate(d: string) {
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}.${m}.${y}.`;
}

// Icons per promotion type
function PromoIcon({ type }: { type: string }) {
  const base = "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50";
  const icon = "h-5 w-5 text-indigo-500";

  if (type === "discount") return (
    <div className={base}>
      <svg className={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    </div>
  );

  if (type === "loyalty") return (
    <div className={base}>
      <svg className={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </div>
  );

  if (type === "referral") return (
    <div className={base}>
      <svg className={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    </div>
  );

  if (type === "package") return (
    <div className={base}>
      <svg className={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    </div>
  );

  if (type === "bundle") return (
    <div className={base}>
      <svg className={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    </div>
  );

  // gift (default)
  return (
    <div className={base}>
      <svg className={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    </div>
  );
}

// Drawer component
function AddPromotionDrawer({
  open,
  onClose,
  available,
  onAdd,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  available: AvailablePromotion[];
  onAdd: (promoId: string, notes: string) => void;
  isPending: boolean;
}) {
  const tPromo = useTranslations("klijenti.clientPromotions");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 80);
      setSearch("");
      setSelectedId("");
      setNotes("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = available.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[480px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Dodaj promociju klijentu</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Odaberite promociju i po želji dodajte napomenu za klijenta.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pretraži promociju</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pretraži promociju..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Promotion list */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Odaberi promociju</label>
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">{tPromo("noAvailable")}</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((p) => {
                  const isSelected = selectedId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(isSelected ? "" : p.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-400"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <PromoIcon type={p.promotion_type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{p.description}</p>
                        )}
                        {p.ends_at && (
                          <p className="text-xs text-amber-500 mt-1">Ističe {formatDate(p.ends_at)}</p>
                        )}
                      </div>
                      {/* Radio indicator */}
                      <div className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                      }`}>
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {tPromo("notesLabel")} <span className="text-slate-400 font-normal">(opciono)</span>
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
                placeholder="Npr. dogovor sa klijentom"
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-slate-300">
                {notes.length}/{MAX_NOTES}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Zatvori
          </button>
          <button
            onClick={() => onAdd(selectedId, notes)}
            disabled={!selectedId || isPending}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Dodajem…" : "Dodaj"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function ClientTabs({ karton, prijedlozi, clientId, promotions, available, canManage }: Props) {
  const t = useTranslations("klijenti.tabs");
  const tPromo = useTranslations("klijenti.clientPromotions");

  const [activeTab, setActiveTab] = useState<ActiveTab>("prijedlozi");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  const [pendingUsed, setPendingUsed] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const alreadyAssigned = new Set(promotions.map((p) => p.promotion_id));
  const unassigned = available.filter((a) => !alreadyAssigned.has(a.id));
  const canAddMore = promotions.length < MAX_PROMOTIONS;

  const activePromotion = promotions.find((p) => p.id === activeTab);

  useEffect(() => {
    if (activeTab !== "prijedlozi" && activeTab !== "karton" && !activePromotion) {
      setActiveTab("prijedlozi");
    }
  }, [activeTab, activePromotion]);

  function handleAddPromo(promoId: string, notes: string) {
    if (!promoId) return;
    startTransition(async () => {
      const result = await assignPromotion(clientId, promoId, notes || null);
      if (!result.error) {
        setDrawerOpen(false);
      }
    });
  }

  async function handleToggleUsed(id: string, currentlyUsed: boolean) {
    setPendingUsed(id);
    setPromoError(null);
    const result = await markPromotionUsed(id, clientId, !currentlyUsed);
    setPendingUsed(null);
    if (result.error) setPromoError(tPromo("errorStatus"));
  }

  function handleRemove(id: string) {
    setPromoError(null);
    startTransition(async () => {
      await removeClientPromotion(id, clientId);
      setConfirmDelete(null);
      setActiveTab("prijedlozi");
    });
  }

  const tabStyle = (isActive: boolean) =>
    `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
      isActive
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
    }`;

  const PROMO_TYPE_LABELS: Record<string, string> = {
    discount: tPromo("typeDiscount"),
    loyalty: tPromo("typeLoyalty"),
    package: tPromo("typePackage"),
    gift: tPromo("typeGift"),
    referral: tPromo("typeReferral"),
    bundle: tPromo("typeBundle"),
  };

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-end border-b border-slate-200 overflow-x-auto">
        <button onClick={() => setActiveTab("prijedlozi")} className={tabStyle(activeTab === "prijedlozi")}>
          {t("prijedlozi")}
        </button>

        <button onClick={() => setActiveTab("karton")} className={tabStyle(activeTab === "karton")}>
          {t("tretman")}
        </button>

        {promotions.map((cp) => (
          <button
            key={cp.id}
            onClick={() => setActiveTab(cp.id)}
            className={tabStyle(activeTab === cp.id)}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cp.promotion.color ?? "#94a3b8" }}
              />
              {cp.promotion.name}
            </span>
          </button>
        ))}

        {canManage && canAddMore && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-indigo-500 border-b-2 border-transparent -mb-px hover:text-indigo-700 hover:border-indigo-300 transition-colors whitespace-nowrap"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Dodaj Promociju
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === "prijedlozi" && prijedlozi}
      {activeTab === "karton" && karton}

      {/* Promotion tab content */}
      {activePromotion && (() => {
        const cp = activePromotion;
        const isExpired = now !== null && !!cp.promotion.ends_at && new Date(cp.promotion.ends_at) < now;
        const isUsed = cp.status === "completed";

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-block w-4 h-4 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: cp.promotion.color ?? "#94a3b8" }}
                />
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{cp.promotion.name}</h3>
                  <span className="text-xs text-slate-400">
                    {PROMO_TYPE_LABELS[cp.promotion.promotion_type] ?? cp.promotion.promotion_type}
                  </span>
                </div>
              </div>

              {canManage && !isExpired ? (
                <button
                  onClick={() => handleToggleUsed(cp.id, isUsed)}
                  disabled={pendingUsed === cp.id}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60 ${
                    isUsed
                      ? "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
                      : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {pendingUsed === cp.id ? "…" : isUsed
                    ? tPromo("statusUsed", { date: cp.used_at ? formatDate(cp.used_at) : "" })
                    : tPromo("statusActive")}
                </button>
              ) : isUsed ? (
                <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700">
                  {tPromo("statusUsed", { date: cp.used_at ? formatDate(cp.used_at) : "" })}
                </span>
              ) : isExpired ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
                  {tPromo("statusExpired")}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                  {tPromo("statusActive")}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{tPromo("colDate")}</p>
                <p className="text-slate-700">{formatDate(cp.assigned_at)}</p>
              </div>
              {cp.promotion.ends_at && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Ističe</p>
                  <p className={isExpired ? "text-amber-600 font-medium" : "text-slate-700"}>
                    {formatDate(cp.promotion.ends_at)}
                  </p>
                </div>
              )}
              {cp.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{tPromo("colNotes")}</p>
                  <p className="text-slate-700">{cp.notes}</p>
                </div>
              )}
            </div>

            {promoError && <p className="text-xs text-red-500">{promoError}</p>}

            {canManage && (
              <div className="flex justify-end pt-1 border-t border-slate-100">
                {confirmDelete === cp.id ? (
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleRemove(cp.id)}
                      disabled={isPending}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      {tPromo("confirmYes")}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {tPromo("confirmNo")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(cp.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Ukloni promociju
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Add promotion drawer */}
      <AddPromotionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        available={unassigned}
        onAdd={handleAddPromo}
        isPending={isPending}
      />
    </div>
  );
}
