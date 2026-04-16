"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type Service = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  color: string | null;
  is_active: boolean;
  display_order: number | null;
  internal_note: string | null;
  created_at: string;
};

export type EmployeeService = {
  employee_id: string;
  service_id: string;
  is_active: boolean;
  custom_duration_minutes: number | null;
  custom_price: number | null;
};

export type ServiceFormData = {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category?: string;
  color?: string;
  is_active?: boolean;
  internal_note?: string;
};

// ─── CREATE SERVICE ───────────────────────────────────────────────
export async function createService(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string) || 30;
  const price = parseFloat(formData.get("price") as string) || 0;
  const category = (formData.get("category") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || "#6366f1";
  const internal_note = (formData.get("internal_note") as string)?.trim() || null;

  if (!name) return { error: "nameRequired" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .insert({
      tenant_id: session.tenantId,
      name,
      description,
      duration_minutes,
      price,
      category,
      color,
      internal_note,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: "createError" };

  revalidatePath("/dashboard/cjenovnik");
  return { id: data.id };
}

// ─── UPDATE SERVICE ───────────────────────────────────────────────
export async function updateService(
  serviceId: string,
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string) || 30;
  const price = parseFloat(formData.get("price") as string) || 0;
  const category = (formData.get("category") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || "#6366f1";
  const internal_note = (formData.get("internal_note") as string)?.trim() || null;

  if (!name) return { error: "nameRequired" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ name, description, duration_minutes, price, category, color, internal_note })
    .eq("id", serviceId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "updateError" };

  revalidatePath("/dashboard/cjenovnik");
  revalidatePath(`/dashboard/cjenovnik/${serviceId}`);
  return { success: true };
}

// ─── TOGGLE SERVICE ACTIVE ────────────────────────────────────────
export async function toggleServiceActive(
  serviceId: string,
  is_active: boolean
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active })
    .eq("id", serviceId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "updateError" };

  revalidatePath("/dashboard/cjenovnik");
  return {};
}

// ─── DELETE SERVICE ───────────────────────────────────────────────
export async function deleteService(
  serviceId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "deleteError" };

  revalidatePath("/dashboard/cjenovnik");
  return {};
}

// ─── GET SERVICES FOR TENANT ──────────────────────────────────────
export async function getServices(): Promise<Service[]> {
  const session = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .order("category", { nullsFirst: true })
    .order("name");

  return (data ?? []) as Service[];
}

// ─── GET SERVICE BY ID ────────────────────────────────────────────
export async function getServiceById(serviceId: string): Promise<Service | null> {
  const session = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("tenant_id", session.tenantId)
    .single();

  return (data ?? null) as Service | null;
}

// ─── GET EMPLOYEE SERVICES ────────────────────────────────────────
export async function getEmployeeServices(
  employeeId: string
): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("employee_services")
    .select("service_id")
    .eq("employee_id", employeeId);

  return (data ?? []).map((r) => r.service_id);
}

// ─── GET SERVICES FOR EMPLOYEE (with details) ─────────────────────
export async function getServicesForEmployee(
  employeeId: string
): Promise<Service[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("employee_services")
    .select("service_id, services(*)")
    .eq("employee_id", employeeId);

  return (data ?? [])
    .map((r) => r.services)
    .filter(Boolean) as unknown as Service[];
}

// ─── SYNC EMPLOYEE SERVICES ───────────────────────────────────────
// Replaces all service assignments for an employee
export async function syncEmployeeServices(
  employeeId: string,
  serviceIds: string[]
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const supabase = await createClient();

  // Delete all current assignments
  const { error: deleteError } = await supabase
    .from("employee_services")
    .delete()
    .eq("employee_id", employeeId);

  if (deleteError) return { error: "updateError" };

  // Insert new ones
  if (serviceIds.length > 0) {
    const rows = serviceIds.map((service_id) => ({
      tenant_id: session.tenantId,
      employee_id: employeeId,
      service_id,
      is_active: true,
    }));

    const { error: insertError } = await supabase
      .from("employee_services")
      .insert(rows);

    if (insertError) return { error: "updateError" };
  }

  revalidatePath(`/dashboard/uposlenici/${employeeId}`);
  return {};
}

// ─── SYNC SERVICE EMPLOYEES ───────────────────────────────────────
// Replaces all employee assignments for a service
export async function syncServiceEmployees(
  serviceId: string,
  employeeIds: string[]
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("employee_services")
    .delete()
    .eq("service_id", serviceId);

  if (deleteError) return { error: "updateError" };

  if (employeeIds.length > 0) {
    const rows = employeeIds.map((employee_id) => ({
      tenant_id: session.tenantId,
      employee_id,
      service_id: serviceId,
      is_active: true,
    }));

    const { error: insertError } = await supabase
      .from("employee_services")
      .insert(rows);

    if (insertError) return { error: "updateError" };
  }

  revalidatePath(`/dashboard/cjenovnik/${serviceId}`);
  return {};
}
