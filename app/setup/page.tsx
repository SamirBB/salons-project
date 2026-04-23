"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createTenant } from "@/app/actions/setup";
import { logout } from "@/app/actions/auth";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

type DayHours = { open: string; close: string; closed: boolean };
type WorkingHours = Record<string, DayHours>;

const DEFAULT_WORKING_HOURS: WorkingHours = {
  "1": { open: "09:00", close: "18:00", closed: false }, // Monday
  "2": { open: "09:00", close: "18:00", closed: false }, // Tuesday
  "3": { open: "09:00", close: "18:00", closed: false }, // Wednesday
  "4": { open: "09:00", close: "18:00", closed: false }, // Thursday
  "5": { open: "09:00", close: "18:00", closed: false }, // Friday
  "6": { open: "09:00", close: "14:00", closed: false }, // Saturday
  "0": { open: "09:00", close: "18:00", closed: true },  // Sunday
};

// Days ordered Mon–Sun (1=Mon, 2=Tue, ..., 6=Sat, 0=Sun)
const DAY_ORDER = ["1", "2", "3", "4", "5", "6", "0"];

const DAY_KEYS: Record<string, "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"> = {
  "0": "sunday",
  "1": "monday",
  "2": "tuesday",
  "3": "wednesday",
  "4": "thursday",
  "5": "friday",
  "6": "saturday",
};

export default function SetupPage() {
  const [state, action, pending] = useActionState(createTenant, undefined);
  const t = useTranslations("setup");


  const [step, setStep] = useState(1);

  // Step 1 data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 data
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);

  const updateDay = (dayKey: string, field: keyof DayHours, value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  const stepTitles = [t("step1Title"), t("step2Title"), t("step3Title")];

  // Summary helpers
  const getWorkingHoursSummary = () => {
    const lines: string[] = [];

    // Group consecutive open days with same hours
    let i = 0;
    while (i < DAY_ORDER.length) {
      const dayKey = DAY_ORDER[i];
      const day = workingHours[dayKey];
      if (day.closed) {
        lines.push(`${t(`workingHours.${DAY_KEYS[dayKey]}`).slice(0, 3)}: ${t("workingHours.closed")}`);
        i++;
      } else {
        // Try to group with next days having same hours
        let j = i + 1;
        while (
          j < DAY_ORDER.length &&
          !workingHours[DAY_ORDER[j]].closed &&
          workingHours[DAY_ORDER[j]].open === day.open &&
          workingHours[DAY_ORDER[j]].close === day.close
        ) {
          j++;
        }
        if (j - i > 1) {
          const startLabel = t(`workingHours.${DAY_KEYS[DAY_ORDER[i]]}`).slice(0, 3);
          const endLabel = t(`workingHours.${DAY_KEYS[DAY_ORDER[j - 1]]}`).slice(0, 3);
          lines.push(`${startLabel}–${endLabel}: ${day.open}–${day.close}`);
        } else {
          lines.push(`${t(`workingHours.${DAY_KEYS[dayKey]}`).slice(0, 3)}: ${day.open}–${day.close}`);
        }
        i = j;
      }
    }
    return lines;
  };

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
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((s, idx) => (
              <div key={s} className="contents">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${
                    step >= s
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-300 text-slate-400"
                  }`}
                >
                  {step > s ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                {idx < 2 && <div className={`h-px flex-1 transition-colors ${step > s ? "bg-indigo-400" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mb-6">
            {t("stepOf", { current: step, total: 3 })} — {stepTitles[step - 1]}
          </p>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t("salonNameLabel")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("salonNamePlaceholder")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("phoneLabel")}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("cityLabel")}
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t("cityPlaceholder")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t("addressLabel")}
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("addressPlaceholder")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {t("next")}
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                {DAY_ORDER.map((dayKey) => {
                  const day = workingHours[dayKey];
                  const dayName = t(`workingHours.${DAY_KEYS[dayKey]}`);
                  return (
                    <div key={dayKey} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
                      <span className="w-28 text-sm font-medium text-slate-700 shrink-0">{dayName}</span>

                      {/* Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!day.closed}
                        onClick={() => updateDay(dayKey, "closed", !day.closed)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                          !day.closed ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                            !day.closed ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>

                      {day.closed ? (
                        <span className="text-sm text-slate-400 italic">{t("workingHours.closed")}</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs text-slate-500">{t("workingHours.from")}</span>
                          <input
                            type="time"
                            value={day.open}
                            onChange={(e) => updateDay(dayKey, "open", e.target.value)}
                            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                          />
                          <span className="text-xs text-slate-500">{t("workingHours.to")}</span>
                          <input
                            type="time"
                            value={day.close}
                            onChange={(e) => updateDay(dayKey, "close", e.target.value)}
                            className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  {t("next")}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <form action={action} className="space-y-4">
              {/* Hidden fields */}
              <input type="hidden" name="name" value={name} />
              <input type="hidden" name="phone" value={phone} />
              <input type="hidden" name="city" value={city} />
              <input type="hidden" name="address" value={address} />
              <input type="hidden" name="working_hours" value={JSON.stringify(workingHours)} />

              {/* Summary card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    {t("confirmation.salonInfo")}
                  </p>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p><span className="font-medium">{t("salonNameLabel")}:</span> {name}</p>
                    {phone && <p><span className="font-medium">{t("phoneLabel")}:</span> {phone}</p>}
                    {city && <p><span className="font-medium">{t("cityLabel")}:</span> {city}</p>}
                    {address && <p><span className="font-medium">{t("addressLabel")}:</span> {address}</p>}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    {t("confirmation.workingHours")}
                  </p>
                  <div className="space-y-1 text-sm text-slate-700">
                    {getWorkingHoursSummary().map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>

              {state?.error && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                  {state.error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={pending}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {t("back")}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {pending ? t("submitting") : t("confirmation.createBtn")}
                </button>
              </div>
            </form>
          )}
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
