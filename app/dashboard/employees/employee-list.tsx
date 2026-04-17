"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toggleEmployeeStatus, removeEmployee } from "@/app/actions/employees";

type Employee = {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  color: string | null;
  is_active: boolean;
};

export default function EmployeeList({
  employees,
  canManage,
}: {
  employees: Employee[];
  canManage: boolean;
}) {
  const t = useTranslations("uposlenici");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.job_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleToggle(e: React.MouseEvent, emp: Employee) {
    e.stopPropagation();
    setLoadingId(emp.id);
    startTransition(async () => {
      await toggleEmployeeStatus(emp.id, emp.is_active);
      setLoadingId(null);
    });
  }

  function handleDeleteClick(e: React.MouseEvent, empId: string) {
    e.stopPropagation();
    setConfirmDeleteId(empId);
  }

  function handleDeleteConfirm(e: React.MouseEvent, empId: string) {
    e.stopPropagation();
    setLoadingId(empId);
    startTransition(async () => {
      await removeEmployee(empId);
      setLoadingId(null);
      setConfirmDeleteId(null);
    });
  }

  function handleDeleteCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmDeleteId(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header + Search */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{t("allEmployees")}</h3>
        <div className="relative w-full sm:w-56">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {filtered.map((emp) => (
            <li
              key={emp.id}
              onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
            >
              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: emp.color ?? "#6366f1" }}
              >
                {emp.full_name[0]}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{emp.full_name}</p>
                <p className="text-xs text-slate-500">{emp.email}</p>
              </div>

              {emp.job_title && (
                <span className="text-xs text-slate-500 hidden sm:block">{emp.job_title}</span>
              )}

              {/* Status toggle */}
              {canManage ? (
                <button
                  type="button"
                  disabled={loadingId === emp.id || isPending}
                  onClick={(e) => handleToggle(e, emp)}
                  title={emp.is_active ? t("setInactive") : t("setActive")}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors disabled:opacity-50 ${
                    emp.is_active
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {loadingId === emp.id ? "..." : emp.is_active ? t("active") : t("inactive")}
                </button>
              ) : (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  emp.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {emp.is_active ? t("active") : t("inactive")}
                </span>
              )}

              {/* Delete */}
              {canManage && (
                confirmDeleteId === emp.id ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-slate-500">{t("confirmDelete")}</span>
                    <button
                      type="button"
                      disabled={loadingId === emp.id}
                      onClick={(e) => handleDeleteConfirm(e, emp.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {t("yes")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCancel}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      {t("no")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, emp.id)}
                    title={t("deleteEmployee")}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )
              )}

              {/* Chevron */}
              <svg
                className="h-4 w-4 text-slate-300 group-hover:text-slate-400 shrink-0 transition-colors"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          {search ? t("noSearchResults") : t("noEmployees")}
        </div>
      )}
    </div>
  );
}
