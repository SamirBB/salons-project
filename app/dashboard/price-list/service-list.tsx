"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import { deleteService, duplicateService } from "@/app/actions/services";
import type { Service } from "@/app/actions/services";

type Props = {
  services: Service[];
  canManage: boolean;
};

type SortKey = "name" | "priceAsc" | "priceDesc" | "duration";

function formatDuration(minutes: number, t: ReturnType<typeof useTranslations>): string {
  if (minutes < 60) return `${minutes} ${t("min")}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}${t("min")}` : `${h}h`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
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
function StatCard({ icon, count, label, sub, accent }: {
  icon: React.ReactNode; count: number; label: string; sub: string; accent: string;
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

export default function ServiceList({ services, canManage }: Props) {
  const t = useTranslations("cjenovnik");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");

  // Stats
  const activeCount = useMemo(() => services.filter((s) => s.is_active).length, [services]);
  const categories = useMemo(() => [...new Set(services.map((s) => s.category).filter(Boolean))].sort() as string[], [services]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...services];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || (s.category ?? "").toLowerCase().includes(q));
    }
    if (statusFilter === "active") list = list.filter((s) => s.is_active);
    if (statusFilter === "inactive") list = list.filter((s) => !s.is_active);
    if (categoryFilter !== "all") {
      list = list.filter((s) => (categoryFilter === "__none__" ? !s.category : s.category === categoryFilter));
    }

    list.sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "duration") return a.duration_minutes - b.duration_minutes;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [services, search, statusFilter, categoryFilter, sort]);

  function go(id: string) { router.push(`/dashboard/price-list/${id}`); }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteService(id);
      setConfirmDelete(null);
    });
  }

  function handleDuplicate(id: string) {
    setDuplicatingId(id);
    startTransition(async () => {
      const res = await duplicateService(id);
      setDuplicatingId(null);
      if (res.error) { window.alert(t(`errors.${res.error}`, { defaultValue: t("errors.generic") })); return; }
      router.refresh();
      if (res.id) router.push(`/dashboard/price-list/${res.id}`);
    });
  }

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="text-4xl mb-3">💇</div>
        <p className="text-slate-500 text-sm">{t("noServices")}</p>
        {canManage && <p className="text-slate-400 text-xs mt-1">{t("noServicesHint")}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={
            <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          }
          count={services.length}
          label={t("statsTotal")}
          sub={t("statsAllServices")}
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
            <svg className="h-6 w-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          }
          count={categories.length}
          label={t("statsCategories")}
          sub={t("statsUnique")}
          accent="bg-violet-50"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${statusFilter === "active" ? "bg-emerald-500" : statusFilter === "inactive" ? "bg-slate-400" : "bg-emerald-500"}`} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
            <option value="all">{t("filterStatus")}: {t("filterAll")}</option>
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
              <option value="all">{t("filterCategory")}: {t("filterAll")}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__none__">{t("uncategorised")}</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        )}

        {/* Sort */}
        <div className="relative ml-auto">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
            <option value="name">{t("sortBy")}: {t("sortNameAZ")}</option>
            <option value="priceAsc">{t("sortBy")}: {t("sortPriceAsc")}</option>
            <option value="priceDesc">{t("sortBy")}: {t("sortPriceDesc")}</option>
            <option value="duration">{t("sortBy")}: {t("sortDuration")}</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-400 text-sm">{t("noServices")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-22rem)]">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-100 bg-white text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 w-3" aria-hidden />
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                      {t("colName")}
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                      {t("colCategory")}
                    </span>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t("colDuration")}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t("colPrice")}
                    </span>
                  </th>
                  <th className="px-4 py-3">{t("colStatus")}</th>
                  {canManage && <th className="px-4 py-3 text-right">{t("listActions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} role="button" tabIndex={0}
                    onClick={() => canManage && go(s.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (canManage) go(s.id); } }}
                    className={`group transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 ${canManage ? "cursor-pointer hover:bg-slate-50/70" : ""} ${!s.is_active ? "opacity-60" : ""}`}
                  >
                    {/* Color dot */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color ?? "#6366f1" }} />
                    </td>

                    {/* Name + description */}
                    <td className="px-4 py-3.5 max-w-[14rem]">
                      <p className="font-medium text-slate-800 truncate">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{s.description}</p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {s.category ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {s.category}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formatDuration(s.duration_minutes, t)}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-800 whitespace-nowrap tabular-nums">
                      {formatPrice(s.price)} €
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      {s.is_active ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {t("active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          {t("inactive")}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-0.5">
                          {confirmDelete === s.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500 mr-1">{t("confirmDelete")}</span>
                              <button type="button" disabled={isPending} onClick={() => handleDelete(s.id)}
                                className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                                {t("yes")}
                              </button>
                              <button type="button" disabled={isPending} onClick={() => setConfirmDelete(null)}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                                {t("no")}
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Edit */}
                              <Tip label={t("editAria")}>
                                <button type="button" onClick={() => go(s.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                              </Tip>
                              {/* Duplicate */}
                              <Tip label={t("duplicateAria")}>
                                <button type="button" disabled={duplicatingId === s.id}
                                  onClick={() => handleDuplicate(s.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors">
                                  {duplicatingId === s.id ? (
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                                  )}
                                </button>
                              </Tip>
                              <div className="w-px h-4 bg-slate-200 mx-0.5" />
                              {/* Delete */}
                              <Tip label={t("deleteService")}>
                                <button type="button" onClick={() => setConfirmDelete(s.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <p className="text-xs text-slate-400">
              {t("showing", { count: filtered.length, total: services.length })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
