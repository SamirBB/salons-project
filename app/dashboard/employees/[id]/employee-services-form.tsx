"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { syncEmployeeServices } from "@/app/actions/services";
import Link from "next/link";

type ServiceItem = {
  id: string;
  name: string;
  color: string | null;
  category: string | null;
};

type Props = {
  employeeId: string;
  allServices: ServiceItem[];
  assignedIds: string[];
};

function groupByCategory(services: ServiceItem[]): [string, ServiceItem[]][] {
  const map = new Map<string, ServiceItem[]>();
  for (const s of services) {
    const key = s.category ?? "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (!a && b) return 1;
    if (a && !b) return -1;
    return a.localeCompare(b);
  });
}

export default function EmployeeServicesForm({ employeeId, allServices, assignedIds }: Props) {
  const t = useTranslations("employeeDetail");
  const tC = useTranslations("cjenovnik");
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
      const result = await syncEmployeeServices(employeeId, Array.from(selected));
      if (!result.error) setSaved(true);
    });
  }

  const groups = groupByCategory(allServices);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-700">{t("services")}</h2>
        <span className="text-xs text-slate-400">
          {selected.size} / {allServices.length}
        </span>
      </div>

      {allServices.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-slate-400">{t("noServicesYet")}</p>
          <Link
            href="/dashboard/price-list/new"
            className="mt-2 inline-flex text-xs text-indigo-600 hover:underline"
          >
            {tC("addService")} →
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">{t("servicesHint")}</p>

          <div className="space-y-4">
            {groups.map(([category, items]) => (
              <div key={category || "__none__"}>
                {category && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {category}
                  </p>
                )}
                <div className="grid gap-2">
                  {items.map((service) => {
                    const isSelected = selected.has(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggle(service.id)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: service.color ?? "#6366f1" }}
                        />
                        <span className="flex-1 text-sm font-medium text-slate-700">
                          {service.name}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-slate-300"
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
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            {saved && (
              <span className="text-sm text-emerald-600">{t("changesSaved")}</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? t("saving") : t("save")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
