import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import ServiceList from "./service-list";
import type { Service } from "@/app/actions/services";

export default async function CjenovnikPage() {
  const session = await getSession();
  const t = await getTranslations("cjenovnik");
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .order("category", { nullsFirst: true })
    .order("name");

  const canManage = ["owner", "manager"].includes(session.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("subtitle", { count: (services ?? []).length })}
          </p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/price-list/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            {t("addService")}
          </Link>
        )}
      </div>

      {/* List */}
      <ServiceList
        services={(services ?? []) as Service[]}
        canManage={canManage}
      />
    </div>
  );
}
