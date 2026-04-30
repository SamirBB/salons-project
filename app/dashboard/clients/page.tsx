import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { ROLE_PERMISSIONS } from "@/lib/roles";
import ClientList, { type ClientListRow } from "./client-list";

export default async function ClientsPage() {
  const session = await getSession();
  const supabase = await createClient();
  const t = await getTranslations("klijenti");

  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, first_name, last_name, full_name, phone, email, photo_url, is_active, last_visit_at, street, city, postal_code, jmb"
    )
    .eq("tenant_id", session.tenantId)
    .order("full_name");

  const canManage = ROLE_PERMISSIONS[session.role].canManageClients;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t("subtitle", { count: clients?.length ?? 0 })}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <a
            href="/api/dashboard/clients/export?format=xlsx"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            {t("exportExcel")}
          </a>
          <a
            href="/api/dashboard/clients/export?format=pdf"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            {t("exportPdf")}
          </a>
          {canManage && (
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              {t("addClient")}
            </Link>
          )}
        </div>
      </div>

      <ClientList clients={(clients ?? []) as ClientListRow[]} canManage={canManage} />
    </div>
  );
}
