import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { ROLE_PERMISSIONS } from "@/lib/roles";
import ClientList, { type ClientListRow } from "./client-list";

export default async function ClientsPage() {
  const session = await getSession();
  const supabase = await createClient();
  const [t, tCF] = await Promise.all([
    getTranslations("klijenti"),
    getTranslations("customFields"),
  ]);

  const { data: clients } = await supabase
    .from("clients")
    .select(
      "id, first_name, last_name, full_name, phone, email, photo_url, is_active, last_visit_at, street, city, postal_code, jmb"
    )
    .eq("tenant_id", session.tenantId)
    .order("full_name");

  const canManage = ROLE_PERMISSIONS[session.role].canManageClients;
  const isOwner = session.role === "owner";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t("subtitle", { count: clients?.length ?? 0 })}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {isOwner && (
            <Link
              href="/dashboard/clients/custom-fields"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              title={tCF("pageTitle")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {tCF("settingsButton")}
            </Link>
          )}
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
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {t("addClient")}
            </Link>
          )}
        </div>
      </div>

      <ClientList clients={(clients ?? []) as ClientListRow[]} canManage={canManage} />
    </div>
  );
}
