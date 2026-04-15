import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import InviteForm from "./invite-form";
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
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {t("subtitle", { count: employees?.length ?? 0 })}
        </p>
      </div>

      <EmployeeList
        employees={employees ?? []}
        canManage={canManage}
      />

      {canManage && (
        <>
          <InviteForm />
          {invitations && invitations.length > 0 && (
            <InviteList invitations={invitations} />
          )}
        </>
      )}
    </div>
  );
}
