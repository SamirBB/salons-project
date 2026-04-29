"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import type { Promotion } from "@/app/actions/promotions";
import { deletePromotion, duplicatePromotion } from "@/app/actions/promotions";
import { promotionLinkedServiceName } from "@/lib/promotion-utils";

export type PromotionListRow = Promotion & {
  starts_at_display: string;
  ends_at_display: string;
};

type Props = {
  promotions: PromotionListRow[];
  canManage: boolean;
};

type StatusFilter = "all" | "active" | "expired" | "inactive";
type SortKey = "newest" | "oldest" | "name";

function isExpired(p: PromotionListRow) {
  return !!p.ends_at && new Date(p.ends_at) < new Date();
}

function promotionTypeLabel(t: (key: string) => string, code: string): string {
  switch (code) {
    case "bundle": return t("promotionTypeBundle");
    case "discount": return t("promotionTypeDiscount");
    case "other": return t("promotionTypeOther");
    default: return code;
  }
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
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

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, count, label, sub, accent,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{count}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function PromotionList({ promotions, canManage }: Props) {
  const t = useTranslations("promocije");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Filters & sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");

  // Stats
  const activeCount = useMemo(() => promotions.filter((p) => !isExpired(p) && p.is_active).length, [promotions]);
  const expiredCount = useMemo(() => promotions.filter(isExpired).length, [promotions]);

  // Unique types for filter dropdown
  const types = useMemo(() => [...new Set(promotions.map((p) => p.promotion_type))], [promotions]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...promotions];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      list = list.filter((p) => {
        const exp = isExpired(p);
        if (statusFilter === "expired") return exp;
        if (statusFilter === "active") return !exp && p.is_active;
        if (statusFilter === "inactive") return !exp && !p.is_active;
        return true;
      });
    }

    if (typeFilter !== "all") {
      list = list.filter((p) => p.promotion_type === typeFilter);
    }

    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const da = new Date(a.starts_at ?? a.created_at).getTime();
      const db = new Date(b.starts_at ?? b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });

    return list;
  }, [promotions, search, statusFilter, typeFilter, sort]);

  function go(id: string) {
    router.push(`/dashboard/promotions/${id}`);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePromotion(id);
      if (res.error) {
        window.alert(t(`errors.${res.error}`, { defaultValue: t("errors.generic") }));
        return;
      }
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  function handleDuplicate(id: string) {
    setDuplicatingId(id);
    startTransition(async () => {
      const res = await duplicatePromotion(id);
      setDuplicatingId(null);
      if (res.error) {
        window.alert(t(`errors.${res.error}`, { defaultValue: t("errors.generic") }));
        return;
      }
      router.refresh();
      if (res.id) router.push(`/dashboard/promotions/${res.id}`);
    });
  }

  return (
    <div className="space-y-5">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={
            <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
          count={promotions.length}
          label={t("statsTotal")}
          sub={t("statsAllTime")}
          accent="bg-indigo-50"
        />
        <StatCard
          icon={
            <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          count={activeCount}
          label={t("statsActive")}
          sub={t("statsCurrently")}
          accent="bg-emerald-50"
        />
        <StatCard
          icon={
            <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          count={expiredCount}
          label={t("statsExpired")}
          sub={t("statsNoLonger")}
          accent="bg-amber-50"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
            statusFilter === "all" ? "bg-emerald-500" :
            statusFilter === "active" ? "bg-emerald-500" :
            statusFilter === "expired" ? "bg-amber-500" : "bg-slate-400"
          }`} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer"
          >
            <option value="all">{t("filterStatus")}: {t("filterAll")}</option>
            <option value="active">{t("activeYes")}</option>
            <option value="expired">{t("activeExpired")}</option>
            <option value="inactive">{t("activeNo")}</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Type filter */}
        {types.length > 1 && (
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer"
            >
              <option value="all">{t("filterType")}: {t("filterAll")}</option>
              {types.map((tp) => (
                <option key={tp} value={tp}>{promotionTypeLabel(t, tp)}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Sort */}
        <div className="relative ml-auto">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer"
          >
            <option value="newest">{t("sortBy")}: {t("sortNewest")}</option>
            <option value="oldest">{t("sortBy")}: {t("sortOldest")}</option>
            <option value="name">{t("sortBy")}: {t("sortNameAZ")}</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">{t("noPromotions")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Scroll container — header stays sticky */}
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-22rem)]">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-100 bg-white text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 w-3" aria-hidden />
                  <th className="px-4 py-3">{t("listName")}</th>
                  <th className="px-4 py-3">{t("listType")}</th>
                  <th className="px-4 py-3">{t("listService")}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t("listStart")}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t("listEnd")}</th>
                  <th className="px-4 py-3">{t("listActive")}</th>
                  {canManage && <th className="px-4 py-3 text-right">{t("listActions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const exp = isExpired(p);
                  return (
                    <tr
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => go(p.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(p.id); } }}
                      className="group cursor-pointer outline-none transition-colors hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                    >
                      {/* Color dot */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color ?? "#94a3b8" }} />
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5 font-medium text-slate-800 max-w-[10rem] truncate" title={p.name}>
                        {p.name}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                        {promotionTypeLabel(t, p.promotion_type)}
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3.5 text-slate-600 text-xs max-w-[8rem] truncate" title={promotionLinkedServiceName(p) ?? undefined}>
                        {promotionLinkedServiceName(p) ?? <span className="text-slate-300">—</span>}
                      </td>

                      {/* Starts */}
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{p.starts_at_display}</td>

                      {/* Ends */}
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{p.ends_at_display}</td>

                      {/* Status badge */}
                      <td className="px-4 py-3.5">
                        {exp ? (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            {t("activeExpired")}
                          </span>
                        ) : p.is_active ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            {t("activeYes")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                            {t("activeNo")}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end gap-0.5">
                            {confirmDeleteId === p.id ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500 mr-1">{t("confirmDelete")}</span>
                                <button type="button" disabled={isPending} onClick={() => handleDelete(p.id)}
                                  className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                                  {t("yes")}
                                </button>
                                <button type="button" disabled={isPending} onClick={() => setConfirmDeleteId(null)}
                                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                                  {t("no")}
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* Edit */}
                                <Tip label={t("editAria")}>
                                  <button type="button" onClick={() => go(p.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </Tip>
                                {/* Duplicate */}
                                <Tip label={t("duplicateAria")}>
                                  <button type="button" disabled={duplicatingId === p.id}
                                    onClick={() => handleDuplicate(p.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors">
                                    {duplicatingId === p.id ? (
                                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                      </svg>
                                    ) : (
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                      </svg>
                                    )}
                                  </button>
                                </Tip>
                                <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                {/* Delete */}
                                <Tip label={t("listDeleteAria")}>
                                  <button type="button" onClick={() => setConfirmDeleteId(p.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                </Tip>
                                {/* Chevron */}
                                <svg className="ml-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                              </>
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

          {/* Footer count */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <p className="text-xs text-slate-400">
              {t("showing", { count: filtered.length, total: promotions.length })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
