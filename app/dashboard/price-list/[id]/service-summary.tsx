"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ServiceForm from "../service-form";
import { formatServiceDuration } from "@/lib/service-ui";
import type { Service } from "@/app/actions/services";

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
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm text-slate-800 break-words">{children}</div>
      </div>
    </div>
  );
}

export default function ServiceSummary({ service }: { service: Service }) {
  const t = useTranslations("cjenovnik");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const dur = formatServiceDuration(service.duration_minutes, t("min"));

  function openDrawer() {
    setFormKey((k) => k + 1);
    setDrawerOpen(true);
  }

  const editBtn = (
    <button
      type="button"
      onClick={openDrawer}
      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      {t("editButton")}
    </button>
  );

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className="h-9 w-9 shrink-0 rounded-full border border-slate-200 shadow-sm ring-2 ring-white"
            style={{ backgroundColor: service.color ?? "#6366f1" }}
            aria-hidden
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 leading-tight">{service.name}</h2>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  service.is_active
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {service.is_active ? t("active") : t("inactive")}
              </span>
            </div>
          </div>

          <div className="hidden sm:block shrink-0">{editBtn}</div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-y-3 sm:grid-cols-3 sm:gap-x-6">
          <InfoRowIcon
            label={t("categoryLabel")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              </svg>
            }
          >
            <span className={service.category?.trim() ? undefined : "text-slate-400"}>
              {service.category?.trim() || "—"}
            </span>
          </InfoRowIcon>

          <InfoRowIcon
            label={t("durationLabel")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <span>{dur}</span>
          </InfoRowIcon>

          <InfoRowIcon
            label={t("priceLabel")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <span>
              {typeof service.price === "number"
                ? `${service.price.toFixed(2)}\u00a0€`
                : `${Number(service.price).toFixed(2)}\u00a0€`}
            </span>
          </InfoRowIcon>
        </div>

        {/* Interna napomena — isti blok kao Posebna napomena na detalju klienta */}
        {service.internal_note?.trim() && (
          <div className="mt-3 border-t border-slate-100 pt-3 min-w-0">
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2.5 border-l-[3px] border-l-red-400">
              <svg
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                  {t("internalNoteLabel")}
                </p>
                <p className="mt-0.5 text-sm font-medium text-red-700 break-words leading-snug whitespace-pre-line">
                  {service.internal_note.trim()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex sm:hidden flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">{editBtn}</div>
      </div>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">{t("editServiceTitle")}</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <ServiceForm
                key={formKey}
                mode="edit"
                service={service}
                drawer
                onCloseDrawer={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
