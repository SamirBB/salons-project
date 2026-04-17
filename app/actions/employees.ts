"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export type WorkingHours = {
  [day: string]: {
    active: boolean;
    from: string;
    to: string;
  };
};

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

  revalidatePath("/dashboard/employees");
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

  revalidatePath("/dashboard/employees");
  return { success: true };
}

export async function updateEmployee(
  employeeId: string,
  data: {
    full_name?: string;
    phone?: string;
    job_title?: string;
    color?: string;
    bio?: string;
  }
) {
  const session = await getSession();

  if (session.role !== "owner" && session.role !== "manager") {
    return { error: "Nemate dozvolu za ovu akciju." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "Greška pri ažuriranju podataka." };

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);
  return { success: true };
}

export async function updateEmployeeSchedule(
  employeeId: string,
  schedule: WorkingHours
) {
  const session = await getSession();

  if (session.role !== "owner" && session.role !== "manager") {
    return { error: "Nemate dozvolu za ovu akciju." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({ working_hours: schedule, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "Greška pri ažuriranju rasporeda." };

  revalidatePath(`/dashboard/employees/${employeeId}`);
  return { success: true };
}
