import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ServiceForm from "../service-form";
import ServiceEmployees from "./service-employees";
import type { Service } from "@/app/actions/services";

type Props = { params: Promise<{ id: string }> };

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const t = await getTranslations("cjenovnik");
  const supabase = await createClient();

  // Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!service) notFound();

  const canManage = ["owner", "manager"].includes(session.role);
  if (!canManage) redirect("/dashboard/cjenovnik");

  // Fetch all employees for assignment
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, color, is_active")
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true)
    .order("full_name");

  // Fetch which employees are already assigned
  const { data: assigned } = await supabase
    .from("employee_services")
    .select("employee_id")
    .eq("service_id", id);

  const assignedIds = (assigned ?? []).map((r) => r.employee_id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/cjenovnik"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t("backToList")}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: service.color ?? "#6366f1" }}
        />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{service.name}</h1>
          {service.category && (
            <p className="text-sm text-slate-400">{service.category}</p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <ServiceForm mode="edit" service={service as Service} />

      {/* Employee assignment */}
      <ServiceEmployees
        serviceId={id}
        employees={(employees ?? []) as { id: string; full_name: string; color: string | null; is_active: boolean }[]}
        assignedIds={assignedIds}
      />
    </div>
  );
}
