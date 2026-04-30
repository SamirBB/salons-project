"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type PromotionTreatment = {
  id: string;
  promotion_treatment_status: "pending" | "completed";
  promotion_service_type: "linked" | "bonus";
  treated_at: string;
  notes: string | null;
  amount_charged: number | null;
  invoice_number: string | null;
  created_by: string | null;
  created_by_name?: string | null;
  service: { id: string; name: string; color: string | null } | null;
};

export type ClientPromotion = {
  id: string;
  client_id: string;
  promotion_id: string;
  status: string;
  assigned_at: string;
  used_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name?: string | null;
  treatments: PromotionTreatment[];
  promotion: {
    id: string;
    name: string;
    description: string | null;
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

function mapTreatments(raw: unknown[]): PromotionTreatment[] {
  return raw.map((t: unknown) => {
    const treatment = t as Record<string, unknown>;
    const svcJoins = Array.isArray(treatment.client_treatment_services)
      ? treatment.client_treatment_services
      : [];
    const firstJoin = svcJoins[0] as Record<string, unknown> | undefined;
    const svcRaw = firstJoin?.services;
    const svc = svcRaw
      ? Array.isArray(svcRaw)
        ? (svcRaw[0] as { id: string; name: string } | undefined) ?? null
        : (svcRaw as { id: string; name: string })
      : null;
    return {
      id: treatment.id as string,
      promotion_treatment_status: treatment.promotion_treatment_status as "pending" | "completed",
      promotion_service_type: treatment.promotion_service_type as "linked" | "bonus",
      treated_at: treatment.treated_at as string,
      notes: (treatment.notes as string | null) ?? null,
      amount_charged: (treatment.amount_charged as number | null) ?? null,
      invoice_number: (treatment.invoice_number as string | null) ?? null,
      created_by: (treatment.created_by as string | null) ?? null,
      service: svc ? { id: svc.id, name: svc.name, color: (svc as { id: string; name: string; color?: string | null }).color ?? null } : null,
    };
  });
}

/** Cleanup expired promotions: delete pending treatments, normalise completed, delete client_promotion */
async function cleanupExpired(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expiredIds: string[]
) {
  if (expiredIds.length === 0) return;

  for (const cpId of expiredIds) {
    // Delete pending treatments
    await supabase
      .from("client_treatments")
      .delete()
      .eq("client_promotion_id", cpId)
      .eq("promotion_treatment_status", "pending");

    // Normalise completed treatments → become regular treatments
    await supabase
      .from("client_treatments")
      .update({ client_promotion_id: null, promotion_treatment_status: null, promotion_service_type: null })
      .eq("client_promotion_id", cpId)
      .eq("promotion_treatment_status", "completed");

    // Delete client_promotion record
    await supabase.from("client_promotions").delete().eq("id", cpId);
  }
}

export async function getClientPromotions(clientId: string): Promise<ClientPromotion[]> {
  const session = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("client_promotions")
    .select(`
      id, client_id, promotion_id, status, assigned_at, used_at, notes, created_by,
      promotions(id, name, description, promotion_type, color, ends_at, is_active),
      client_treatments(id, promotion_treatment_status, promotion_service_type, treated_at, notes, amount_charged, invoice_number, created_by,
        client_treatment_services(service_id, services(id, name, color)))
    `)
    .eq("client_id", clientId)
    .eq("tenant_id", session.tenantId)
    .order("assigned_at", { ascending: false });

  const rows = data ?? [];
  const now = new Date();

  // Split expired vs active
  const expiredIds: string[] = [];
  const active: typeof rows = [];

  for (const row of rows) {
    const promo = Array.isArray(row.promotions) ? row.promotions[0] : row.promotions;
    const isExpired = promo?.ends_at && new Date(promo.ends_at) < now;
    if (isExpired) {
      expiredIds.push(row.id);
    } else {
      active.push(row);
    }
  }

  // Clean up expired in background (fire-and-forget is fine here)
  if (expiredIds.length > 0) {
    await cleanupExpired(supabase, expiredIds);
  }

  // Collect all created_by user IDs (from promotions + their treatments)
  const allCreatorIds = new Set<string>();
  for (const row of active) {
    if (row.created_by) allCreatorIds.add(row.created_by as string);
    const rawTreatments = Array.isArray(row.client_treatments) ? row.client_treatments : [];
    for (const t of rawTreatments) {
      const tr = t as Record<string, unknown>;
      if (tr.created_by) allCreatorIds.add(tr.created_by as string);
    }
  }

  // Resolve creator names via DB function (checks profiles → auth metadata → email)
  const profileIdToName = new Map<string, string>();
  if (allCreatorIds.size > 0) {
    const { data: nameRows } = await supabase.rpc("resolve_user_names", { user_ids: [...allCreatorIds] });
    for (const row of nameRows ?? []) {
      if (row.id && row.full_name) profileIdToName.set(row.id, row.full_name);
    }
  }

  return active.map((row) => {
    const promo = Array.isArray(row.promotions) ? row.promotions[0] : row.promotions;
    const rawTreatments = Array.isArray(row.client_treatments) ? row.client_treatments : [];
    const createdBy = (row.created_by as string | null) ?? null;
    const treatments = mapTreatments(rawTreatments).map((t) => ({
      ...t,
      created_by_name: t.created_by ? (profileIdToName.get(t.created_by) ?? null) : null,
    }));
    return {
      id: row.id,
      client_id: row.client_id,
      promotion_id: row.promotion_id,
      status: row.status,
      assigned_at: row.assigned_at,
      used_at: row.used_at ?? null,
      notes: row.notes,
      created_by: createdBy,
      created_by_name: createdBy ? (profileIdToName.get(createdBy) ?? null) : null,
      treatments,
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

  // Fetch promotion service IDs
  const { data: promoData } = await supabase
    .from("promotions")
    .select("linked_service_ids, bonus_service_ids")
    .eq("id", promotionId)
    .eq("tenant_id", session.tenantId)
    .single();

  const linkedIds: string[] = (promoData?.linked_service_ids as string[] | null) ?? [];
  const bonusIds: string[] = (promoData?.bonus_service_ids as string[] | null) ?? [];

  // Fetch prices for all involved services in one query
  const allServiceIds = [...new Set([...linkedIds, ...bonusIds])];
  const priceMap = new Map<string, number>();
  if (allServiceIds.length > 0) {
    const { data: svcRows } = await supabase
      .from("services")
      .select("id, price")
      .in("id", allServiceIds)
      .eq("tenant_id", session.tenantId);
    for (const s of svcRows ?? []) {
      priceMap.set(s.id, Number(s.price));
    }
  }

  // Insert client_promotion
  const { data: cp, error: cpError } = await supabase
    .from("client_promotions")
    .insert({
      tenant_id: session.tenantId,
      client_id: clientId,
      promotion_id: promotionId,
      status: "active",
      notes: notes || null,
      used_units: 0,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (cpError || !cp) {
    console.error("[assignPromotion]", cpError?.message);
    return { error: "assignError" };
  }

  // Create one treatment per service occurrence
  const now = new Date().toISOString();
  const serviceEntries = [
    ...linkedIds.map((id) => ({ service_id: id, type: "linked" as const })),
    ...bonusIds.map((id) => ({ service_id: id, type: "bonus" as const })),
  ];

  for (const entry of serviceEntries) {
    const amount_charged = priceMap.get(entry.service_id) ?? null;

    const { data: treatment } = await supabase
      .from("client_treatments")
      .insert({
        tenant_id: session.tenantId,
        client_id: clientId,
        client_promotion_id: cp.id,
        promotion_treatment_status: "pending",
        promotion_service_type: entry.type,
        treated_at: now,
        amount_charged,
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (treatment) {
      await supabase.from("client_treatment_services").insert({
        tenant_id: session.tenantId,
        treatment_id: treatment.id,
        service_id: entry.service_id,
      });
    }
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return {};
}

export async function completePromotionTreatment(
  treatmentId: string,
  clientPromotionId: string,
  clientId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  // Mark treatment as completed with current date
  const { error } = await supabase
    .from("client_treatments")
    .update({
      promotion_treatment_status: "completed",
      treated_at: new Date().toISOString(),
    })
    .eq("id", treatmentId)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "updateError" };

  // Check if all treatments for this promotion are now completed
  const { count } = await supabase
    .from("client_treatments")
    .select("id", { count: "exact", head: true })
    .eq("client_promotion_id", clientPromotionId)
    .eq("promotion_treatment_status", "pending");

  if (count === 0) {
    // All done → normalise completed treatments, remove promotion assignment
    await supabase
      .from("client_treatments")
      .update({ client_promotion_id: null, promotion_treatment_status: null, promotion_service_type: null })
      .eq("client_promotion_id", clientPromotionId);

    await supabase
      .from("client_promotions")
      .delete()
      .eq("id", clientPromotionId)
      .eq("tenant_id", session.tenantId);
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

  // Delete pending treatments
  await supabase
    .from("client_treatments")
    .delete()
    .eq("client_promotion_id", id)
    .eq("promotion_treatment_status", "pending");

  // Normalise completed treatments → regular history
  await supabase
    .from("client_treatments")
    .update({ client_promotion_id: null, promotion_treatment_status: null, promotion_service_type: null })
    .eq("client_promotion_id", id)
    .eq("promotion_treatment_status", "completed");

  // Delete promotion assignment
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
