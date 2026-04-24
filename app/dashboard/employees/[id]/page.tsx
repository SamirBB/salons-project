import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import EmployeeBasicForm from "./employee-basic-form";
import EmployeeScheduleForm from "./employee-schedule-form";
import EmployeeServicesForm from "./employee-services-form";
import EmployeeDevicesForm from "./employee-devices-form";
import { getDevices, getEmployeeDeviceIds } from "@/app/actions/devices";
import type { WorkingHours } from "@/app/actions/employees";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const supabase = await createClient();
  const t = await getTranslations("uposlenici");
  const tDetail = await getTranslations("employeeDetail");

  const { data: employee } = await supabase
    .from("employees")
    .select("id, profile_id, full_name, email, phone, job_title, color, bio, is_active, working_hours")
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!employee) notFound();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("working_hours")
    .eq("id", session.tenantId)
    .single();

  const canManage = session.role === "owner" || session.role === "manager";
  const salonSchedule = (tenant?.working_hours ?? {}) as WorkingHours;
  const employeeSchedule = (employee.working_hours ?? {}) as WorkingHours;

  // Fetch current role for this employee
  let employeeRole = "employee";
  if (employee.profile_id) {
    const { data: ut } = await supabase
      .from("user_tenants")
      .select("role")
      .eq("user_id", employee.profile_id)
      .eq("tenant_id", session.tenantId)
      .single();
    if (ut?.role) employeeRole = ut.role;
  }

  // Fetch services + devices for assignment (owner/manager only)
  let allServices: { id: string; name: string; color: string | null; category: string | null }[] = [];
  let assignedServiceIds: string[] = [];
  let allDevices: Awaited<ReturnType<typeof getDevices>> = [];
  let assignedDeviceIds: string[] = [];

  if (canManage) {
    const [servicesResult, devicesResult, assignedResult, assignedDevicesResult] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, color, category")
        .eq("tenant_id", session.tenantId)
        .eq("is_active", true)
        .order("category", { nullsFirst: true })
        .order("name"),
      getDevices(),
      supabase.from("employee_services").select("service_id").eq("employee_id", id),
      getEmployeeDeviceIds(id),
    ]);

    allServices = servicesResult.data ?? [];
    allDevices = devicesResult;
    assignedServiceIds = (assignedResult.data ?? []).map((r) => r.service_id);
    assignedDeviceIds = assignedDevicesResult;
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("title")}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: employee.color ?? "#6366f1" }}
        >
          {employee.full_name[0]}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{employee.full_name}</h2>
          <p className="text-sm text-slate-500">
            {employee.job_title ?? tDetail("employeeDetails")}
          </p>
        </div>
      </div>

      {/* Section A: Basic info */}
      <EmployeeBasicForm
        employeeId={employee.id}
        profileId={employee.profile_id}
        canManage={canManage}
        initialData={{
          full_name: employee.full_name,
          email: employee.email,
          phone: employee.phone,
          job_title: employee.job_title,
          color: employee.color,
          bio: employee.bio,
          role: employeeRole,
        }}
      />

      {/* Section B: Work schedule */}
      <EmployeeScheduleForm
        employeeId={employee.id}
        canManage={canManage}
        employeeSchedule={employeeSchedule}
        salonSchedule={salonSchedule}
      />

      {/* Section C: Services */}
      {canManage && (
        <EmployeeServicesForm
          employeeId={employee.id}
          allServices={allServices}
          assignedIds={assignedServiceIds}
        />
      )}

      {/* Section D: Devices */}
      {canManage && (
        <EmployeeDevicesForm
          employeeId={employee.id}
          allDevices={allDevices}
          assignedDeviceIds={assignedDeviceIds}
        />
      )}
    </div>
  );
}
