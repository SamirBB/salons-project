import { createClient } from "@/lib/supabase/server";
import { isValidRole, type Role } from "@/lib/roles";
import { redirect } from "next/navigation";

export type SessionData = {
  userId: string;
  email: string;
  tenantId: string;
  salonName: string;
  role: Role;
  employeeId: string | null;
};

/**
 * Dohvati sesiju korisnika — userId, tenant, rola.
 * Ako korisnik nije logovan → redirect /login
 * Ako nema tenant → redirect /setup
 */
export async function getSession(): Promise<SessionData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Dohvati tenant i rolu
  const { data: userTenant } = await supabase
    .from("user_tenants")
    .select("tenant_id, role, tenants(id, name)")
    .eq("user_id", user.id)
    .single();

  if (!userTenant) redirect("/setup");

  const tenant = userTenant.tenants as unknown as { id: string; name: string } | null;
  if (!tenant) redirect("/setup");

  const role: Role = isValidRole(userTenant.role) ? userTenant.role : "employee";

  // Ako je radnik/recepcija — dohvati employee ID
  let employeeId: string | null = null;
  if (role === "employee" || role === "receptionist") {
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("profile_id", user.id)
      .single();
    employeeId = employee?.id ?? null;
  }

  return {
    userId: user.id,
    email: user.email!,
    tenantId: tenant.id,
    salonName: tenant.name,
    role,
    employeeId,
  };
}

/** Za Route Handlere — bez redirecta. */
export async function getSessionOptional(): Promise<SessionData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userTenant } = await supabase
    .from("user_tenants")
    .select("tenant_id, role, tenants(id, name)")
    .eq("user_id", user.id)
    .single();

  if (!userTenant) return null;

  const tenant = userTenant.tenants as unknown as { id: string; name: string } | null;
  if (!tenant) return null;

  const role: Role = isValidRole(userTenant.role) ? userTenant.role : "employee";

  let employeeId: string | null = null;
  if (role === "employee" || role === "receptionist") {
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("profile_id", user.id)
      .single();
    employeeId = employee?.id ?? null;
  }

  return {
    userId: user.id,
    email: user.email!,
    tenantId: tenant.id,
    salonName: tenant.name,
    role,
    employeeId,
  };
}
