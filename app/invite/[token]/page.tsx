import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import AcceptForm from "./accept-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invitations")
    .select("full_name, email, role, status, expires_at, tenants(name)")
    .eq("token", token)
    .single();

  // Nevažeći token
  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-sm w-full">
          <p className="text-2xl mb-3">❌</p>
          <h1 className="text-lg font-semibold text-slate-900">Pozivnica nije pronađena</h1>
          <p className="text-sm text-slate-500 mt-1">Link je neispravan ili je pozivnica uklonjena.</p>
        </div>
      </div>
    );
  }

  const salonName = (invite.tenants as unknown as { name: string } | null)?.name ?? "Salon";
  const isExpired = invite.status !== "pending" || new Date(invite.expires_at) < new Date();

  if (invite.status === "accepted") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-sm w-full">
          <p className="text-2xl mb-3">✅</p>
          <h1 className="text-lg font-semibold text-slate-900">Pozivnica već iskorištena</h1>
          <p className="text-sm text-slate-500 mt-1">Ova pozivnica je već prihvaćena.</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-sm w-full">
          <p className="text-2xl mb-3">⏰</p>
          <h1 className="text-lg font-semibold text-slate-900">Pozivnica je istekla</h1>
          <p className="text-sm text-slate-500 mt-1">Zamolite vlasnika salona da vam pošalje novu pozivnicu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Dobrodošli!</h1>
          <p className="text-sm text-slate-500 mt-1">Pozvani ste u salon</p>
        </div>

        {/* Invite info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Salon:</span>
              <span className="font-semibold text-slate-900">{salonName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ime:</span>
              <span className="font-medium text-slate-900">{invite.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-900">{invite.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Rola:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                {ROLE_LABELS[invite.role as Role] ?? invite.role}
              </span>
            </div>
          </div>

          <AcceptForm token={token} email={invite.email} />
        </div>
      </div>
    </div>
  );
}
