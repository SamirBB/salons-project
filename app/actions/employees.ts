"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function toggleEmployeeStatus(employeeId: string, currentStatus: boolean) {
  const session = await getSession();

  if (session.role !== "owner" && session.role !== "manager") {
    return { error: "Nemate dozvolu za ovu akciju." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({ is_active: !currentStatus })
    .eq("id", employeeId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "Greška pri promjeni statusa." };

  revalidatePath("/dashboard/uposlenici");
  return { success: true };
}

export async function removeEmployee(employeeId: string) {
  const session = await getSession();

  if (session.role !== "owner" && session.role !== "manager") {
    return { error: "Nemate dozvolu za ovu akciju." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("remove_employee", {
    p_employee_id: employeeId,
    p_tenant_id: session.tenantId,
  });

  if (error) return { error: "Greška pri brisanju uposlenika." };

  revalidatePath("/dashboard/uposlenici");
  return { success: true };
}
