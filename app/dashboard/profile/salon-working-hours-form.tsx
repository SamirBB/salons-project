"use client";

import { useEffect, useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateSalon } from "@/app/actions/salon";
import { DAY_KEYS, mergeWithDefaults } from "@/lib/salon-working-hours";

type TenantSnapshot = {
  name: string;
  phone: string;
  city: string;
  address: string;
  workingHours: Record<string, unknown>;
};

export default function SalonWorkingHoursForm({ initialData }: { initialData: TenantSnapshot }) {
  const t = useTranslations("salon");
  const tSetup = useTranslations("setup");
  const router = useRouter();
  const [state, action, pending] = useActionState(updateSalon, undefined);
  const [hours, setHours] = useState(() => mergeWithDefaults(initialData.workingHours));

  function updateDay(key: string, field: "open" | "close" | "closed", value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="name" value={initialData.name} />
      <input type="hidden" name="phone" value={initialData.phone} />
      <input type="hidden" name="city" value={initialData.city} />
      <input type="hidden" name="address" value={initialData.address} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">{tSetup("step2Title")}</h3>

        <div className="divide-y divide-slate-100">
          {DAY_KEYS.map(({ key, t: dayKey }) => {
            const day = hours[key];
            return (
              <div key={key} className="flex flex-wrap items-center gap-3 py-3">
                <button
                  type="button"
                  onClick={() => updateDay(key, "closed", !day.closed)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                    day.closed ? "bg-slate-200" : "bg-indigo-600"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      day.closed ? "translate-x-0" : "translate-x-4"
                    }`}
                  />
                </button>

                <span className="w-28 text-sm font-medium text-slate-700">
                  {tSetup(`workingHours.${dayKey}` as "workingHours.monday")}
                </span>

                {day.closed ? (
                  <span className="text-sm text-slate-400">{tSetup("workingHours.closed")}</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">{tSetup("workingHours.from")}</span>
                    <input
                      type="time"
                      value={day.open}
                      onChange={(e) => updateDay(key, "open", e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    />
                    <span className="text-xs text-slate-500">{tSetup("workingHours.to")}</span>
                    <input
                      type="time"
                      value={day.close}
                      onChange={(e) => updateDay(key, "close", e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <input type="hidden" name="working_hours" value={JSON.stringify(hours)} />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
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
