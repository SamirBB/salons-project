"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Promotion } from "@/app/actions/promotions";
import { deletePromotion } from "@/app/actions/promotions";
import { promotionLinkedServiceName } from "@/lib/promotion-utils";

export type PromotionListRow = Promotion & {
  starts_at_display: string;
  ends_at_display: string;
};

type Props = {
  promotions: PromotionListRow[];
  canManage: boolean;
};

function promotionTypeLabel(t: (key: string) => string, code: string): string {
  switch (code) {
    case "bundle":
      return t("promotionTypeBundle");
    case "discount":
      return t("promotionTypeDiscount");
    case "other":
      return t("promotionTypeOther");
    default:
      return code;
  }
}

/** Ista ikona korpe kao `employee-list.tsx` */
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

/** Strelica kao `employee-list.tsx` */
function ChevronIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export default function PromotionList({ promotions, canManage }: Props) {
  const t = useTranslations("promocije");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (promotions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="text-4xl mb-3">🎁</div>
        <p className="text-slate-500 text-sm">{t("noPromotions")}</p>
        {canManage && <p className="text-slate-400 text-xs mt-1">{t("noPromotionsHint")}</p>}
      </div>
    );
  }

  function go(id: string) {
    router.push(`/dashboard/promotions/${id}`);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePromotion(id);
      if (res.error) {
        window.alert(t(`errors.${res.error}`, { defaultValue: t("errors.generic") }));
        return;
      }
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-3 py-3 w-3" aria-hidden />
            <th className="px-3 py-3">{t("listName")}</th>
            <th className="px-3 py-3">{t("listType")}</th>
            <th className="px-3 py-3">{t("listService")}</th>
            <th className="px-3 py-3">{t("listStart")}</th>
            <th className="px-3 py-3">{t("listEnd")}</th>
            <th className="px-3 py-3">{t("listActive")}</th>
            <th className="px-2 py-3 pr-3 text-right whitespace-nowrap">
              {canManage ? <span className="sr-only">{t("listDeleteAria")}</span> : null}
              <span className="sr-only">{t("openDetailsAria")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {promotions.map((p) => (
            <tr
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => go(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go(p.id);
                }
              }}
              className="group cursor-pointer outline-none transition-colors hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
            >
              <td className="px-2 py-3 pl-3">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-slate-200"
                  style={{ backgroundColor: p.color ?? "#94a3b8" }}
                />
              </td>
              <td className="px-3 py-3 font-medium text-slate-800 max-w-[10rem] truncate" title={p.name}>
                {p.name}
              </td>
              <td className="px-3 py-3 text-slate-600 text-xs whitespace-nowrap">{promotionTypeLabel(t, p.promotion_type)}</td>
              <td
                className="px-3 py-3 text-slate-600 text-xs max-w-[8rem] truncate"
                title={promotionLinkedServiceName(p) ?? undefined}
              >
                {promotionLinkedServiceName(p) ?? "—"}
              </td>
              <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{p.starts_at_display}</td>
              <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{p.ends_at_display}</td>
              <td className="px-3 py-3">
                <span
                  className={
                    p.is_active
                      ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                      : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
                  }
                >
                  {p.is_active ? t("activeYes") : t("activeNo")}
                </span>
              </td>
              <td className={`px-2 py-3 pr-3 text-right align-middle ${canManage ? "min-w-[9rem]" : "w-12"}`}>
                <div className="inline-flex items-center justify-end gap-4">
                  {canManage ? (
                    <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {confirmDeleteId === p.id ? (
                        <>
                          <span className="text-xs text-slate-500">{t("confirmDelete")}</span>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(p.id)}
                            className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            {t("yes")}
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                          >
                            {t("no")}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          title={t("listDeleteAria")}
                          aria-label={t("listDeleteAria")}
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  ) : null}
                  <ChevronIcon />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
