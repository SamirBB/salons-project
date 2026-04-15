import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/app/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const locale = await getLocale();

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("logo_url")
    .eq("id", session.tenantId)
    .single();

  return (
    <DashboardShell
      userEmail={session.email}
      salonName={session.salonName}
      role={session.role}
      locale={locale}
      logoUrl={tenant?.logo_url ?? null}
    >
      {children}
    </DashboardShell>
  );
}
