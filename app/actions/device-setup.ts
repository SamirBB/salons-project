"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function registerDeviceCookie(identifier: string): Promise<{ error?: string }> {
  // Provjeri da identifier postoji u bazi
  const supabase = await createClient();

  const { data: device, error } = await supabase
    .from("devices")
    .select("id, name")
    .eq("device_identifier", identifier)
    .eq("is_active", true)
    .single();

  if (error || !device) {
    return { error: "Uređaj nije pronađen ili nije aktivan." };
  }

  // Postavi HttpOnly cookie sa identifierom
  const cookieStore = await cookies();
  cookieStore.set("salon_device_id", identifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 godina
    path: "/",
  });

  redirect("/login");
}
