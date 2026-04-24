import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import SalonSettingsForm from "./salon-settings-form";
import DevicesSettings from "./devices-settings";
import ProfileTabs from "./profile-tabs";
import { getDevices } from "@/app/actions/devices";

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/dashboard");
  }

  const { tab } = await searchParams;
  const activeTab = tab === "uredaji" ? "uredaji" : "salon";

  const supabase = await createClient();
  const t = await getTranslations("salon");

  const [{ data: tenant }, devices] = await Promise.all([
    supabase
      .from("tenants")
      .select("name, phone, city, address, working_hours, logo_url")
      .eq("id", session.tenantId)
      .single(),
    getDevices(),
  ]);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("settings")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("settingsSubtitle")}</p>
      </div>

      <ProfileTabs activeTab={activeTab} />

      {activeTab === "salon" && (
        <SalonSettingsForm
          initialData={{
            name: tenant?.name ?? "",
            phone: tenant?.phone ?? "",
            city: tenant?.city ?? "",
            address: tenant?.address ?? "",
            workingHours: tenant?.working_hours ?? {},
            logoUrl: tenant?.logo_url ?? null,
          }}
        />
      )}

      {activeTab === "uredaji" && (
        <DevicesSettings devices={devices} appUrl={appUrl} />
      )}
    </div>
  );
}
