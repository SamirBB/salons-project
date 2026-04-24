"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function login(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Unesite email i lozinku." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Pogrešan email ili lozinka." };
  }

  // ── Provjera uređaja za radnike ─────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: userTenant } = await supabase
      .from("user_tenants")
      .select("role, tenant_id")
      .eq("user_id", user.id)
      .single();

    if (userTenant && (userTenant.role === "employee" || userTenant.role === "receptionist")) {
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("profile_id", user.id)
        .eq("tenant_id", userTenant.tenant_id)
        .single();

      if (employee) {
        const { data: allowedDevices } = await supabase
          .from("employee_devices")
          .select("device_id, devices(device_identifier)")
          .eq("employee_id", employee.id);

        // Ako radnik ima dodjeljene uređaje, provjeri cookie
        if (allowedDevices && allowedDevices.length > 0) {
          const cookieStore = await cookies();
          const deviceCookie = cookieStore.get("salon_device_id")?.value;

          const isAllowed = allowedDevices.some((row) => {
            const dev = Array.isArray(row.devices) ? row.devices[0] : row.devices;
            return (dev as { device_identifier: string } | null)?.device_identifier === deviceCookie;
          });

          if (!isAllowed) {
            await supabase.auth.signOut();
            return { error: "Pristup nije dozvoljen sa ovog uređaja." };
          }
        }
      }
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();

  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!fullName || !email || !password) {
    return { error: "Popunite sva polja." };
  }

  if (password.length < 6) {
    return { error: "Lozinka mora imati najmanje 6 karaktera." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    if (
      error.message.includes("already registered") ||
      error.message.includes("User already registered")
    ) {
      return { error: "Korisnik s ovim emailom već postoji." };
    }
    if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("email rate")) {
      return { error: "Previše pokušaja registracije. Sačekajte nekoliko minuta i pokušajte ponovo." };
    }
    if (error.message.toLowerCase().includes("example") || error.message.toLowerCase().includes("test domain")) {
      return { error: "Test i primjer domene (example.com, test.com) nisu podržane. Koristite pravu email adresu." };
    }
    if (error.message.includes("invalid") || error.message.includes("email_address_invalid")) {
      return { error: "Email adresa nije ispravna. Koristite pravu email adresu (npr. ime@gmail.com)." };
    }
    if (error.message.includes("Password") || error.message.includes("password")) {
      return { error: "Lozinka mora imati najmanje 6 karaktera." };
    }
    return { error: error.message || "Greška pri registraciji. Pokušajte ponovo." };
  }

  revalidatePath("/", "layout");
  redirect("/setup");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
