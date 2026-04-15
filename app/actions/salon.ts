"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

export async function updateSalon(
  _state: { error?: string; success?: boolean } | undefined,
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

  if (!name) return { error: "Naziv salona je obavezan." };

  let workingHours = {};
  try {
    workingHours = JSON.parse(workingHoursRaw);
  } catch { /* ignore */ }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tenants")
    .update({
      name,
      phone: phone || null,
      city: city || null,
      address: address || null,
      working_hours: workingHours,
    })
    .eq("id", session.tenantId);

  if (error) {
    return { error: "Greška pri spremanju podataka." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
