"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/app/actions/locale";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/locale";

const LOCALE_CONFIG: Record<Locale, { flag: string; label: string; short: string }> = {
  bs: { flag: "🇧🇦", label: "Bosanski",   short: "BS" },
  hr: { flag: "🇭🇷", label: "Hrvatski",   short: "HR" },
  en: { flag: "🇬🇧", label: "English",    short: "EN" },
  sl: { flag: "🇸🇮", label: "Slovenščina",short: "SL" },
  it: { flag: "🇮🇹", label: "Italiano",   short: "IT" },
  es: { flag: "🇪🇸", label: "Español",    short: "ES" },
};

export default function LanguageSwitcher() {
  const t = useTranslations("language");
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(locale: Locale) {
    setOpen(false);
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  const current = LOCALE_CONFIG[currentLocale];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
        aria-label={t("label")}
      >
        <span>{current.flag}</span>
        <span className="text-xs font-medium">{current.short}</span>
        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {SUPPORTED_LOCALES.map((locale) => {
              const config = LOCALE_CONFIG[locale];
              return (
                <button
                  key={locale}
                  type="button"
                  onClick={() => handleSelect(locale)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${
                    locale === currentLocale
                      ? "text-indigo-600 font-medium"
                      : "text-slate-700"
                  }`}
                >
                  <span>{config.flag}</span>
                  <span>{config.label}</span>
                  {locale === currentLocale && (
                    <svg className="ml-auto h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
