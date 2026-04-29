"use client";

import { useState, useTransition, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { deleteClient } from "@/app/actions/clients";
import { clientDisplayName, clientInitialLetter } from "@/lib/clients";

export type ClientListRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  is_active: boolean;
  last_visit_at: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  jmb: string | null;
};

type SortKey = "name" | "visitNewest" | "visitOldest";

function ListAvatar({ url, letter }: { url: string | null; letter: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        {letter}
      </div>
    );
  }
  return (
    <Image src={url} alt="" width={32} height={32}
      className="h-8 w-8 shrink-0 rounded-full object-cover border border-slate-200"
      onError={() => setBroken(true)} unoptimized />
  );
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

export default function ClientList({ clients, canManage }: { clients: ClientListRow[]; canManage: boolean }) {
  const t = useTranslations("klijenti");
  const locale = useLocale();
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<SortKey>("name");

  // Stats
  const activeCount = useMemo(() => clients.filter((c) => c.is_active).length, [clients]);
  const inactiveCount = useMemo(() => clients.filter((c) => !c.is_active).length, [clients]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...clients];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        clientDisplayName(c).toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((c) => c.is_active);
    if (statusFilter === "inactive") list = list.filter((c) => !c.is_active);

    list.sort((a, b) => {
      if (sort === "visitNewest") {
        const da = a.last_visit_at ? new Date(a.last_visit_at).getTime() : 0;
        const db = b.last_visit_at ? new Date(b.last_visit_at).getTime() : 0;
        return db - da;
      }
      if (sort === "visitOldest") {
        const da = a.last_visit_at ? new Date(a.last_visit_at).getTime() : Infinity;
        const db = b.last_visit_at ? new Date(b.last_visit_at).getTime() : Infinity;
        return da - db;
      }
      return clientDisplayName(a).localeCompare(clientDisplayName(b));
    });

    return list;
  }, [clients, search, statusFilter, sort]);

  function formatVisit(iso: string | null) {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    } catch { return null; }
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteClient(id); setConfirmDeleteId(null); });
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="text-4xl mb-3">👤</div>
        <p className="text-slate-500 text-sm">{t("noClients")}</p>
        {canManage && <p className="text-slate-400 text-xs mt-1">{t("noClientsHint")}</p>}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          count={clients.length}
          label={t("statsTotal")}
          sub={t("statsAllClients")}
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
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
          count={inactiveCount}
          label={t("statsInactive")}
          sub={t("statsDeactivated")}
          accent="bg-slate-100"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${statusFilter === "inactive" ? "bg-slate-400" : "bg-emerald-500"}`} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
            <option value="all">{t("filterStatus")}: {t("filterAll")}</option>
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>

        {/* Sort */}
        <div className="relative ml-auto">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer">
            <option value="name">{t("sortBy")}: {t("sortNameAZ")}</option>
            <option value="visitNewest">{t("sortBy")}: {t("sortVisitNewest")}</option>
            <option value="visitOldest">{t("sortBy")}: {t("sortVisitOldest")}</option>
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-400 text-sm">{search ? t("noSearchResults") : t("noClients")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* ── Mobile cards (< md) ── */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map((c) => {
              const display = clientDisplayName(c);
              const initial = clientInitialLetter(display);
              const visitLabel = formatVisit(c.last_visit_at);
              return (
                <div key={c.id} onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50/70 transition-colors ${!c.is_active ? "opacity-60" : ""}`}>
                  <ListAvatar url={c.photo_url} letter={initial} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{display}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {visitLabel && <p className="text-xs text-slate-400 mt-0.5">{t("lastVisit")}: {visitLabel}</p>}
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${c.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                    {c.is_active ? t("active") : t("inactive")}
                  </span>
                  <svg className="h-4 w-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              );
            })}
          </div>

          {/* ── Desktop table (≥ md) ── */}
          <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-22rem)]">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-100 bg-white text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 w-10" aria-hidden />
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      {t("colName")}
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                      {t("colPhone")}
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                      {t("colEmail")}
                    </span>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                      {t("colLastVisit")}
                    </span>
                  </th>
                  <th className="px-4 py-3">{t("colStatus")}</th>
                  {canManage && <th className="px-4 py-3 text-right">{t("listActions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const display = clientDisplayName(c);
                  const initial = clientInitialLetter(display);
                  const visitLabel = formatVisit(c.last_visit_at);
                  return (
                    <tr key={c.id} role="button" tabIndex={0}
                      onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/dashboard/clients/${c.id}`); } }}
                      className={`group cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 hover:bg-slate-50/70 ${!c.is_active ? "opacity-60" : ""}`}
                    >
                      {/* Avatar */}
                      <td className="px-4 py-3.5">
                        <ListAvatar url={c.photo_url} letter={initial} />
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5 font-medium text-slate-800 max-w-[12rem] truncate">
                        {display}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                        {c.phone || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[14rem] truncate">
                        {c.email || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Last visit */}
                      <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {visitLabel || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3.5">
                        {c.is_active ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{t("active")}</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">{t("inactive")}</span>
                        )}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end gap-0.5">
                            {confirmDeleteId === c.id ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500 mr-1">{t("deleteConfirm")}?</span>
                                <button type="button" disabled={isPending} onClick={() => handleDelete(c.id)}
                                  className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                                  Da
                                </button>
                                <button type="button" disabled={isPending} onClick={() => setConfirmDeleteId(null)}
                                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors">
                                  Ne
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* Edit */}
                                <Tip label={t("editAria")}>
                                  <button type="button"
                                    onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </Tip>
                                <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                {/* Delete */}
                                <Tip label={t("deleteAria")}>
                                  <button type="button" onClick={() => setConfirmDeleteId(c.id)}
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <p className="text-xs text-slate-400">
              {t("showing", { count: filtered.length, total: clients.length })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
