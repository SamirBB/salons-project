"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import EmployeeBasicForm from "./employee-basic-form";
import { employeeAvatarAccent } from "@/lib/avatar-accent";
import type { Role } from "@/lib/roles";
import { isValidRole } from "@/lib/roles";

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
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800 break-words">{value}</p>
    </div>
  );
}

function InfoRowIcon({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5 min-w-0">
      <span className="mt-0.5 shrink-0 text-slate-400" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm text-slate-800 break-words">{children}</p>
      </div>
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

  const avatar = employeeAvatarAccent(color);
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
          {/* Avatar — ista logika kao na listi: slovo u accent boji, krug svjetlija nijansa */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
            style={{ backgroundColor: avatar.background, color: avatar.foreground }}
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
            </div>
          </div>

          {/* Edit — desktop */}
          <div className="hidden sm:block shrink-0">{editBtn}</div>
        </div>

        {/* Info grid */}
        <div className="mt-3 grid grid-cols-1 gap-y-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6">
          <InfoRowIcon
            label={t("phone")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            }
          >
            <span className={phone?.trim() ? undefined : "text-slate-400"}>
              {phone?.trim() || "—"}
            </span>
          </InfoRowIcon>

          <InfoRowIcon
            label={tEmp("colEmail")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            }
          >
            <span className={email?.trim() ? undefined : "text-slate-400"}>
              {email?.trim() || "—"}
            </span>
          </InfoRowIcon>

          <InfoRowIcon
            label={tEmp("colRole")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
          >
            <span className={isValidRole(role) || role?.trim() ? undefined : "text-slate-400"}>
              {isValidRole(role) ? tRoles(role as Role) : role?.trim() || "—"}
            </span>
          </InfoRowIcon>

          <InfoRowIcon
            label={tEmp("colJobTitle")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
              </svg>
            }
          >
            <span className={jobTitle?.trim() ? undefined : "text-slate-400"}>
              {jobTitle?.trim() || "—"}
            </span>
          </InfoRowIcon>

          {bio?.trim() && (
            <InfoRow label={t("bio")} value={bio} />
          )}
        </div>

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
