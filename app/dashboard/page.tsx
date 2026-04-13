import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Dobrodošli!</h2>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
        <p className="mt-4 text-sm text-slate-600">
          Odaberite modul iz navigacije s lijeve strane.
        </p>
      </div>
    </div>
  );
}
