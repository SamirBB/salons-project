"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .slice(0, 50);
}

export async function createTenant(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();

  if (!name) return { error: "Naziv salona je obavezan." };

  // Generate unique slug
  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: tenantId, error } = await supabase.rpc("create_tenant", {
    p_name: name,
    p_slug: slug,
    p_phone: phone || null,
    p_address: address || null,
    p_city: city || null,
    p_email: user.email ?? null,
  });

  if (error || !tenantId) {
    console.error("Tenant create error:", JSON.stringify(error));
    return { error: `Greška: ${error?.message ?? "nepoznato"}` };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
