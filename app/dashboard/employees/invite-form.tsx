"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createInvite } from "@/app/actions/invite";

const INVITABLE_ROLES = ["manager", "employee", "receptionist"] as const;

export default function InviteForm() {
  const [state, action, pending] = useActionState(createInvite, undefined);
  const [copied, setCopied] = useState(false);
  const t = useTranslations("uposlenici");
  const tRoles = useTranslations("roles");

  async function copyLink() {
    if (!state?.inviteUrl) return;
    await navigator.clipboard.writeText(state.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("inviteTitle")}</h3>

      {state?.success && state.inviteUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700 font-medium">{t("inviteCreated")}</p>
          </div>
          <p className="text-xs text-slate-500">{t("shareLink")}</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={state.inviteUrl}
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 font-mono"
            />
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs text-indigo-600 hover:text-indigo-500"
          >
            {t("inviteAnother")}
          </button>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="block text-xs font-medium text-slate-700 mb-1.5">
                {t("fullNameLabel")}
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder={t("fullNamePlaceholder")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
                {t("emailLabel")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-xs font-medium text-slate-700 mb-1.5">
              {t("roleLabel")}
            </label>
            <select
              id="role"
              name="role"
              defaultValue="employee"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>{tRoles(r)}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              <strong>{tRoles("employee")}</strong> &middot;{" "}
              <strong>{tRoles("receptionist")}</strong> &middot;{" "}
              <strong>{tRoles("manager")}</strong>
            </p>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? t("createInviteLoading") : t("createInviteButton")}
          </button>
        </form>
      )}
    </div>
  );
}
