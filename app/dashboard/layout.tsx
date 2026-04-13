import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/app/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch tenant (salon) name
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("owner_user_id", user.id)
    .single();

  const salonName = tenant?.name ?? "Moj Salon";

  return (
    <DashboardShell userEmail={user.email!} salonName={salonName}>
      {children}
    </DashboardShell>
  );
}
