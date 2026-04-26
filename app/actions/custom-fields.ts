"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";
export type EntityType = "treatment" | "client" | "employee" | "pricelist";

export type CustomField = {
  id: string;
  tenant_id: string;
  entity_type: EntityType;
  field_key: string;
  label: string;
  field_type: FieldType;
  options: string[];
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

function generateKey(label: string): string {
  const key = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[čČ]/g, "c")
    .replace(/[šŠ]/g, "s")
    .replace(/[žŽ]/g, "z")
    .replace(/[ćĆ]/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 50);
  return key || `field_${Date.now()}`;
}

function revalidateAll() {
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/clients/custom-fields");
  revalidatePath("/dashboard/clients");
}

export async function getCustomFields(entityType: EntityType = "treatment"): Promise<CustomField[]> {
  const session = await getSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("treatment_custom_fields")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("entity_type", entityType)
    .order("display_order")
    .order("created_at");
  return (data ?? []) as CustomField[];
}

export async function getCustomFieldsAll(): Promise<Record<EntityType, CustomField[]>> {
  const session = await getSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("treatment_custom_fields")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .order("display_order")
    .order("created_at");
  const all = (data ?? []) as CustomField[];
  return {
    treatment: all.filter((f) => f.entity_type === "treatment"),
    client: all.filter((f) => f.entity_type === "client"),
    employee: all.filter((f) => f.entity_type === "employee"),
    pricelist: all.filter((f) => f.entity_type === "pricelist"),
  };
}

export async function getActiveCustomFields(entityType: EntityType = "treatment"): Promise<CustomField[]> {
  const session = await getSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("treatment_custom_fields")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("entity_type", entityType)
    .eq("is_active", true)
    .order("display_order")
    .order("created_at");
  return (data ?? []) as CustomField[];
}

export async function createCustomField(input: {
  label: string;
  field_type: FieldType;
  options: string[];
  is_required: boolean;
  entity_type?: EntityType;
}): Promise<{ error?: string }> {
  const session = await getSession();
  if (session.role !== "owner") return { error: "noPermission" };

  const label = input.label.trim();
  if (!label) return { error: "invalidLabel" };
  const field_key = generateKey(label);
  const entity_type: EntityType = input.entity_type ?? "treatment";

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("treatment_custom_fields")
    .select("display_order")
    .eq("tenant_id", session.tenantId)
    .eq("entity_type", entity_type)
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const display_order = last?.display_order != null ? last.display_order + 1 : 0;

  const { error } = await supabase.from("treatment_custom_fields").insert({
    tenant_id: session.tenantId,
    entity_type,
    field_key,
    label,
    field_type: input.field_type,
    options: input.options,
    is_required: input.is_required,
    display_order,
  });

  if (error) {
    if (error.code === "23505") return { error: "keyExists" };
    return { error: "createError" };
  }

  revalidateAll();
  return {};
}

export async function updateCustomField(
  id: string,
  input: {
    label: string;
    field_type: FieldType;
    options: string[];
    is_required: boolean;
    is_active: boolean;
  }
): Promise<{ error?: string }> {
  const session = await getSession();
  if (session.role !== "owner") return { error: "noPermission" };

  const label = input.label.trim();
  if (!label) return { error: "invalidLabel" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("treatment_custom_fields")
    .update({
      label,
      field_type: input.field_type,
      options: input.options,
      is_required: input.is_required,
      is_active: input.is_active,
    })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "updateError" };

  revalidateAll();
  return {};
}

export async function toggleCustomFieldActive(
  id: string,
  is_active: boolean
): Promise<{ error?: string }> {
  const session = await getSession();
  if (session.role !== "owner") return { error: "noPermission" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("treatment_custom_fields")
    .update({ is_active })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "updateError" };

  revalidateAll();
  return {};
}

export async function deleteCustomField(id: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (session.role !== "owner") return { error: "noPermission" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("treatment_custom_fields")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) return { error: "deleteError" };

  revalidateAll();
  return {};
}

export async function reorderCustomFields(ids: string[]): Promise<{ error?: string }> {
  const session = await getSession();
  if (session.role !== "owner") return { error: "noPermission" };

  const supabase = await createClient();
  await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("treatment_custom_fields")
        .update({ display_order: index })
        .eq("id", id)
        .eq("tenant_id", session.tenantId)
    )
  );

  revalidateAll();
  return {};
}
