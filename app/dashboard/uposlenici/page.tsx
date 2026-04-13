import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import InviteForm from "./invite-form";
import InviteList from "./invite-list";

export default async function UposleniciPage() {
  const session = await getSession();
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email, job_title, color, is_active")
    .eq("tenant_id", session.tenantId)
    .order("full_name");

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, full_name, email, role, status, created_at, expires_at")
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

  const canInvite = session.role === "owner" || session.role === "manager";

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Uposlenici</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {employees?.length ?? 0} uposlenik(a) u salonu
        </p>
      </div>

      {/* Lista uposlenika */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Aktivni uposlenici</h3>
        </div>
        {employees && employees.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <li key={emp.id} className="flex items-center gap-4 px-5 py-3.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: emp.color ?? "#6366f1" }}
                >
                  {emp.full_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{emp.full_name}</p>
                  <p className="text-xs text-slate-500">{emp.email}</p>
                </div>
                {emp.job_title && (
                  <span className="text-xs text-slate-500 hidden sm:block">{emp.job_title}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  emp.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {emp.is_active ? "Aktivan" : "Neaktivan"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            Nema uposlenika. Pozovite prvog uposlenika ispod.
          </div>
        )}
      </div>

      {canInvite && (
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
