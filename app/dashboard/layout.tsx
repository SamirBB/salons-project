import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/locale-server";
import DashboardShell from "@/app/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const locale = await getLocale();

  return (
    <DashboardShell
      userEmail={session.email}
      salonName={session.salonName}
      role={session.role}
      locale={locale}
    >
      {children}
    </DashboardShell>
  );
}
