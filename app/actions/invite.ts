"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidRole, type Role } from "@/lib/roles";
import { getSession } from "@/lib/session";

// ─── Vlasnik kreira invite ───────────────────────────────────────────────────

export async function createInvite(
  _state: { error?: string; success?: boolean; inviteUrl?: string } | undefined,
  formData: FormData
) {
  const session = await getSession();

  if (session.role !== "owner" && session.role !== "manager") {
    return { error: "Nemate dozvolu za pozivanje uposlenika." };
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const role = formData.get("role") as string;

  if (!fullName || !email) return { error: "Popunite sva polja." };
  if (!isValidRole(role) || role === "owner") {
    return { error: "Nevažeća rola." };
  }

  const supabase = await createClient();

  // Provjeri da li već postoji aktivan invite za ovaj email u ovom salonu
  const { data: existing } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("tenant_id", session.tenantId)
    .eq("email", email)
    .eq("status", "pending")
    .single();

  if (existing) {
    return { error: "Pozivnica za ovaj email već postoji i čeka prihvatanje." };
  }

  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({
      tenant_id: session.tenantId,
      email,
      full_name: fullName,
      role,
      created_by: session.userId,
    })
    .select("token")
    .single();

  if (error || !invite) {
    return { error: "Greška pri kreiranju pozivnice." };
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/invite/${invite.token}`;

  revalidatePath("/dashboard/uposlenici");
  return { success: true, inviteUrl };
}

// ─── Uposlenik prihvata invite ───────────────────────────────────────────────

export async function acceptInvite(
  _state: { error?: string } | undefined,
  formData: FormData
) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) return { error: "Nedostaju podaci." };
  if (password.length < 6) return { error: "Lozinka mora imati najmanje 6 karaktera." };

  const supabase = await createClient();

  // Dohvati invite
  const { data: invite, error: inviteError } = await supabase
    .from("invitations")
    .select("id, tenant_id, email, full_name, role, status, expires_at")
    .eq("token", token)
    .single();

  if (inviteError || !invite) return { error: "Pozivnica nije pronađena." };
  if (invite.status !== "pending") return { error: "Pozivnica je već iskorištena ili je istekla." };
  if (new Date(invite.expires_at) < new Date()) return { error: "Pozivnica je istekla." };

  // Registruj korisnika
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: invite.email,
    password,
    options: { data: { full_name: invite.full_name } },
  });

  if (signUpError) {
    if (signUpError.message.includes("already registered")) {
      // Korisnik već postoji — pokušaj login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password,
      });
      if (loginError) return { error: "Pogrešna lozinka za postojeći nalog." };
    } else {
      return { error: "Greška pri kreiranju naloga." };
    }
  }

  const userId = authData?.user?.id;
  if (!userId) return { error: "Greška pri kreiranju naloga." };

  // Kreiraj employee + user_tenants via SQL funkcija
  const { error: joinError } = await supabase.rpc("accept_invite", {
    p_token: token,
    p_user_id: userId,
    p_full_name: invite.full_name,
    p_email: invite.email,
  });

  if (joinError) {
    return { error: "Greška pri pridruživanju salonu." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
