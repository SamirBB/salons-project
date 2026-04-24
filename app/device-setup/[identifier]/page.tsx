import { createClient } from "@/lib/supabase/server";
import { registerDeviceCookie } from "@/app/actions/device-setup";

export default async function DeviceSetupPage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;

  // Provjeri da li identifier postoji
  const supabase = await createClient();
  const { data: device } = await supabase
    .from("devices")
    .select("name, is_active")
    .eq("device_identifier", identifier)
    .single();

  if (!device || !device.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-800">Uređaj nije pronađen</h1>
          <p className="text-sm text-slate-500">Ovaj link nije validan ili je uređaj deaktiviran.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 mx-auto">
          <svg className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
          </svg>
        </div>

        <div>
          <h1 className="text-lg font-semibold text-slate-800">Registracija uređaja</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ovaj browser će biti registrovan kao:
          </p>
          <p className="mt-2 text-base font-bold text-indigo-700">
            {device.name}
          </p>
        </div>

        <p className="text-xs text-slate-400">
          Nakon registracije, radnici koji imaju dozvolu za ovaj uređaj moći će se prijaviti s ovog browsera.
        </p>

        <form
          action={async () => {
            "use server";
            await registerDeviceCookie(identifier);
          }}
        >
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Registriraj ovaj uređaj
          </button>
        </form>
      </div>
    </div>
  );
}
