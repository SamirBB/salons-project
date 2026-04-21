"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { Promotion } from "@/app/actions/promotions";
import { promotionLinkedServiceName } from "@/lib/promotion-utils";

type Props = {
  promotions: Promotion[];
  canManage: boolean;
};

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(d);
}

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

export default function PromotionList({ promotions, canManage }: Props) {
  const t = useTranslations("promocije");
  const locale = useLocale();
  const router = useRouter();

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-3 py-3 w-3" aria-hidden />
            <th className="px-3 py-3">{t("listName")}</th>
            <th className="px-3 py-3">{t("listType")}</th>
            <th className="px-3 py-3">{t("listService")}</th>
            <th className="px-3 py-3">{t("listStart")}</th>
            <th className="px-3 py-3">{t("listEnd")}</th>
            <th className="px-3 py-3">{t("listActive")}</th>
            <th className="px-3 py-3 w-10 text-center">
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
              className="cursor-pointer hover:bg-slate-50/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
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
              <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatDateTime(p.starts_at, locale)}</td>
              <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatDateTime(p.ends_at, locale)}</td>
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
              <td className="px-3 py-3 text-center text-slate-400" aria-hidden>
                <span className="inline-block text-lg leading-none font-medium text-indigo-500">›</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
