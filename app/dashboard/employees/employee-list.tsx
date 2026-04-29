"use client";

import { useState, useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { removeEmployee } from "@/app/actions/employees";

type Employee = {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  color: string | null;
  is_active: boolean;
};

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

export default function EmployeeList({ employees, canManage }: { employees: Employee[]; canManage: boolean }) {
  const t = useTranslations("uposlenici");
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Stats
  const activeCount = useMemo(() => employees.filter((e) => e.is_active).length, [employees]);
  const inactiveCount = useMemo(() => employees.filter((e) => !e.is_active).length, [employees]);

  // Filtered (always sorted name A-Z)
  const filtered = useMemo(() => {
    let list = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.job_title ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((e) => e.is_active);
    if (statusFilter === "inactive") list = list.filter((e) => !e.is_active);
    return list.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [employees, search, statusFilter]);

  function handleDeleteConfirm(e: React.MouseEvent, empId: string) {
    e.stopPropagation();
    setLoadingId(empId);
    startTransition(async () => { await removeEmployee(empId); setLoadingId(null); setConfirmDeleteId(null); });
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="text-4xl mb-3">👥</div>
        <p className="text-slate-500 text-sm">{t("noEmployees")}</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          count={employees.length}
          label={t("statsTotal")}
          sub={t("statsAllEmployees")}
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
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-400 text-sm">{search ? t("noSearchResults") : t("noEmployees")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* ── Mobile cards (< md) ── */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map((emp) => (
              <div key={emp.id} onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50/70 transition-colors ${!emp.is_active ? "opacity-60" : ""}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: emp.color ?? "#6366f1" }}>
                  {emp.full_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{emp.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                  {emp.job_title && <p className="text-xs text-slate-400 mt-0.5">{emp.job_title}</p>}
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${emp.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  {emp.is_active ? t("active") : t("inactive")}
                </span>
                <svg className="h-4 w-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            ))}
          </div>

          {/* ── Desktop table (≥ md) ── */}
          <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-22rem)]">
            <table className="w-full text-sm min-w-[600px]">
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
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                      {t("colEmail")}
                    </span>
                  </th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>
                      {t("colJobTitle")}
                    </span>
                  </th>
                  <th className="px-4 py-3">{t("colStatus")}</th>
                  {canManage && <th className="px-4 py-3 text-right">{t("listActions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} role="button" tabIndex={0}
                    onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/dashboard/employees/${emp.id}`); } }}
                    className={`group cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 hover:bg-slate-50/70 ${!emp.is_active ? "opacity-60" : ""}`}
                  >
                    {/* Avatar */}
                    <td className="px-4 py-3.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0"
                        style={{ backgroundColor: emp.color ?? "#6366f1" }}>
                        {emp.full_name[0]}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                      {emp.full_name}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[14rem] truncate">
                      {emp.email || <span className="text-slate-300">—</span>}
                    </td>

                    {/* Job title */}
                    <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {emp.job_title ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {emp.job_title}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      {emp.is_active ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{t("active")}</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">{t("inactive")}</span>
                      )}
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-0.5">
                          {confirmDeleteId === emp.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500 mr-1">{t("confirmDelete")}</span>
                              <button type="button" disabled={loadingId === emp.id}
                                onClick={(e) => handleDeleteConfirm(e, emp.id)}
                                className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                                {t("yes")}
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                                {t("no")}
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Edit */}
                              <Tip label={t("editAria")}>
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/employees/${emp.id}`); }}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </Tip>
                              <div className="w-px h-4 bg-slate-200 mx-0.5" />
                              {/* Delete */}
                              <Tip label={t("deleteEmployee")}>
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(emp.id); }}
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
              {t("showing", { count: filtered.length, total: employees.length })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
