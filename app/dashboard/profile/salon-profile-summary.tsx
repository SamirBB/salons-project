"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import SalonSettingsForm from "./salon-settings-form";

type InitialData = {
  name: string;
  phone: string;
  city: string;
  address: string;
  workingHours: Record<string, unknown>;
  logoUrl: string | null;
};

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

export default function SalonProfileSummary({ initialData }: { initialData: InitialData }) {
  const t = useTranslations("salon");
  const tSetup = useTranslations("setup");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const letter = initialData.name?.trim()?.[0]?.toUpperCase() ?? "?";

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
          <div className="shrink-0">
            {initialData.logoUrl ? (
              <Image
                src={initialData.logoUrl}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover border border-slate-200"
                unoptimized
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
                {letter}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 leading-tight">{initialData.name || "—"}</h2>
          </div>

          <div className="hidden sm:block shrink-0">{editBtn}</div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-y-3 sm:grid-cols-3 sm:gap-x-6">
          <InfoRowIcon
            label={tSetup("phoneLabel")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            }
          >
            <span className={initialData.phone?.trim() ? undefined : "text-slate-400"}>
              {initialData.phone?.trim() || "—"}
            </span>
          </InfoRowIcon>

          <InfoRowIcon
            label={tSetup("cityLabel")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            }
          >
            <span className={initialData.city?.trim() ? undefined : "text-slate-400"}>
              {initialData.city?.trim() || "—"}
            </span>
          </InfoRowIcon>

          <InfoRowIcon
            label={tSetup("addressLabel")}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125a2.25 2.25 0 002.25 2.25H9.75v-6.938a3.376 3.376 0 013.376-3.375h.375a3.376 3.376 0 013.376 3.375V22.5h4.688a2.25 2.25 0 002.25-2.25V9.75M12 21.75h-.008v-.008H12V21.75z" />
              </svg>
            }
          >
            <span className={initialData.address?.trim() ? undefined : "text-slate-400"}>
              {initialData.address?.trim() || "—"}
            </span>
          </InfoRowIcon>
        </div>

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
              <h3 className="text-base font-semibold text-slate-800">{t("editDrawerTitle")}</h3>
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
              <SalonSettingsForm
                key={formKey}
                initialData={initialData}
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
