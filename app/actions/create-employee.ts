"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { isValidRole } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export async function createEmployee(
  _state: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "Nemate dozvolu." };
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const deviceIds = formData.getAll("device_ids") as string[];

  if (!fullName || !email || !password) return { error: "Popunite sva obavezna polja." };
  if (password.length < 6) return { error: "Lozinka mora imati najmanje 6 karaktera." };
  if (!isValidRole(role) || role === "owner") return { error: "Nevažeća rola." };

  // Kreiraj Supabase korisnika sa svježim anon klijentom
  // (ne dira admin sesiju jer koristi in-memory storage bez cookija)
  const freshClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: signUpData, error: signUpError } = await freshClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (signUpError) {
    if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
      return { error: "Korisnik s ovim emailom već postoji." };
    }
    console.error("[createEmployee signUp]", signUpError.message);
    return { error: "Greška pri kreiranju naloga." };
  }

  const userId = signUpData?.user?.id;
  if (!userId) return { error: "Greška pri kreiranju naloga." };

  // Kreiraj employee + user_tenants via SECURITY DEFINER funkciju
  const supabase = await createClient();
  const { data: employeeId, error: rpcError } = await supabase.rpc("create_employee_direct", {
    p_tenant_id: session.tenantId,
    p_user_id: userId,
    p_full_name: fullName,
    p_email: email,
    p_role: role,
  });

  if (rpcError) {
    console.error("[createEmployee rpc]", rpcError.message);
    return { error: "Greška pri kreiranju radnika." };
  }

  // Dodijeli uređaje ako su odabrani
  if (deviceIds.length > 0 && employeeId) {
    const rows = deviceIds.map((deviceId) => ({
      tenant_id: session.tenantId,
      employee_id: employeeId,
      device_id: deviceId,
    }));
    const { error: devError } = await supabase.from("employee_devices").insert(rows);
    if (devError) console.error("[createEmployee devices]", devError.message);
  }

  revalidatePath("/dashboard/employees");
  return { success: true };
}
