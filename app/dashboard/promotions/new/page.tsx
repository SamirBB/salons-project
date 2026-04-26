import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PromotionForm from "../promotion-form";

export default async function NewPromotionPage() {
  const session = await getSession();
  const t = await getTranslations("promocije");

  if (!["owner", "manager"].includes(session.role)) {
    redirect("/dashboard/promotions");
  }

  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, category")
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true)
    .order("category", { nullsFirst: true })
    .order("name");

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

      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t("newPromotion")}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t("newPromotionSubtitle")}</p>
      </div>

      <PromotionForm services={(services ?? []) as { id: string; name: string; category?: string | null }[]} />
    </div>
  );
}
