"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createTenant } from "@/app/actions/setup";
import { logout } from "@/app/actions/auth";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

export default function SetupPage() {
  const [state, action, pending] = useActionState(createTenant, undefined);
  const t = useTranslations("setup");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Language switcher top-right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 2.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs font-semibold text-white">1</div>
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 text-xs font-medium text-slate-400">2</div>
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 text-xs font-medium text-slate-400">3</div>
          </div>
          <p className="text-xs text-slate-500 mb-6">{t("step1")}</p>

          <form action={action} className="space-y-4">
            {/* Naziv */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("salonNameLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder={t("salonNamePlaceholder")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Telefon */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t("phoneLabel")}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Grad */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t("cityLabel")}
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder={t("cityPlaceholder")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Adresa */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("addressLabel")}
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder={t("addressPlaceholder")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {state?.error && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? t("submitLoading") : t("submitButton")}
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-slate-500 mt-4">
          {t("otherAccount")}{" "}
          <form action={logout} className="inline">
            <button type="submit" className="text-indigo-600 hover:text-indigo-500 font-medium">
              {t("logout")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
