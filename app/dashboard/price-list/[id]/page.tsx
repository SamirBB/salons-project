import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ServiceDetailTabs from "./service-detail-tabs";
import ServiceSummary from "./service-summary";
import type { Service } from "@/app/actions/services";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ id: string }> };

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const t = await getTranslations("cjenovnik");
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!service) notFound();

  const canManage = ["owner", "manager"].includes(session.role);
  if (!canManage) redirect("/dashboard/price-list");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, color, is_active")
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true)
    .order("full_name");

  const { data: assigned } = await supabase
    .from("employee_services")
    .select("employee_id")
    .eq("service_id", id);

  const assignedIds = (assigned ?? []).map((r) => r.employee_id);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/price-list"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("title")}
        </Link>
      </div>

      <ServiceSummary service={service as Service} />

      <ServiceDetailTabs
        serviceId={id}
        employees={(employees ?? []) as { id: string; full_name: string; color: string | null; is_active: boolean }[]}
        assignedIds={assignedIds}
      />
    </div>
  );
}
