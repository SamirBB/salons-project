import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import Link from "next/link";
import EmployeeList from "./employee-list";

export default async function UposleniciPage() {
  const session = await getSession();
  const supabase = await createClient();
  const t = await getTranslations("uposlenici");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, profile_id, full_name, email, job_title, color, is_active")
    .eq("tenant_id", session.tenantId)
    .order("full_name");

  const profileIds =
    employees?.map((e) => e.profile_id).filter((id): id is string => Boolean(id)) ?? [];

  const rolesByProfile = new Map<string, string>();
  if (profileIds.length > 0) {
    const { data: utRows } = await supabase
      .from("user_tenants")
      .select("user_id, role")
      .eq("tenant_id", session.tenantId)
      .in("user_id", profileIds);
    utRows?.forEach((row) => {
      if (row.user_id && row.role) rolesByProfile.set(row.user_id, row.role);
    });
  }

  const employeesWithRole =
    employees?.map((e) => ({
      id: e.id,
      full_name: e.full_name,
      email: e.email,
      job_title: e.job_title,
      color: e.color,
      is_active: e.is_active,
      role: e.profile_id
        ? (rolesByProfile.get(e.profile_id) ?? "employee")
        : "employee",
    })) ?? [];

  const canManage = session.role === "owner" || session.role === "manager";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("subtitle", { count: employees?.length ?? 0 })}
          </p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/employees/new"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            {t("inviteEmployee")}
          </Link>
        )}
      </div>

      <EmployeeList employees={employeesWithRole} canManage={canManage} />
    </div>
  );
}
