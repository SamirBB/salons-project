"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { logout } from "@/app/actions/auth";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import type { Locale } from "@/lib/locale";

function capitalizeWeekdayLong(name: string, intlLocale: string): string {
  if (!name) return name;
  const first = name.charAt(0).toLocaleUpperCase(intlLocale);
  return first + name.slice(1);
}

function capitalizeFirstLetter(value: string, intlLocale: string): string {
  if (!value) return value;
  const first = value.charAt(0).toLocaleUpperCase(intlLocale);
  return first + value.slice(1);
}

function intlLocaleForApp(locale: Locale): string {
  switch (locale) {
    case "bs":
      return "bs-BA";
    case "hr":
      return "hr-HR";
    case "sl":
      return "sl-SI";
    default:
      return "en-GB";
  }
}

export default function Topbar({
  userEmail,
  pageTitle,
  locale,
  onMenuClick,
}: {
  userEmail: string;
  pageTitle: string;
  locale: Locale;
  onMenuClick: () => void;
}) {
  const t = useTranslations("topbar");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock = useMemo(() => {
    const iso = now.toISOString();
    const dow = now.getDay();
    const dayNum = now.getDate();
    const monthIndex = now.getMonth();
    const yearNum = now.getFullYear();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const timeDigits = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

    if (locale === "bs") {
      const monthName = capitalizeFirstLetter(
        t(`clock.month.${monthIndex}` as "clock.month.0"),
        "bs-BA"
      );
      return {
        weekdayLong: t(`clock.weekdayLong.${dow}` as "clock.weekdayLong.0"),
        weekdayShort: t(`clock.weekdayShort.${dow}` as "clock.weekdayShort.0"),
        dateStr: `${dayNum}. ${monthName} ${yearNum}.`,
        timeStr: timeDigits,
        iso,
      };
    }

    const loc = intlLocaleForApp(locale);
    let weekdayLong = new Intl.DateTimeFormat(loc, { weekday: "long" }).format(now);
    if (locale === "hr" || locale === "sl") {
      weekdayLong = capitalizeWeekdayLong(weekdayLong, loc);
    }
    const weekdayShort = new Intl.DateTimeFormat(loc, { weekday: "short" }).format(now);
    const dateParts = new Intl.DateTimeFormat(loc, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(now);
    const dateStr = dateParts
      .map((part) =>
        part.type === "month" ? capitalizeFirstLetter(part.value, loc) : part.value
      )
      .join("");
    const timeStr = new Intl.DateTimeFormat(loc, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
    return { weekdayLong, weekdayShort, dateStr, timeStr, iso };
  }, [now, locale, t]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-4">
      {/* Left: mobile menu + page title */}
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <h1 className="truncate text-sm font-semibold text-slate-900">{pageTitle}</h1>
      </div>

      {/* Center: weekday, calendar date, clock */}
      <div className="flex min-w-0 flex-1 items-center justify-center px-1">
        <time
          dateTime={clock.iso}
          suppressHydrationWarning
          className="max-w-full truncate text-center text-[11px] leading-tight text-slate-600 tabular-nums sm:text-xs md:text-sm"
          aria-label={t("clockAria")}
        >
          <span className="text-slate-500 sm:hidden">{clock.weekdayShort}</span>
          <span className="hidden text-slate-500 sm:inline">{clock.weekdayLong}</span>
          <span className="text-slate-300" aria-hidden="true">
            {" · "}
          </span>
          <span className="font-medium text-slate-800">{clock.dateStr}</span>
          <span className="text-slate-300" aria-hidden="true">
            {" · "}
          </span>
          <span>{clock.timeStr}</span>
        </time>
      </div>

      {/* Right: language switcher + user menu */}
      <div className="flex shrink-0 items-center gap-1">
        <LanguageSwitcher />

        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {userEmail[0].toUpperCase()}
            </div>
            <span className="hidden sm:block max-w-[140px] truncate">{userEmail}</span>
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    {t("logout")}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
