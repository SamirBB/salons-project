import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import PromotionList from "./promotion-list";
import type { Promotion } from "@/app/actions/promotions";

const SELECT =
  "id, tenant_id, name, description, terms, promotion_type, starts_at, ends_at, is_active, display_order, color, service_id, created_at";

export default async function PromotionsPage() {
  const session = await getSession();
  const t = await getTranslations("promocije");
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

  const promotions = rows.map((r) => ({
    ...r,
    services: r.service_id && nameById.has(r.service_id) ? { name: nameById.get(r.service_id)! } : null,
  }));

  const canManage = ["owner", "manager"].includes(session.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("subtitle", { count: promotions.length })}
          </p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/promotions/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            {t("addPromotion")}
          </Link>
        )}
      </div>

      <PromotionList promotions={promotions as Promotion[]} canManage={canManage} />
    </div>
  );
}
