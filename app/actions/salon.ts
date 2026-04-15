"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function updateSalon(
  _state: { error?: string; success?: boolean; logoUrl?: string } | undefined,
  formData: FormData
) {
  const session = await getSession();

  if (session.role !== "owner" && session.role !== "manager") {
    return { error: "Nemate dozvolu za ovu akciju." };
  }

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const workingHoursRaw = (formData.get("working_hours") as string) ?? "{}";
  const logoFile = formData.get("logo") as File | null;

  if (!name) return { error: "Naziv salona je obavezan." };

  let workingHours = {};
  try {
    workingHours = JSON.parse(workingHoursRaw);
  } catch { /* ignore */ }

  const supabase = await createClient();

  // Upload logo ako je odabran
  let logoUrl: string | undefined;
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: "Logo ne smije biti veći od 2MB." };
    }

    const ext = logoFile.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${session.tenantId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("salon-assets")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });

    if (uploadError) {
      return { error: "Greška pri uploadu loga." };
    }

    const { data: urlData } = supabase.storage
      .from("salon-assets")
      .getPublicUrl(path);

    // Dodaj timestamp da se izbjegne browser cache
    logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
  }

  const updateData: Record<string, unknown> = {
    name,
    phone: phone || null,
    city: city || null,
    address: address || null,
    working_hours: workingHours,
  };

  if (logoUrl) updateData.logo_url = logoUrl;

  const { error } = await supabase
    .from("tenants")
    .update(updateData)
    .eq("id", session.tenantId);

  if (error) {
    return { error: "Greška pri spremanju podataka." };
  }

  revalidatePath("/", "layout");
  return { success: true, logoUrl };
}
