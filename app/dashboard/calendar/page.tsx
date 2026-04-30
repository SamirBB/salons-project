import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import { getAppointmentsForDate } from "@/app/actions/appointments";
import CalendarView from "./calendar-view";

type Props = {
  searchParams: Promise<{ date?: string }>;
};

function todayYMD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function CalendarPage({ searchParams }: Props) {
  const params = await searchParams;
  const date = params.date ?? todayYMD();

  const session = await getSession();
  const supabase = await createClient();
  const t = await getTranslations("kalendar");

  const [
    { data: employees },
    { data: services },
    { data: clients },
    { data: tenant },
    appointments,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, color")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true)
      .order("full_name"),

    supabase
      .from("services")
      .select("id, name, price, duration_minutes, color")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("clients")
      .select("id, full_name, first_name, last_name")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true)
      .order("full_name"),

    supabase
      .from("tenants")
      .select("working_hours")
      .eq("id", session.tenantId)
      .single(),

    getAppointmentsForDate(date),
  ]);

  const workingHours =
    (tenant?.working_hours as Record<
      string,
      { open: string; close: string; closed: boolean }
    >) ?? {};

  const canManage = ["owner", "manager", "receptionist"].includes(session.role);

  const mappedClients = (clients ?? []).map((c) => ({
    id: c.id,
    display_name:
      c.full_name ||
      `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() ||
      "—",
  }));

  return (
    <div className="flex flex-col h-full space-y-1">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Pregled termina i slobodnih slotova</p>
        </div>
      </div>

      <CalendarView
        date={date}
        employees={
          (employees ?? []) as {
            id: string;
            full_name: string;
            color: string | null;
          }[]
        }
        services={
          (services ?? []) as {
            id: string;
            name: string;
            price: number;
            duration_minutes: number | null;
            color: string | null;
          }[]
        }
        clients={mappedClients}
        appointments={appointments}
        workingHours={workingHours}
        canManage={canManage}
      />
    </div>
  );
}
