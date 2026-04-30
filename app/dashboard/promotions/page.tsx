import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import PromotionList, { type PromotionListRow } from "./promotion-list";
import { formatPromotionListDateTime } from "@/lib/promotion-datetime";

const SELECT =
  "id, tenant_id, name, description, terms, promotion_type, starts_at, ends_at, is_active, display_order, color, service_id, linked_service_ids, bonus_service_ids, created_at";

export default async function PromotionsPage() {
  const session = await getSession();
  const t = await getTranslations("promocije");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: rawRows } = await supabase
    .from("promotions")
    .select(SELECT)
    .eq("tenant_id", session.tenantId)
    .order("display_order", { ascending: true })
    .order("ends_at", { ascending: false, nullsFirst: false });

  const rows = rawRows ?? [];
  const serviceIds = [...new Set(rows.map((r) => r.service_id).filter((id): id is string => !!id))];
  const nameById = new Map<string, string>();
  if (serviceIds.length > 0) {
    const { data: svcs } = await supabase
      .from("services")
      .select("id, name")
      .in("id", serviceIds)
      .eq("tenant_id", session.tenantId);
    for (const s of svcs ?? []) nameById.set(s.id, s.name);
  }

  const promotions: PromotionListRow[] = rows.map((r) => ({
    ...r,
    linked_service_ids: (r.linked_service_ids as string[] | null) ?? [],
    bonus_service_ids: (r.bonus_service_ids as string[] | null) ?? [],
    services: r.service_id && nameById.has(r.service_id) ? { name: nameById.get(r.service_id)! } : null,
    starts_at_display: formatPromotionListDateTime(r.starts_at, locale),
    ends_at_display: formatPromotionListDateTime(r.ends_at, locale),
  }));

  const canManage = ["owner", "manager"].includes(session.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("subtitle", { count: promotions.length })}
          </p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/promotions/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            {t("addPromotion")}
          </Link>
        )}
      </div>

      <PromotionList promotions={promotions} canManage={canManage} />
    </div>
  );
}
