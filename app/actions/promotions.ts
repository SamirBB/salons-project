"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/** Usklađeno sa `public.promotions` u Supabase (uključuje nullable `service_id` → `services`). */
export type Promotion = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  terms: string | null;
  promotion_type: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
  color: string | null;
  service_id: string | null;
  created_at: string;
  /** Kad select uključi `services(name)` i postoji FK (PostgREST ponekad tipizira kao niz). */
  services?: { name: string } | { name: string }[] | null;
};

const PROMOTION_SELECT =
  "id, tenant_id, name, description, terms, promotion_type, starts_at, ends_at, is_active, display_order, color, service_id, created_at";

function parseTs(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Kada su oba postavljena, završetak mora biti ≥ početak. */
function endsNotBeforeStart(starts_at: string | null, ends_at: string | null): boolean {
  if (!starts_at || !ends_at) return true;
  return new Date(ends_at).getTime() >= new Date(starts_at).getTime();
}

async function assertServiceInTenant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  serviceId: string | null
) {
  if (!serviceId) return true;
  const { data } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return !!data;
}

export async function createPromotion(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const terms = (formData.get("terms") as string)?.trim() || null;
  const promotion_type = (formData.get("promotion_type") as string)?.trim() || "bundle";
  const starts_at = parseTs(formData.get("starts_at") as string);
  const ends_at = parseTs(formData.get("ends_at") as string);
  const is_active = formData.get("is_active") === "on";
  const display_order = parseInt(String(formData.get("display_order") ?? "0"), 10) || 0;
  const color = (formData.get("color") as string)?.trim() || "#6366f1";
  const serviceRaw = (formData.get("service_id") as string)?.trim() || "";
  const service_id = serviceRaw.length > 0 ? serviceRaw : null;

  if (!name) return { error: "nameRequired" };
  if (!ends_at) return { error: "endDateRequired" };
  if (!endsNotBeforeStart(starts_at, ends_at)) {
    return { error: "invalidDateRange" };
  }

  const supabase = await createClient();
  if (service_id && !(await assertServiceInTenant(supabase, session.tenantId, service_id))) {
    return { error: "invalidService" };
  }

  const baseInsert = {
    tenant_id: session.tenantId,
    name,
    description,
    terms,
    promotion_type,
    starts_at,
    ends_at,
    is_active,
    display_order,
    color,
    ...(service_id ? { service_id } : {}),
  };

  const { data, error } = await supabase.from("promotions").insert(baseInsert).select("id").single();

  if (error) {
    console.error("[createPromotion]", error.message, error.code, error.details);
    return { error: "createError" };
  }

  revalidatePath("/dashboard/promotions");
  return { id: data.id };
}

export async function updatePromotion(
  promotionId: string,
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const terms = (formData.get("terms") as string)?.trim() || null;
  const promotion_type = (formData.get("promotion_type") as string)?.trim() || "bundle";
  const starts_at = parseTs(formData.get("starts_at") as string);
  const ends_at = parseTs(formData.get("ends_at") as string);
  const is_active = formData.get("is_active") === "on";
  const display_order = parseInt(String(formData.get("display_order") ?? "0"), 10) || 0;
  const color = (formData.get("color") as string)?.trim() || "#6366f1";
  const serviceRaw = (formData.get("service_id") as string)?.trim() || "";
  const service_id = serviceRaw.length > 0 ? serviceRaw : null;

  if (!name) return { error: "nameRequired" };
  if (!ends_at) return { error: "endDateRequired" };
  if (!endsNotBeforeStart(starts_at, ends_at)) {
    return { error: "invalidDateRange" };
  }

  const supabase = await createClient();
  if (service_id && !(await assertServiceInTenant(supabase, session.tenantId, service_id))) {
    return { error: "invalidService" };
  }

  const { error } = await supabase
    .from("promotions")
    .update({
      name,
      description,
      terms,
      promotion_type,
      starts_at,
      ends_at,
      is_active,
      display_order,
      color,
      service_id,
    })
    .eq("id", promotionId)
    .eq("tenant_id", session.tenantId);

  if (error) {
    console.error("[updatePromotion]", error.message, error.code, error.details);
    return { error: "updateError" };
  }

  revalidatePath("/dashboard/promotions");
  revalidatePath(`/dashboard/promotions/${promotionId}`);
  return { success: true };
}

export async function deletePromotion(promotionId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) {
    return { error: "noPermission" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId)
    .eq("tenant_id", session.tenantId);

  if (error) {
    console.error("[deletePromotion]", error.message, error.code, error.details);
    return { error: "deleteError" };
  }

  revalidatePath("/dashboard/promotions");
  return {};
}

export async function getPromotionById(id: string): Promise<Promotion | null> {
  const session = await getSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select(PROMOTION_SELECT)
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (error || !data) return null;
  return data as unknown as Promotion;
}

