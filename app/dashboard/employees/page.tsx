import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import Link from "next/link";
import InviteList from "./invite-list";
import EmployeeList from "./employee-list";

export default async function UposleniciPage() {
  const session = await getSession();
  const supabase = await createClient();
  const t = await getTranslations("uposlenici");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, job_title, color, is_active")
    .eq("tenant_id", session.tenantId)
    .order("full_name");

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, token, full_name, email, role, status, created_at, expires_at")
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

  const canManage = session.role === "owner" || session.role === "manager";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("inviteEmployee")}
          </Link>
        )}
      </div>

      <EmployeeList
        employees={employees ?? []}
        canManage={canManage}
      />

      {canManage && invitations && invitations.length > 0 && (
        <InviteList invitations={invitations} />
      )}
    </div>
  );
}
