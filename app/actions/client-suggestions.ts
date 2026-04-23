"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type ClientSuggestion = {
  id: string;
  client_id: string;
  title: string;
  notes: string | null;
  created_at: string;
};

export async function getClientSuggestions(clientId: string): Promise<ClientSuggestion[]> {
  const session = await getSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("client_suggestions")
    .select("id, client_id, title, notes, created_at")
    .eq("client_id", clientId)
    .eq("tenant_id", session.tenantId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ClientSuggestion[];
}

export async function addClientSuggestion(
  clientId: string,
  title: string,
  notes: string | null
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const { error } = await supabase.from("client_suggestions").insert({
    tenant_id: session.tenantId,
    client_id: clientId,
    title: title.trim(),
    notes: notes || null,
  });

  if (error) {
    console.error("[addClientSuggestion]", error.message);
    return { error: "addError" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return {};
}

export async function updateClientSuggestion(
  id: string,
  clientId: string,
  title: string,
  notes: string | null
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_suggestions")
    .update({ title: title.trim(), notes: notes || null })
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    console.error("[updateClientSuggestion]", error.message);
    return { error: "updateError" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return {};
}

export async function deleteClientSuggestion(
  id: string,
  clientId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!["owner", "manager"].includes(session.role)) return { error: "noPermission" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_suggestions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", session.tenantId);

  if (error) {
    console.error("[deleteClientSuggestion]", error.message);
    return { error: "deleteError" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return {};
}
