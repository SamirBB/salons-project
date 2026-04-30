"use client";

import { useEffect, useActionState, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateSalon } from "@/app/actions/salon";
import { mergeWithDefaults } from "@/lib/salon-working-hours";

const WORKING_HOURS_READONLY_JSON = (hw: Record<string, unknown>) =>
  JSON.stringify(mergeWithDefaults(hw));

export default function SalonSettingsForm({
  initialData,
  drawer = false,
  onCloseDrawer,
}: {
  initialData: {
    name: string;
    phone: string;
    city: string;
    address: string;
    workingHours: Record<string, unknown>;
    logoUrl: string | null;
  };
  drawer?: boolean;
  onCloseDrawer?: () => void;
}) {
  const t = useTranslations("salon");
  const tSetup = useTranslations("setup");
  const router = useRouter();
  const [state, action, pending] = useActionState(updateSalon, undefined);

  const preservedWorkingHoursJson = WORKING_HOURS_READONLY_JSON(initialData.workingHours);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    state?.logoUrl ?? initialData.logoUrl
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!state?.success) return;
    if (drawer && onCloseDrawer) {
      router.refresh();
      onCloseDrawer();
    }
  }, [state, drawer, onCloseDrawer, router]);

  return (
    <form action={action} className="space-y-5">
      {/* Logo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("logo")}</h3>
        <div className="flex items-center gap-5">
          {/* Preview */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Logo"
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            )}
          </div>

          {/* Upload info */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {logoPreview ? t("changeLogo") : t("uploadLogo")}
            </button>
            <p className="text-xs text-slate-400">{t("logoHint")}</p>
            {logoPreview && (
              <button
                type="button"
                onClick={() => {
                  setLogoPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-red-500 hover:text-red-600"
              >
                {t("removeLogo")}
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="logo"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleLogoChange}
          className="hidden"
        />
      </div>

      {/* Osnovni podaci */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">{t("basicInfo")}</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {tSetup("salonNameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={initialData.name}
            placeholder={tSetup("salonNamePlaceholder")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {tSetup("phoneLabel")}
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={initialData.phone}
              placeholder={tSetup("phonePlaceholder")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {tSetup("cityLabel")}
            </label>
            <input
              name="city"
              type="text"
              defaultValue={initialData.city}
              placeholder={tSetup("cityPlaceholder")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {tSetup("addressLabel")}
          </label>
          <input
            name="address"
            type="text"
            defaultValue={initialData.address}
            placeholder={tSetup("addressPlaceholder")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <input type="hidden" name="working_hours" value={preservedWorkingHoursJson} />

      {/* Feedback */}
      {state?.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && !drawer && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-3.5 py-2.5 text-sm text-green-700">
          {t("saveSuccess")}
        </p>
      )}

      <div className="flex justify-start">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? t("saving") : t("saveButton")}
        </button>
      </div>
    </form>
  );
}
