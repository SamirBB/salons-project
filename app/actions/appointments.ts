"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

export type AppointmentItem = {
  id: string;
  service_id: string;
  service_name: string;
  service_color: string | null;
  employee_id: string | null;
  duration_minutes: number;
  price: number;
  final_price: number | null;
  status: string;
  notes: string | null;
};

export type Appointment = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  employee_id: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  internal_note: string | null;
  total_price: number | null;
  total_final_price: number | null;
  items: AppointmentItem[];
};

export type SlotSuggestion = {
  starts_at: string;
  ends_at: string;
  employee_id: string;
  employee_name: string;
};

export type AppointmentData = {
  client_id: string | null;
  employee_id: string | null;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  internal_note: string | null;
  items: {
    service_id: string;
    employee_id: string | null;
    duration_minutes: number;
    price: number;
    final_price: number | null;
    notes: string | null;
  }[];
};

// ── Fetch appointments for a given date ──────────────────────────────────────

export async function getAppointmentsForDate(date: string): Promise<Appointment[]> {
  const session = await getSession();
  const supabase = await createClient();

  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data: rows } = await supabase
    .from("appointments")
    .select(`
      id, client_id, employee_id, starts_at, ends_at, status,
      notes, internal_note, total_price, total_final_price,
      clients(first_name, last_name, full_name),
      appointment_items(
        id, service_id, employee_id, duration_minutes, price, final_price, status, notes,
        services(name, color)
      )
    `)
    .eq("tenant_id", session.tenantId)
    .neq("status", "cancelled")
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd)
    .order("starts_at");

  return (rows ?? []).map((row) => {
    const client = row.clients as unknown as Record<string, string | null> | null;
    const clientName = client
      ? (client.full_name || `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || null)
      : null;

    const items: AppointmentItem[] = ((row.appointment_items as unknown[]) ?? []).map((item) => {
      const i = item as Record<string, unknown>;
      const svc = i.services as Record<string, string | null> | null;
      return {
        id: i.id as string,
        service_id: i.service_id as string,
        service_name: svc?.name ?? "—",
        service_color: svc?.color ?? null,
        employee_id: i.employee_id as string | null,
        duration_minutes: Number(i.duration_minutes ?? 30),
        price: Number(i.price ?? 0),
        final_price: i.final_price != null ? Number(i.final_price) : null,
        status: (i.status as string) ?? "scheduled",
        notes: (i.notes as string | null) ?? null,
      };
    });

    return {
      id: row.id,
      client_id: row.client_id ?? null,
      client_name: clientName,
      employee_id: row.employee_id ?? null,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      status: (row.status as AppointmentStatus) ?? "scheduled",
      notes: row.notes ?? null,
      internal_note: row.internal_note ?? null,
      total_price: row.total_price != null ? Number(row.total_price) : null,
      total_final_price: row.total_final_price != null ? Number(row.total_final_price) : null,
      items,
    };
  });
}

// ── Create appointment ────────────────────────────────────────────────────────

export async function createAppointment(data: AppointmentData): Promise<{ error?: string; id?: string }> {
  const session = await getSession();
  if (!["owner", "manager", "receptionist"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const totalPrice = data.items.reduce((s, i) => s + i.price, 0);
  const totalFinal = data.items.reduce((s, i) => s + (i.final_price ?? i.price), 0);

  const { data: appt, error } = await supabase
    .from("appointments")
    .insert({
      tenant_id: session.tenantId,
      client_id: data.client_id || null,
      employee_id: data.employee_id || null,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      status: "scheduled",
      notes: data.notes || null,
      internal_note: data.internal_note || null,
      total_price: totalPrice,
      total_final_price: totalFinal,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error || !appt) {
    console.error("[createAppointment]", error?.message);
    return { error: "createError" };
  }

  if (data.items.length > 0) {
    await supabase.from("appointment_items").insert(
      data.items.map((item, idx) => ({
        tenant_id: session.tenantId,
        appointment_id: appt.id,
        service_id: item.service_id,
        employee_id: item.employee_id || data.employee_id || null,
        sort_order: idx,
        duration_minutes: item.duration_minutes,
        price: item.price,
        final_price: item.final_price ?? item.price,
        status: "scheduled",
        notes: item.notes || null,
      }))
    );
  }

  // ── Mirror into client_treatments so it shows on the client karton ──
  if (data.client_id) {
    const { data: treatment } = await supabase
      .from("client_treatments")
      .insert({
        tenant_id: session.tenantId,
        client_id: data.client_id,
        employee_id: data.employee_id || null,
        treated_at: data.starts_at,
        notes: data.notes || null,
        amount_charged: totalPrice > 0 ? totalPrice : null,
        created_by: session.userId,
        appointment_id: appt.id,
      })
      .select("id")
      .single();

    if (treatment && data.items.length > 0) {
      await supabase.from("client_treatment_services").insert(
        data.items.map((item) => ({
          tenant_id: session.tenantId,
          treatment_id: treatment.id,
          service_id: item.service_id,
        }))
      );
    }

    // Update last_visit_at on client
    await supabase
      .from("clients")
      .update({ last_visit_at: data.starts_at, updated_by: session.userId, updated_at: new Date().toISOString() })
      .eq("id", data.client_id)
      .eq("tenant_id", session.tenantId);

    revalidatePath(`/dashboard/clients/${data.client_id}`);
  }

  revalidatePath("/dashboard/calendar");
  return { id: appt.id };
}

// ── Update appointment status ─────────────────────────────────────────────────

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager", "receptionist"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const extra: Record<string, string> = {};
  if (status === "cancelled") extra.canceled_at = new Date().toISOString();
  if (status === "completed") extra.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("appointments")
    .update({ status, ...extra, updated_by: session.userId })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "updateError" };
  revalidatePath("/dashboard/calendar");
  return {};
}

// ── Delete appointment ────────────────────────────────────────────────────────

export async function deleteAppointment(id: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  await supabase.from("appointment_items").delete().eq("appointment_id", id).eq("tenant_id", session.tenantId);

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "deleteError" };
  revalidatePath("/dashboard/calendar");
  return {};
}

// ── Find free slots ───────────────────────────────────────────────────────────

type WorkingHours = Record<string, { open: string; close: string; closed: boolean }>;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export async function findFreeSlots(
  date: string,
  durationMinutes: number,
  employeeId: string | null, // null = any employee
  limit = 5
): Promise<SlotSuggestion[]> {
  const session = await getSession();
  const supabase = await createClient();

  // Salon working hours
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("working_hours")
    .eq("id", session.tenantId)
    .single();

  const workingHours = (tenantRow?.working_hours as WorkingHours | null) ?? {};
  const jsDay = new Date(date + "T12:00:00").getDay(); // 0=Sun
  const dayKey = String(jsDay);
  const salonDay = workingHours[dayKey];

  // If salon is closed that day
  if (salonDay?.closed) return [];

  const salonOpen = timeToMinutes(salonDay?.open ?? "09:00");
  const salonClose = timeToMinutes(salonDay?.close ?? "18:00");

  // Fetch active employees
  let empQuery = supabase
    .from("employees")
    .select("id, full_name, color")
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true);
  if (employeeId) empQuery = empQuery.eq("id", employeeId);
  const { data: employees } = await empQuery;

  if (!employees || employees.length === 0) return [];

  // Fetch existing appointments for this date
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;
  const { data: existing } = await supabase
    .from("appointments")
    .select("employee_id, starts_at, ends_at")
    .eq("tenant_id", session.tenantId)
    .neq("status", "cancelled")
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd);

  // Fetch employee working hours for this weekday
  const empIds = employees.map((e) => e.id);
  const { data: empHours } = await supabase
    .from("employee_working_hours")
    .select("employee_id, start_time, end_time, is_working")
    .eq("tenant_id", session.tenantId)
    .eq("weekday", jsDay)
    .in("employee_id", empIds);

  // Fetch employee time off
  const { data: timeOff } = await supabase
    .from("employee_time_off")
    .select("employee_id, starts_at, ends_at")
    .eq("tenant_id", session.tenantId)
    .lte("starts_at", dayEnd)
    .gte("ends_at", dayStart);

  const suggestions: SlotSuggestion[] = [];
  const SLOT_STEP = 15; // check every 15 min

  // Sort employees — specific one first if requested
  const sortedEmployees = employeeId
    ? employees
    : [...employees].sort((a, b) => a.full_name.localeCompare(b.full_name));

  for (const emp of sortedEmployees) {
    if (suggestions.length >= limit) break;

    // Employee working hours override
    const empDay = empHours?.find((h) => h.employee_id === emp.id);
    if (empDay && !empDay.is_working) continue; // not working this day

    const empOpen = empDay ? timeToMinutes(empDay.start_time) : salonOpen;
    const empClose = empDay ? timeToMinutes(empDay.end_time) : salonClose;

    // Build busy blocks for this employee
    const busyBlocks = (existing ?? [])
      .filter((a) => a.employee_id === emp.id)
      .map((a) => {
        const s = new Date(a.starts_at);
        const e = new Date(a.ends_at);
        return {
          start: s.getHours() * 60 + s.getMinutes(),
          end: e.getHours() * 60 + e.getMinutes(),
        };
      });

    // Add time-off blocks
    const offBlocks = (timeOff ?? [])
      .filter((o) => o.employee_id === emp.id)
      .map((o) => {
        const s = new Date(o.starts_at);
        const e = new Date(o.ends_at);
        const sMin = s.getHours() * 60 + s.getMinutes();
        const eMin = e.getHours() * 60 + e.getMinutes();
        // Full day off: sMin=0 eMin=0 → cover whole day
        return {
          start: sMin === 0 && eMin === 0 ? 0 : sMin,
          end: sMin === 0 && eMin === 0 ? 24 * 60 : eMin,
        };
      });

    const allBlocks = [...busyBlocks, ...offBlocks];

    // Find first free slot
    const now = new Date();
    const isToday = date === now.toISOString().slice(0, 10);
    const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + 5 : 0;
    const startSearch = Math.max(empOpen, nowMinutes);

    for (let t = startSearch; t + durationMinutes <= empClose; t += SLOT_STEP) {
      const slotEnd = t + durationMinutes;
      const conflict = allBlocks.some((b) => t < b.end && slotEnd > b.start);
      if (!conflict) {
        suggestions.push({
          starts_at: `${date}T${minutesToTime(t)}:00`,
          ends_at: `${date}T${minutesToTime(slotEnd)}:00`,
          employee_id: emp.id,
          employee_name: emp.full_name,
        });
        break;
      }
    }
  }

  // If we need more suggestions, look ahead up to 7 days
  if (suggestions.length < limit) {
    const baseDate = new Date(date + "T12:00:00");
    for (let d = 1; d <= 7 && suggestions.length < limit; d++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + d);
      const nextStr = nextDate.toISOString().slice(0, 10);
      const nextJsDay = nextDate.getDay();
      const nextDayKey = String(nextJsDay);
      const nextSalonDay = workingHours[nextDayKey];
      if (nextSalonDay?.closed) continue;

      const nextOpen = timeToMinutes(nextSalonDay?.open ?? "09:00");
      const nextClose = timeToMinutes(nextSalonDay?.close ?? "18:00");

      const { data: nextExisting } = await supabase
        .from("appointments")
        .select("employee_id, starts_at, ends_at")
        .eq("tenant_id", session.tenantId)
        .neq("status", "cancelled")
        .gte("starts_at", `${nextStr}T00:00:00`)
        .lte("starts_at", `${nextStr}T23:59:59`);

      for (const emp of sortedEmployees) {
        if (suggestions.length >= limit) break;
        if (suggestions.some((s) => s.employee_id === emp.id)) continue;

        const empDay = empHours?.find((h) => h.employee_id === emp.id);
        if (empDay && !empDay.is_working) continue;
        const empOpen = empDay ? timeToMinutes(empDay.start_time) : nextOpen;
        const empClose = empDay ? timeToMinutes(empDay.end_time) : nextClose;

        const busyBlocks = (nextExisting ?? [])
          .filter((a) => a.employee_id === emp.id)
          .map((a) => {
            const s = new Date(a.starts_at);
            const e = new Date(a.ends_at);
            return { start: s.getHours() * 60 + s.getMinutes(), end: e.getHours() * 60 + e.getMinutes() };
          });

        for (let t = empOpen; t + durationMinutes <= empClose; t += SLOT_STEP) {
          const slotEnd = t + durationMinutes;
          const conflict = busyBlocks.some((b) => t < b.end && slotEnd > b.start);
          if (!conflict) {
            suggestions.push({
              starts_at: `${nextStr}T${minutesToTime(t)}:00`,
              ends_at: `${nextStr}T${minutesToTime(slotEnd)}:00`,
              employee_id: emp.id,
              employee_name: emp.full_name,
            });
            break;
          }
        }
      }
    }
  }

  return suggestions.slice(0, limit);
}
