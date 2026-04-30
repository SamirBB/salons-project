"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { assignPromotion, removeClientPromotion, completePromotionTreatment } from "@/app/actions/client-promotions";
import type { ClientPromotion, AvailablePromotion, PromotionTreatment } from "@/app/actions/client-promotions";
import TreatmentForm from "./treatment-form";
import type { Treatment, TreatmentService } from "@/app/actions/clients";
import type { CustomField } from "@/app/actions/custom-fields";

const MAX_PROMOTIONS = 5;
const MAX_NOTES = 500;

type ActiveTab = "prijedlozi" | "karton" | string;

type Employee = { id: string; full_name: string; color: string | null };
type ServiceOption = { id: string; name: string; price: number; category: string | null; color: string | null };

type Props = {
  karton: React.ReactNode;
  prijedlozi: React.ReactNode;
  clientId: string;
  promotions: ClientPromotion[];
  available: AvailablePromotion[];
  canManage: boolean;
  employees: Employee[];
  services: ServiceOption[];
  customFields: CustomField[];
  currentEmployeeId: string | null;
};

/** Convert a PromotionTreatment to the Treatment shape expected by TreatmentForm */
function promoTreatmentToTreatment(tr: PromotionTreatment, clientId: string): Treatment {
  const svc = tr.service
    ? ({ id: tr.service.id, name: tr.service.name, price: 0, color: tr.service.color } as TreatmentService)
    : null;
  return {
    id: tr.id,
    client_id: clientId,
    employee_id: null,
    treated_at: tr.treated_at,
    notes: tr.notes,
    amount_charged: tr.amount_charged,
    invoice_number: tr.invoice_number,
    custom_data: undefined,
    created_at: tr.treated_at,
    created_by: tr.created_by ?? null,
    created_by_name: tr.created_by_name ?? null,
    services: svc ? [svc] : [],
    client_promotion_id: null,
    promotion_treatment_status: tr.promotion_treatment_status,
    promotion_service_type: tr.promotion_service_type,
    is_cancelled: false,
  };
}

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

function formatDate(d: string) {
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}.${m}.${y}.`;
}

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

export default function ClientTabs({ karton, prijedlozi, clientId, promotions, available, canManage, employees, services, customFields, currentEmployeeId }: Props) {
  const t = useTranslations("klijenti.tabs");
  const tPromo = useTranslations("klijenti.clientPromotions");

  const [activeTab, setActiveTab] = useState<ActiveTab>("prijedlozi");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [pendingComplete, setPendingComplete] = useState<string | null>(null);
  const [editTreatmentId, setEditTreatmentId] = useState<string | null>(null);

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

  async function handleCompleteTreatment(treatment: PromotionTreatment, clientPromotionId: string) {
    setPendingComplete(treatment.id);
    setPromoError(null);
    const result = await completePromotionTreatment(treatment.id, clientPromotionId, clientId);
    setPendingComplete(null);
    if (result.error) setPromoError("Greška pri završavanju tretmana.");
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
        const allTreatments = cp.treatments;
        const pending = allTreatments.filter((t) => t.promotion_treatment_status === "pending");
        const total = allTreatments.length;

        return (
          <div className="space-y-4">
            {/* Header — same structure as TreatmentKarton header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{cp.promotion.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {[
                    `Datum: ${formatDate(cp.assigned_at)}`,
                    cp.promotion.ends_at ? `Ističe: ${formatDate(cp.promotion.ends_at)}` : null,
                    cp.promotion.description ? `Opis: ${cp.promotion.description}` : null,
                  ].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-slate-400">
                  {pending.length} / {total} preostalo
                  {cp.created_by_name && (
                    <> · Dodijelio: <span className="text-slate-600">{cp.created_by_name}</span></>
                  )}
                </p>
              </div>

              {/* Right side: remove button */}
              {canManage && (
                <div className="shrink-0">
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
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-200"
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

            {promoError && <p className="text-xs text-red-500">{promoError}</p>}

            {/* Inline edit form */}
            {editTreatmentId && (() => {
              const tr = pending.find((t) => t.id === editTreatmentId);
              if (!tr) return null;
              return (
                <TreatmentForm
                  key={tr.id}
                  clientId={clientId}
                  treatment={promoTreatmentToTreatment(tr, clientId)}
                  employees={employees}
                  services={services}
                  customFields={customFields}
                  currentEmployeeId={currentEmployeeId}
                  onClose={() => setEditTreatmentId(null)}
                />
              );
            })()}

            {/* Treatment list */}
            {allTreatments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <p className="text-slate-400 text-sm">Nema tretmana u ovoj promociji.</p>
              </div>
            ) : (
              <>
                {/* ── Mobile cards (< md) ── */}
                <div className="md:hidden space-y-3">
                  {allTreatments.map((tr, idx) => {
                    const isDone = tr.promotion_treatment_status !== "pending";
                    return (
                      <div
                        key={tr.id}
                        className={`rounded-2xl border p-4 shadow-sm ${
                          isDone
                            ? "bg-slate-50 border-slate-200 opacity-70"
                            : editTreatmentId === tr.id
                            ? "bg-indigo-50/40 border-indigo-200"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        {/* Top row: number + chip + actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className="text-xs text-slate-400 shrink-0 mt-0.5 w-5 tabular-nums">
                              {idx + 1}
                            </span>
                            {tr.service ? (
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${isDone ? "opacity-60 " : ""}${tr.service.color ? "" : "bg-indigo-50 border-indigo-100 text-indigo-700"}`}
                                style={tr.service.color ? { backgroundColor: `${tr.service.color}18`, borderColor: `${tr.service.color}40`, color: tr.service.color } : undefined}
                              >
                                {tr.service.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </div>

                          {isDone ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 shrink-0">
                              Završeno
                            </span>
                          ) : canManage && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setEditTreatmentId(editTreatmentId === tr.id ? null : tr.id)}
                                className={`rounded p-1.5 transition-colors ${editTreatmentId === tr.id ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-500"}`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleCompleteTreatment(tr, cp.id)}
                                disabled={pendingComplete === tr.id}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                              >
                                {pendingComplete === tr.id ? "…" : "Završi"}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div className="mt-2 text-sm font-medium text-slate-700">
                          {formatDateTime(tr.treated_at)}
                        </div>

                        {/* Notes */}
                        {tr.notes && (
                          <div className="mt-1 text-xs text-slate-500">{tr.notes}</div>
                        )}

                        {/* Amount + Invoice */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-400">{tr.invoice_number || "—"}</span>
                          <span className="text-sm font-semibold text-slate-800">
                            {tr.amount_charged != null
                              ? tr.amount_charged.toFixed(2).replace(".", ",") + " €"
                              : "—"}
                          </span>
                        </div>

                        {/* Created by */}
                        {tr.created_by_name && (
                          <div className="mt-1.5 text-xs text-slate-400">
                            Kreirao: <span className="text-slate-600">{tr.created_by_name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                              Usluge
                            </span>
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                              </svg>
                              Datum
                            </span>
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                              </svg>
                              Napomena
                            </span>
                          </th>
                          <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                            <span className="inline-flex items-center justify-end gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Iznos
                            </span>
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                              </svg>
                              Račun
                            </span>
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                              </svg>
                              Kreirao
                            </span>
                          </th>
                          {canManage && <th className="px-4 py-3 w-32" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allTreatments.map((tr, idx) => {
                          const isDone = tr.promotion_treatment_status !== "pending";
                          return (
                          <tr key={tr.id} className={`transition-colors ${isDone ? "bg-slate-50/60" : editTreatmentId === tr.id ? "bg-indigo-50/40" : "hover:bg-slate-50/70"}`}>
                            <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 max-w-[220px]">
                              {tr.service ? (
                                <div className="flex flex-wrap gap-1">
                                  <span
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${isDone ? "opacity-50 " : ""}${tr.service.color ? "" : "bg-indigo-50 border-indigo-100 text-indigo-700"}`}
                                    style={tr.service.color ? { backgroundColor: `${tr.service.color}18`, borderColor: `${tr.service.color}40`, color: tr.service.color } : undefined}
                                  >
                                    {tr.service.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-sm whitespace-nowrap ${isDone ? "text-slate-400" : "text-slate-600"}`}>
                              {formatDateTime(tr.treated_at)}
                            </td>
                            <td className="px-4 py-3 max-w-[240px]">
                              <div className={`text-sm truncate ${isDone ? "text-slate-400" : "text-slate-600"}`} title={tr.notes ?? ""}>
                                {tr.notes || <span className="text-slate-300">—</span>}
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-right text-sm whitespace-nowrap tabular-nums ${isDone ? "font-normal text-slate-400" : "font-semibold text-slate-800"}`}>
                              {tr.amount_charged != null
                                ? tr.amount_charged.toFixed(2).replace(".", ",") + " €"
                                : <span className="font-normal text-slate-300">—</span>}
                            </td>
                            <td className={`px-4 py-3 text-xs ${isDone ? "text-slate-400" : "text-slate-500"}`}>
                              {tr.invoice_number || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {tr.created_by_name || <span className="text-slate-300">—</span>}
                            </td>
                            {canManage && (
                              <td className="px-4 py-3">
                                {isDone ? (
                                  <div className="flex justify-end">
                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                      Završeno
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-0.5">
                                    <Tip label="Uredi tretman">
                                      <button
                                        onClick={() => setEditTreatmentId(editTreatmentId === tr.id ? null : tr.id)}
                                        className={`rounded-lg p-1.5 transition-colors ${editTreatmentId === tr.id ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-500"}`}
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                    </Tip>
                                    <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                    <Tip label="Završi tretman">
                                      <button
                                        onClick={() => handleCompleteTreatment(tr, cp.id)}
                                        disabled={pendingComplete === tr.id}
                                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                                      >
                                        {pendingComplete === tr.id ? "…" : "Završi"}
                                      </button>
                                    </Tip>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
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
