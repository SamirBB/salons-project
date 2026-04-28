"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import ClientForm from "../client-form";
import type { ClientFormInitial } from "../client-form";

type Props = {
  clientId: string;
  display: string;
  initialLetter: string;
  photoUrl: string | null;
  isActive: boolean;
  canManage: boolean;
  initial: ClientFormInitial;
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

export default function ClientSummary({
  clientId,
  display,
  initialLetter,
  photoUrl,
  isActive,
  canManage,
  initial,
}: Props) {
  const t = useTranslations("klijenti");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addressParts = [initial.street, initial.city, initial.postal_code].filter(Boolean);
  const address = addressParts.join(", ");

  const reviews: string[] = [
    initial.google_reviewed ? "G" : null,
    initial.facebook_reviewed ? "f" : null,
    initial.instagram_reviewed ? "In" : null,
  ].filter((x): x is string => x !== null);

  // Shared action buttons (reused on mobile + desktop)
  const actionButtons = (
    <>
      {canManage && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Uredi
        </button>
      )}
      <a
        href={`/api/dashboard/clients/export?format=xlsx&clientId=${encodeURIComponent(clientId)}`}
        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        {t("exportClientExcel")}
      </a>
      <a
        href={`/api/dashboard/clients/export?format=pdf&clientId=${encodeURIComponent(clientId)}`}
        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        {t("exportClientPdf")}
      </a>
    </>
  );

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Top row: Avatar + Name + Desktop actions */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover border border-slate-200"
                unoptimized
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
                {initialLetter}
              </div>
            )}
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 leading-tight">{display}</h2>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {isActive ? t("active") : t("inactive")}
              </span>
              {reviews.length > 0 && (
                <div className="flex gap-1">
                  {reviews.map((abbr) => (
                    <span
                      key={abbr}
                      className="inline-flex h-5 w-5 items-center justify-center rounded border border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-700"
                    >
                      <span className="line-through decoration-2 decoration-slate-600">{abbr}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions — desktop only (sm+) */}
          <div className="hidden sm:flex shrink-0 flex-wrap items-center gap-2">
            {actionButtons}
          </div>
        </div>

        {/* Info grid */}
        <dl className="mt-3 grid grid-cols-1 gap-y-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6">
          <InfoRow label={t("phoneLabel")} value={initial.phone} />

          {/* Special note — after phone on mobile, half-width last row on lg+ */}
          {initial.notes && (
            <div className="sm:col-span-2 lg:col-span-2 sm:order-last min-w-0">
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2.5 border-l-[3px] border-l-red-400">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">{t("specialNoteLabel")}</p>
                  <p className="mt-0.5 text-sm font-medium text-red-700 break-words leading-snug">{initial.notes}</p>
                </div>
              </div>
            </div>
          )}

          <InfoRow label={t("emailLabel")} value={initial.email} />
          <InfoRow label={t("dateOfBirthLabel")} value={initial.date_of_birth} />
          {address && <InfoRow label={t("streetLabel")} value={address} />}
        </dl>

        {/* Actions — mobile only (below info) */}
        <div className="flex sm:hidden flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
          {actionButtons}
        </div>
      </div>

      {/* Edit drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">Uredi klijenta</h3>
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
              <ClientForm
                mode="edit"
                clientId={clientId}
                canManage={canManage}
                initial={initial}
                onSaved={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
