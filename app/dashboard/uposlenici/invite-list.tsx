"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Role } from "@/lib/roles";

type Invite = {
  id: string;
  token: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  expired:  "bg-slate-100 text-slate-500 border-slate-200",
};

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("uposlenici");

  async function copy() {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={t("copyInviteLink")}
      className="shrink-0 flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t("copied")}
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          {t("copyLink")}
        </>
      )}
    </button>
  );
}

export default function InviteList({ invitations }: { invitations: Invite[] }) {
  const t = useTranslations("uposlenici");
  const tStatus = useTranslations("inviteStatus");
  const tRoles = useTranslations("roles");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">{t("sentInvitations")}</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {invitations.map((inv) => (
          <li key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{inv.full_name}</p>
              <p className="text-xs text-slate-500">{inv.email}</p>
            </div>

            <span className="text-xs text-slate-500 hidden sm:block">
              {tRoles(inv.role as Role) ?? inv.role}
            </span>

            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[inv.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
              {["pending", "accepted", "expired"].includes(inv.status)
                ? tStatus(inv.status as "pending" | "accepted" | "expired")
                : inv.status}
            </span>

            {/* Kopiraj link samo za pending pozivnice */}
            {inv.status === "pending" && (
              <CopyLinkButton token={inv.token} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
