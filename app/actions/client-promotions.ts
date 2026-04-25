"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type ClientPromotion = {
  id: string;
  client_id: string;
  promotion_id: string;
  status: string;
  assigned_at: string;
  used_at: string | null;
  notes: string | null;
  promotion: {
    id: string;
    name: string;
    promotion_type: string;
    color: string | null;
    ends_at: string | null;
    is_active: boolean;
  };
};

export type AvailablePromotion = {
  id: string;
  name: string;
  description: string | null;
  promotion_type: string;
  color: string | null;
  ends_at: string | null;
};

export async function getClientPromotions(clientId: string): Promise<ClientPromotion[]> {
  const session = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("client_promotions")
    .select("id, client_id, promotion_id, status, assigned_at, used_at, notes, promotions(id, name, promotion_type, color, ends_at, is_active)")
    .eq("client_id", clientId)
    .eq("tenant_id", session.tenantId)
    .order("assigned_at", { ascending: false });

  return (data ?? []).map((row) => {
    const promo = Array.isArray(row.promotions) ? row.promotions[0] : row.promotions;
    return {
      id: row.id,
      client_id: row.client_id,
      promotion_id: row.promotion_id,
      status: row.status,
      assigned_at: row.assigned_at,
      used_at: row.used_at ?? null,
      notes: row.notes,
      promotion: promo as ClientPromotion["promotion"],
    };
  });
}

export async function getAvailablePromotions(): Promise<AvailablePromotion[]> {
  const session = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("promotions")
    .select("id, name, description, promotion_type, color, ends_at")
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true)
    .or("ends_at.is.null,ends_at.gt." + new Date().toISOString())
    .order("name");

  return (data ?? []) as AvailablePromotion[];
}

export async function assignPromotion(
  clientId: string,
  promotionId: string,
  notes: string | null
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const { error } = await supabase.from("client_promotions").insert({
    tenant_id: session.tenantId,
    client_id: clientId,
    promotion_id: promotionId,
    status: "active",
    notes: notes || null,
    used_units: 0,
  });

  if (error) {
    console.error("[assignPromotion]", error.message);
    return { error: "assignError" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return {};
}

export async function markPromotionUsed(
  id: string,
  clientId: string,
  used: boolean
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_promotions")
    .update({ status: used ? "completed" : "active", used_at: used ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    console.error("[markPromotionUsed]", error.message);
    return { error: "updateError" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return {};
}

export async function removeClientPromotion(
  id: string,
  clientId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_promotions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    console.error("[removeClientPromotion]", error.message);
    return { error: "removeError" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return {};
}
