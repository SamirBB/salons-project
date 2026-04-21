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

/** Ista ikona korpe kao na listi promocija (`promotion-list.tsx`). */
function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
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
                onClick={() => canManage && router.push(`/dashboard/price-list/${service.id}`)}
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

                  {/* Toggle + delete: stopPropagation da klik ne otvara detalje */}
                  {canManage ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
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

                      {confirmDelete === service.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">{t("confirmDelete")}</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(service.id)}
                            disabled={isPending}
                            className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                          >
                            {t("yes")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                          >
                            {t("no")}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(service.id)}
                          title={t("deleteService")}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Chevron izvan stopPropagation — klik ide na karticu i otvara detalje */}
                  <svg
                    className="w-4 h-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
