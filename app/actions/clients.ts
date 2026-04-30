"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { ROLE_PERMISSIONS, type Role } from "@/lib/roles";

const CLIENT_PHOTO_BUCKET = "salon-assets";
const MAX_CLIENT_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_PHOTO_EXT = ["jpg", "png", "webp", "svg"] as const;

export type SalonClientRow = {
  id: string;
  tenant_id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  jmb: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  photo_url: string | null;
  google_reviewed: boolean;
  facebook_reviewed: boolean;
  instagram_reviewed: boolean;
  is_active: boolean;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
};

function canManageClients(role: Role) {
  return ROLE_PERMISSIONS[role].canManageClients;
}

function combinedFullName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(" ").trim();
}

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function clientPhotoStoragePath(tenantId: string, clientId: string, ext: string) {
  return `${tenantId}/clients/${clientId}/photo.${ext}`;
}

/** Izvadi put `bucket/path` iz javnog URL-a Storagea. */
function storageObjectPathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  try {
    const u = new URL(publicUrl);
    const marker = `/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export type ClientFormPayload = {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  jmb?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  notes?: string;
  google_reviewed?: boolean;
  facebook_reviewed?: boolean;
  instagram_reviewed?: boolean;
};

function isNonEmpty(s: string | undefined): boolean {
  return Boolean(s?.trim());
}

/** Sve osim JMB, napomene i review zastavica — server-side kao i HTML required. */
function validateClientRequiredFields(data: ClientFormPayload): boolean {
  return (
    isNonEmpty(data.first_name) &&
    isNonEmpty(data.last_name) &&
    isNonEmpty(data.date_of_birth) &&
    isNonEmpty(data.street) &&
    isNonEmpty(data.city) &&
    isNonEmpty(data.postal_code) &&
    isNonEmpty(data.phone) &&
    isNonEmpty(data.email)
  );
}

export async function insertClient(data: ClientFormPayload) {
  const session = await getSession();
  if (!canManageClients(session.role)) {
    return { error: "noPermission" as const };
  }

  const first_name = data.first_name?.trim() ?? "";
  const last_name = data.last_name?.trim() ?? "";
  if (!first_name || !last_name) {
    return { error: "namesRequired" as const };
  }
  if (!validateClientRequiredFields(data)) {
    return { error: "requiredFields" as const };
  }

  const full_name = combinedFullName(first_name, last_name);
  const date_of_birth = data.date_of_birth!.trim();

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: row, error } = await supabase
    .from("clients")
    .insert({
      tenant_id: session.tenantId,
      full_name,
      first_name,
      last_name,
      date_of_birth,
      jmb: emptyToNull(data.jmb),
      street: data.street!.trim(),
      city: data.city!.trim(),
      postal_code: data.postal_code!.trim(),
      phone: data.phone!.trim(),
      email: data.email!.trim(),
      notes: emptyToNull(data.notes),
      google_reviewed: data.google_reviewed ?? false,
      facebook_reviewed: data.facebook_reviewed ?? false,
      instagram_reviewed: data.instagram_reviewed ?? false,
      created_by: session.userId,
      updated_by: session.userId,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !row) {
    return { error: "createError" as const };
  }

  revalidatePath("/dashboard/clients");
  return { success: true, id: row.id };
}

export async function updateClient(clientId: string, data: ClientFormPayload) {
  const session = await getSession();
  if (!canManageClients(session.role)) {
    return { error: "noPermission" as const };
  }

  const first_name = data.first_name?.trim() ?? "";
  const last_name = data.last_name?.trim() ?? "";
  if (!first_name || !last_name) {
    return { error: "namesRequired" as const };
  }
  if (!validateClientRequiredFields(data)) {
    return { error: "requiredFields" as const };
  }

  const full_name = combinedFullName(first_name, last_name);
  const date_of_birth = data.date_of_birth!.trim();

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("clients")
    .update({
      full_name,
      first_name,
      last_name,
      date_of_birth,
      jmb: emptyToNull(data.jmb),
      street: data.street!.trim(),
      city: data.city!.trim(),
      postal_code: data.postal_code!.trim(),
      phone: data.phone!.trim(),
      email: data.email!.trim(),
      notes: emptyToNull(data.notes),
      google_reviewed: data.google_reviewed ?? false,
      facebook_reviewed: data.facebook_reviewed ?? false,
      instagram_reviewed: data.instagram_reviewed ?? false,
      updated_by: session.userId,
      updated_at: now,
    })
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return { error: "updateError" as const };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

export async function uploadClientPhoto(clientId: string, formData: FormData) {
  const session = await getSession();
  if (!canManageClients(session.role)) {
    return { error: "noPermission" as const };
  }

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    return { error: "noFile" as const };
  }
  if (file.size > MAX_CLIENT_PHOTO_BYTES) {
    return { error: "photoTooLarge" as const };
  }

  let ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  if (ext === "jpeg") ext = "jpg";
  if (!ALLOWED_PHOTO_EXT.includes(ext as (typeof ALLOWED_PHOTO_EXT)[number])) {
    return { error: "badPhotoType" as const };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("clients")
    .select("id, photo_url")
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId)
    .single();

  if (fetchErr || !row) {
    return { error: "notFound" as const };
  }

  const oldPath = row.photo_url
    ? storageObjectPathFromPublicUrl(row.photo_url.split("?")[0], CLIENT_PHOTO_BUCKET)
    : null;

  const path = clientPhotoStoragePath(session.tenantId, clientId, ext);

  const mime =
    file.type ||
    (ext === "jpg"
      ? "image/jpeg"
      : ext === "svg"
        ? "image/svg+xml"
        : `image/${ext}`);

  // Remove any existing file at the target path first.
  // This avoids needing an UPDATE policy (upsert:true requires INSERT+SELECT+UPDATE).
  // .remove() is a no-op if the file doesn't exist, so it's safe to always call.
  await supabase.storage.from(CLIENT_PHOTO_BUCKET).remove([path]);

  // Also clean up old path if the extension changed
  if (oldPath && oldPath !== path) {
    await supabase.storage.from(CLIENT_PHOTO_BUCKET).remove([oldPath]);
  }

  const { error: uploadError } = await supabase.storage.from(CLIENT_PHOTO_BUCKET).upload(path, file, {
    upsert: false,
    contentType: mime,
  });

  if (uploadError) {
    console.error("[uploadClientPhoto] Storage upload failed:", uploadError.message, "| path:", path);
    return { error: "uploadError" as const };
  }

  const { data: urlData } = supabase.storage.from(CLIENT_PHOTO_BUCKET).getPublicUrl(path);
  const photo_url = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updErr } = await supabase
    .from("clients")
    .update({
      photo_url,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId);

  if (updErr) {
    return { error: "updateError" as const };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true as const, photo_url };
}

export async function removeClientPhoto(clientId: string) {
  const session = await getSession();
  if (!canManageClients(session.role)) {
    return { error: "noPermission" as const };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("clients")
    .select("id, photo_url")
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId)
    .single();

  if (fetchErr || !row) {
    return { error: "notFound" as const };
  }

  if (row.photo_url) {
    const objectPath = storageObjectPathFromPublicUrl(row.photo_url.split("?")[0], CLIENT_PHOTO_BUCKET);
    if (objectPath) {
      await supabase.storage.from(CLIENT_PHOTO_BUCKET).remove([objectPath]);
    }
  }

  const { error } = await supabase
    .from("clients")
    .update({
      photo_url: null,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return { error: "updateError" as const };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true as const };
}

export async function toggleClientActive(clientId: string, currentStatus: boolean) {
  const session = await getSession();
  if (!canManageClients(session.role)) {
    return { error: "noPermission" as const };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      is_active: !currentStatus,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId);

  if (error) {
    return { error: "updateError" as const };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// ─── TREATMENT KARTON ─────────────────────────────────────────────

export type TreatmentService = { id: string; name: string; price: number; color: string | null };

export type Treatment = {
  id: string;
  client_id: string;
  employee_id: string | null;
  treated_at: string;
  notes: string | null;
  amount_charged: number | null;
  duration_minutes: number | null;
  invoice_number: string | null;
  custom_data?: Record<string, string | number | boolean | null>;
  created_at: string;
  created_by: string | null;
  created_by_name?: string | null;
  employees?: { full_name: string; color: string | null } | null;
  services?: TreatmentService[];
  // promotion-generated treatment fields
  client_promotion_id: string | null;
  promotion_treatment_status: "pending" | "completed" | null;
  promotion_service_type: "linked" | "bonus" | null;
  is_cancelled: boolean;
};

export type TreatmentData = {
  employee_id: string | null;
  treated_at: string;
  notes: string | null;
  amount_charged: number | null;
  duration_minutes: number | null;
  invoice_number: string | null;
  custom_data?: Record<string, string | number | boolean | null>;
};

export async function createTreatment(
  clientId: string,
  data: TreatmentData,
  serviceIds: string[]
) {
  const session = await getSession();
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("client_treatments")
    .insert({ tenant_id: session.tenantId, client_id: clientId, created_by: session.userId, ...data })
    .select("id")
    .single();

  if (error || !created) return { error: "createError" as const };

  if (serviceIds.length > 0) {
    await supabase.from("client_treatment_services").insert(
      serviceIds.map((service_id) => ({
        tenant_id: session.tenantId,
        treatment_id: created.id,
        service_id,
      }))
    );
  }

  await supabase
    .from("clients")
    .update({ last_visit_at: new Date().toISOString(), updated_by: session.userId, updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId);

  // ── Mirror into appointments so it shows on the calendar ──
  {
    // Fetch service details for duration + price
    let svcRows: { id: string; price: number; duration_minutes: number | null }[] = [];
    if (serviceIds.length > 0) {
      const { data: svcs, error: svcsErr } = await supabase
        .from("services")
        .select("id, price, duration_minutes")
        .in("id", serviceIds)
        .eq("tenant_id", session.tenantId);
      if (svcsErr) console.error("[createTreatment] fetch services:", svcsErr.message);
      svcRows = svcs ?? [];
    }

    const totalDuration = svcRows.reduce((s, sv) => s + (sv.duration_minutes ?? 30), 0) || 30;
    const totalPrice = data.amount_charged ?? svcRows.reduce((s, sv) => s + sv.price, 0);
    const startsAt = data.treated_at;
    const endsAt = new Date(new Date(startsAt).getTime() + totalDuration * 60000).toISOString();

    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .insert({
        tenant_id: session.tenantId,
        client_id: clientId,
        employee_id: data.employee_id || null,
        starts_at: startsAt,
        ends_at: endsAt,
        status: "completed",
        notes: data.notes || null,
        total_price: totalPrice,
        total_final_price: totalPrice,
        completed_at: startsAt,
        created_by: session.userId,
        appointment_source: "treatment_form",
      })
      .select("id")
      .single();

    if (apptErr) {
      console.error("[createTreatment] appointment mirror:", apptErr.message);
    } else if (appt) {
      if (svcRows.length > 0) {
        const { error: itemsErr } = await supabase.from("appointment_items").insert(
          svcRows.map((sv, idx) => ({
            tenant_id: session.tenantId,
            appointment_id: appt.id,
            service_id: sv.id,
            employee_id: data.employee_id || null,
            sort_order: idx,
            duration_minutes: sv.duration_minutes ?? 30,
            price: sv.price,
            final_price: sv.price,
            status: "completed",
          }))
        );
        if (itemsErr) console.error("[createTreatment] appointment_items:", itemsErr.message);
      }
      // Link appointment back to the treatment
      await supabase
        .from("client_treatments")
        .update({ appointment_id: appt.id })
        .eq("id", created.id);
    }
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/calendar");
  return { success: true as const };
}

export async function updateTreatment(
  treatmentId: string,
  clientId: string,
  data: TreatmentData,
  serviceIds: string[]
) {
  const session = await getSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_treatments")
    .update(data)
    .eq("id", treatmentId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "updateError" as const };

  // Sync junction table
  await supabase
    .from("client_treatment_services")
    .delete()
    .eq("treatment_id", treatmentId);

  if (serviceIds.length > 0) {
    await supabase.from("client_treatment_services").insert(
      serviceIds.map((service_id) => ({
        tenant_id: session.tenantId,
        treatment_id: treatmentId,
        service_id,
      }))
    );
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true as const };
}

export async function deleteClient(clientId: string) {
  const session = await getSession();
  if (!ROLE_PERMISSIONS[session.role].canManageClients) {
    return { error: "unauthorized" as const };
  }
  const supabase = await createClient();

  // Dohvati sve treatment ID-eve za ovog klijenta
  const { data: treatments } = await supabase
    .from("client_treatments")
    .select("id")
    .eq("client_id", clientId)
    .eq("tenant_id", session.tenantId);

  const treatmentIds = (treatments ?? []).map((t) => t.id);

  // Obriši junction zapise (client_treatment_services)
  if (treatmentIds.length > 0) {
    await supabase
      .from("client_treatment_services")
      .delete()
      .in("treatment_id", treatmentIds);
  }

  // Obriši tretmane
  await supabase
    .from("client_treatments")
    .delete()
    .eq("client_id", clientId)
    .eq("tenant_id", session.tenantId);

  // Obriši klijenta
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("tenant_id", session.tenantId);

  if (error) {
    console.error("[deleteClient] DB error:", error);
    return { error: "deleteError" as const };
  }

  revalidatePath("/dashboard/clients");
  return { success: true as const };
}

export async function toggleTreatmentCancelled(
  treatmentId: string,
  clientId: string,
  cancelled: boolean
) {
  const session = await getSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_treatments")
    .update({ is_cancelled: cancelled })
    .eq("id", treatmentId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "updateError" as const };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true as const };
}

export async function deleteTreatment(treatmentId: string, clientId: string) {
  const session = await getSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_treatments")
    .delete()
    .eq("id", treatmentId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "deleteError" as const };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true as const };
}
