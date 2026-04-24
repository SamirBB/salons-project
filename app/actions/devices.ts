"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type Device = {
  id: string;
  tenant_id: string;
  name: string;
  device_identifier: string;
  is_active: boolean;
  created_at: string;
};

export async function getDevices(): Promise<Device[]> {
  const session = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("devices")
    .select("id, tenant_id, name, device_identifier, is_active, created_at")
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: true });

  return (data ?? []) as Device[];
}

export async function addDevice(name: string): Promise<{ id?: string; error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("devices")
    .insert({ tenant_id: session.tenantId, name: name.trim() })
    .select("id")
    .single();

  if (error) {
    console.error("[addDevice]", error.message);
    return { error: "addError" };
  }

  revalidatePath("/dashboard/profile");
  return { id: data.id };
}

export async function deleteDevice(id: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("devices")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    console.error("[deleteDevice]", error.message);
    return { error: "deleteError" };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/employees");
  return {};
}

export async function getEmployeeDeviceIds(employeeId: string): Promise<string[]> {
  const session = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("employee_devices")
    .select("device_id")
    .eq("employee_id", employeeId)
    .eq("tenant_id", session.tenantId);

  return (data ?? []).map((r) => r.device_id);
}

export async function setEmployeeDevices(
  employeeId: string,
  deviceIds: string[]
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  // Obriši postojeće
  const { error: deleteError } = await supabase
    .from("employee_devices")
    .delete()
    .eq("employee_id", employeeId)
    .eq("tenant_id", session.tenantId);

  if (deleteError) {
    console.error("[setEmployeeDevices delete]", deleteError.message);
    return { error: "saveError" };
  }

  // Dodaj nove
  if (deviceIds.length > 0) {
    const rows = deviceIds.map((deviceId) => ({
      tenant_id: session.tenantId,
      employee_id: employeeId,
      device_id: deviceId,
    }));

    const { error: insertError } = await supabase.from("employee_devices").insert(rows);

    if (insertError) {
      console.error("[setEmployeeDevices insert]", insertError.message);
      return { error: "saveError" };
    }
  }

  revalidatePath(`/dashboard/employees/${employeeId}`);
  return {};
}
