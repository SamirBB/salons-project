import Link from "next/link";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import DevicesSettings from "./devices-settings";
import ProfileTabs from "./profile-tabs";
import CustomFieldsSettings from "./custom-fields-settings";
import SalonProfileSummary from "./salon-profile-summary";
import SalonWorkingHoursForm from "./salon-working-hours-form";
import { getDevices } from "@/app/actions/devices";
import { getCustomFieldsAll } from "@/app/actions/custom-fields";

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
  const activeTab =
    tab === "polja"
      ? "polja"
      : tab === "uredaji"
        ? "uredaji"
        : "radno_vrijeme";

  const supabase = await createClient();
  const tNav = await getTranslations("nav");

  const [{ data: tenant }, devices, allFields] = await Promise.all([
    supabase
      .from("tenants")
      .select("name, phone, city, address, working_hours, logo_url")
      .eq("id", session.tenantId)
      .single(),
    getDevices(),
    getCustomFieldsAll(),
  ]);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000");

  const initialData = {
    name: tenant?.name ?? "",
    phone: tenant?.phone ?? "",
    city: tenant?.city ?? "",
    address: tenant?.address ?? "",
    workingHours: (tenant?.working_hours ?? {}) as Record<string, unknown>,
    logoUrl: tenant?.logo_url ?? null,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {tNav("dashboard")}
        </Link>
      </div>

      <SalonProfileSummary initialData={initialData} />

      <ProfileTabs activeTab={activeTab} />

      {activeTab === "uredaji" && <DevicesSettings devices={devices} appUrl={appUrl} />}
      {activeTab === "radno_vrijeme" && (
        <SalonWorkingHoursForm
          key={JSON.stringify(tenant?.working_hours ?? null)}
          initialData={initialData}
        />
      )}
      {activeTab === "polja" && <CustomFieldsSettings fields={allFields} />}
    </div>
  );
}
