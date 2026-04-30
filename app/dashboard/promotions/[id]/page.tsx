import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Promotion } from "@/app/actions/promotions";
import PromotionEditForm from "../promotion-edit-form";

type Props = { params: Promise<{ id: string }> };

const SELECT =
  "id, tenant_id, name, description, terms, promotion_type, starts_at, ends_at, is_active, display_order, color, service_id, linked_service_ids, bonus_service_ids, created_at";

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(d);
}

export default async function PromotionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const t = await getTranslations("promocije");
  const locale = await getLocale();
  const supabase = await createClient();
  const canManage = ["owner", "manager"].includes(session.role);

  const [{ data: row }, { data: serviceOptions }] = await Promise.all([
    supabase
      .from("promotions")
      .select(SELECT)
      .eq("id", id)
      .eq("tenant_id", session.tenantId)
      .single(),
    supabase
      .from("services")
      .select("id, name, category")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true)
      .order("category", { nullsFirst: true })
      .order("name"),
  ]);

  if (!row) notFound();

  // Eagerly deactivate if expired and still marked active
  const rawPromotion = row as Promotion;
  const isExpiredNow = !!rawPromotion.ends_at && new Date(rawPromotion.ends_at) < new Date();
  if (isExpiredNow && rawPromotion.is_active) {
    await supabase
      .from("promotions")
      .update({ is_active: false })
      .eq("id", rawPromotion.id)
      .eq("tenant_id", session.tenantId);
  }
  const p: Promotion = isExpiredNow ? { ...rawPromotion, is_active: false } : rawPromotion;

  const promotionTypeDisplay =
    p.promotion_type === "bundle"
      ? t("promotionTypeBundle")
      : p.promotion_type === "discount"
        ? t("promotionTypeDiscount")
        : p.promotion_type === "other"
          ? t("promotionTypeOther")
          : p.promotion_type;

  let linkedName: string | null = null;
  if (p.service_id) {
    const { data: svc } = await supabase
      .from("services")
      .select("name")
      .eq("id", p.service_id)
      .eq("tenant_id", session.tenantId)
      .maybeSingle();
    linkedName = svc?.name ?? null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/promotions"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t("backToList")}
      </Link>

      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 h-4 w-4 shrink-0 rounded-full border border-slate-200"
          style={{ backgroundColor: p.color ?? "#94a3b8" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-slate-900">{p.name}</h2>
            {(() => {
              const isExpired = !!p.ends_at && new Date(p.ends_at) < new Date();
              if (isExpired) {
                return (
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {t("activeExpired")}
                  </span>
                );
              }
              if (p.is_active) {
                return (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {t("activeYes")}
                  </span>
                );
              }
              return (
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {t("activeNo")}
                </span>
              );
            })()}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {canManage ? t("editPromotionTitle") : `${t("detailType")}: ${promotionTypeDisplay}`}
          </p>
        </div>
      </div>

      {canManage ? (
        <PromotionEditForm promotion={p} services={(serviceOptions ?? []) as { id: string; name: string }[]} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 text-sm">
          <dl className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("isActiveLabel")}</dt>
                <dd className="mt-1">
                  {(() => {
                    const isExpired = !!p.ends_at && new Date(p.ends_at) < new Date();
                    if (isExpired) {
                      return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{t("activeExpired")}</span>;
                    }
                    return (
                      <span className={p.is_active ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700" : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"}>
                        {p.is_active ? t("activeYes") : t("activeNo")}
                      </span>
                    );
                  })()}
                </dd>
              </div>           
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("startsAtLabel")}</dt>
              <dd className="mt-1 text-slate-800">{formatDateTime(p.starts_at, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("endsAtLabel")}</dt>
              <dd className="mt-1 text-slate-800">{formatDateTime(p.ends_at, locale)}</dd>
            </div>
            {p.description ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("descriptionLabel")}</dt>
                <dd className="mt-1 text-slate-700 whitespace-pre-wrap">{p.description}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("termsLabel")}</dt>
              <dd className="mt-1 text-slate-700 whitespace-pre-wrap">{p.terms?.trim() ? p.terms : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("linkedServiceLabel")}</dt>
              <dd className="mt-1 text-slate-800">{linkedName ?? t("serviceNone")}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
