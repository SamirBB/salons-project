"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import EmployeeBasicForm from "./employee-basic-form";

type Props = {
  employeeId: string;
  profileId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  bio: string | null;
  color: string;
  isActive: boolean;
  role: string;
  canManage: boolean;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 break-words">{value}</dd>
    </div>
  );
}

export default function EmployeeSummary({
  employeeId,
  profileId,
  fullName,
  email,
  phone,
  jobTitle,
  bio,
  color,
  isActive,
  role,
  canManage,
}: Props) {
  const t = useTranslations("employeeDetail");
  const tEmp = useTranslations("uposlenici");
  const tRoles = useTranslations("roles");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initial = fullName[0]?.toUpperCase() ?? "?";

  const editBtn = canManage && (
    <button
      onClick={() => setDrawerOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      Uredi
    </button>
  );

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Top row: avatar + name/badges + desktop edit */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {initial}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 leading-tight">{fullName}</h2>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  isActive
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {isActive ? tEmp("active") : tEmp("inactive")}
              </span>
              <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {tRoles(role as "owner")}
              </span>
              {jobTitle && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {jobTitle}
                </span>
              )}
            </div>
          </div>

          {/* Edit — desktop */}
          <div className="hidden sm:block shrink-0">{editBtn}</div>
        </div>

        {/* Info grid */}
        <dl className="mt-3 grid grid-cols-1 gap-y-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6">
          <InfoRow label={t("phone")} value={phone ?? ""} />
          <InfoRow label="Email" value={email} />
          {bio && <InfoRow label={t("bio")} value={bio} />}
        </dl>

        {/* Edit — mobile */}
        {canManage && (
          <div className="flex sm:hidden flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            {editBtn}
          </div>
        )}
      </div>

      {/* Edit drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">Uredi uposlenika</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <EmployeeBasicForm
                employeeId={employeeId}
                profileId={profileId}
                canManage={canManage}
                noCard
                initialData={{
                  full_name: fullName,
                  email,
                  phone,
                  job_title: jobTitle,
                  color,
                  bio,
                  role,
                }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
