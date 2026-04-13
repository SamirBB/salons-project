"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
