import { getSession } from "@/lib/session";
import DashboardShell from "@/app/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <DashboardShell
      userEmail={session.email}
      salonName={session.salonName}
      role={session.role}
    >
      {children}
    </DashboardShell>
  );
}
