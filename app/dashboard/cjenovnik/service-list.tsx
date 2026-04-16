"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleServiceActive, deleteService } from "@/app/actions/services";
import type { Service } from "@/app/actions/services";

type Props = {
  services: Service[];
  canManage: boolean;
};

// Group services by category
function groupByCategory(services: Service[]): [string, Service[]][] {
  const map = new Map<string, Service[]>();
  for (const s of services) {
    const key = s.category ?? "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  // Sort: named categories first (alphabetically), then uncategorised
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (!a && b) return 1;
    if (a && !b) return -1;
    return a.localeCompare(b);
  });
}

function formatDuration(minutes: number, t: ReturnType<typeof useTranslations>): string {
  if (minutes < 60) return `${minutes} ${t("min")}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}${t("min")}` : `${h}h`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

export default function ServiceList({ services, canManage }: Props) {
  const t = useTranslations("cjenovnik");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="text-4xl mb-3">💇</div>
        <p className="text-slate-500 text-sm">{t("noServices")}</p>
        {canManage && (
          <p className="text-slate-400 text-xs mt-1">{t("noServicesHint")}</p>
        )}
      </div>
    );
  }

  const groups = groupByCategory(services);

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleServiceActive(id, !current);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteService(id);
      setConfirmDelete(null);
    });
  }

  return (
    <div className="space-y-6">
      {groups.map(([category, items]) => (
        <div key={category || "__none__"}>
          {/* Category header */}
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {category || t("uncategorised")}
            </h2>
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">{items.length}</span>
          </div>

          {/* Service cards */}
          <div className="grid gap-3">
            {items.map((service) => (
              <div
                key={service.id}
                onClick={() => canManage && router.push(`/dashboard/cjenovnik/${service.id}`)}
                className={`group relative rounded-2xl border bg-white shadow-sm transition-all ${
                  canManage ? "cursor-pointer hover:border-indigo-300 hover:shadow-md" : ""
                } ${service.is_active ? "border-slate-200" : "border-slate-100 opacity-60"}`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Color dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: service.color ?? "#6366f1" }}
                  />

                  {/* Name + description */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{service.description}</p>
                    )}
                  </div>

                  {/* Duration + Price */}
                  <div className="flex items-center gap-4 text-sm flex-shrink-0">
                    <span className="text-slate-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                      </svg>
                      {formatDuration(service.duration_minutes, t)}
                    </span>
                    <span className="font-semibold text-slate-800 min-w-[60px] text-right">
                      {formatPrice(service.price)} €
                    </span>
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div
                      className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggle(service.id, service.is_active)}
                        disabled={isPending}
                        title={service.is_active ? t("deactivate") : t("activate")}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          service.is_active
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {service.is_active ? t("active") : t("inactive")}
                      </button>

                      {/* Delete */}
                      {confirmDelete === service.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">{t("confirmDelete")}</span>
                          <button
                            onClick={() => handleDelete(service.id)}
                            disabled={isPending}
                            className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                          >
                            {t("yes")}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                          >
                            {t("no")}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(service.id)}
                          title={t("deleteService")}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}

                      {/* Chevron */}
                      <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
