"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { syncServiceEmployees } from "@/app/actions/services";

type Employee = {
  id: string;
  full_name: string;
  color: string | null;
  is_active: boolean;
};

type Props = {
  serviceId: string;
  employees: Employee[];
  assignedIds: string[];
  /** Kad je u tabu kao kod detalja usluge, naslov kartice sakrij (naslov je u tab baru). */
  hideHeading?: boolean;
};

export default function ServiceEmployees({
  serviceId,
  employees,
  assignedIds,
  hideHeading = false,
}: Props) {
  const t = useTranslations("cjenovnik");
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await syncServiceEmployees(serviceId, Array.from(selected));
      if (!result.error) setSaved(true);
    });
  }

  const emptyEmployees = employees.length === 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      {!emptyEmployees && (
        <div className={`flex items-center gap-2 ${hideHeading ? "justify-end" : "justify-between"}`}>
          {!hideHeading && (
            <h3 className="text-sm font-semibold text-slate-700">{t("assignedEmployees")}</h3>
          )}
          <span className="text-xs text-slate-400">{t("assignedCount", { count: selected.size })}</span>
        </div>
      )}

      {emptyEmployees ? (
        <p className="text-sm text-slate-500">{t("noEmployeesForAssignment")}</p>
      ) : (
        <>
          <p className="text-xs text-slate-400">{t("assignedHint")}</p>

          <div className="grid gap-2">
            {employees.map((emp) => {
              const isSelected = selected.has(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggle(emp.id)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: emp.color ?? "#94a3b8" }}
                  />
                  <span className="flex-1 text-sm font-medium text-slate-700">
                    {emp.full_name}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            {saved && (
              <span className="text-sm text-emerald-600">{t("savedChanges")}</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? t("saving") : t("saveButton")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
