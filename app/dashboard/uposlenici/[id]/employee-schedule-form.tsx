"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateEmployeeSchedule, type WorkingHours } from "@/app/actions/employees";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Day = (typeof DAYS)[number];

type DaySchedule = {
  active: boolean;
  from: string;
  to: string;
};

function buildInitialSchedule(
  employeeSchedule: WorkingHours,
  salonSchedule: WorkingHours
): Record<Day, DaySchedule> {
  const result = {} as Record<Day, DaySchedule>;
  for (const day of DAYS) {
    if (employeeSchedule[day]) {
      result[day] = {
        active: employeeSchedule[day].active,
        from: employeeSchedule[day].from ?? "09:00",
        to: employeeSchedule[day].to ?? "17:00",
      };
    } else if (salonSchedule[day]) {
      result[day] = {
        active: salonSchedule[day].active ?? false,
        from: salonSchedule[day].from ?? "09:00",
        to: salonSchedule[day].to ?? "17:00",
      };
    } else {
      result[day] = { active: false, from: "09:00", to: "17:00" };
    }
  }
  return result;
}

type Props = {
  employeeId: string;
  canManage: boolean;
  employeeSchedule: WorkingHours;
  salonSchedule: WorkingHours;
};

export default function EmployeeScheduleForm({
  employeeId,
  canManage,
  employeeSchedule,
  salonSchedule,
}: Props) {
  const t = useTranslations("employeeDetail");
  const tSetup = useTranslations("setup.workingHours");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<Record<Day, DaySchedule>>(
    () => buildInitialSchedule(employeeSchedule, salonSchedule)
  );

  function toggleDay(day: Day) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  }

  function updateTime(day: Day, field: "from" | "to", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateEmployeeSchedule(employeeId, schedule as WorkingHours);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      <h3 className="text-sm font-semibold text-slate-700">{t("workSchedule")}</h3>

      <div className="space-y-2">
        {DAYS.map((day) => {
          const dayData = schedule[day];
          return (
            <div
              key={day}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                dayData.active ? "border-indigo-200 bg-indigo-50/40" : "border-slate-100 bg-slate-50"
              }`}
            >
              {/* Day toggle */}
              <button
                type="button"
                disabled={!canManage}
                onClick={() => canManage && toggleDay(day)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-default ${
                  dayData.active ? "bg-indigo-600" : "bg-slate-300"
                }`}
                role="switch"
                aria-checked={dayData.active}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    dayData.active ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>

              {/* Day label */}
              <span className={`w-24 text-sm font-medium ${dayData.active ? "text-slate-800" : "text-slate-400"}`}>
                {tSetup(day)}
              </span>

              {/* Time inputs */}
              {dayData.active ? (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-slate-500">{tSetup("from")}</span>
                  <input
                    type="time"
                    value={dayData.from}
                    onChange={(e) => updateTime(day, "from", e.target.value)}
                    disabled={!canManage}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-default"
                  />
                  <span className="text-xs text-slate-500">{tSetup("to")}</span>
                  <input
                    type="time"
                    value={dayData.to}
                    onChange={(e) => updateTime(day, "to", e.target.value)}
                    disabled={!canManage}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:cursor-default"
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400 flex-1">{tSetup("closed")}</span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      {saved && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-3.5 py-2.5 text-sm text-green-700">
          {t("changesSaved")}
        </p>
      )}

      {canManage && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? t("saving") : t("save")}
        </button>
      )}
    </div>
  );
}
