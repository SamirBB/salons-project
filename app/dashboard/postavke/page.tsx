import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import SalonSettingsForm from "./salon-settings-form";

export default async function PostavkePage() {
  const session = await getSession();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, phone, city, address, working_hours, logo_url")
    .eq("id", session.tenantId)
    .single();

  const t = await getTranslations("salon");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("settings")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("settingsSubtitle")}</p>
      </div>

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
    </div>
  );
}
