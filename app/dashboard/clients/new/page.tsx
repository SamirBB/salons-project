import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_PERMISSIONS } from "@/lib/roles";
import ClientForm from "../client-form";

export default async function NewClientPage() {
  const session = await getSession();
  const t = await getTranslations("klijenti");

  if (!ROLE_PERMISSIONS[session.role].canManageClients) {
    redirect("/dashboard/clients");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("title")}
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("newClient")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("newClientSubtitle")}</p>
      </div>

      <ClientForm
        mode="create"
        canManage
        initial={{
          first_name: "",
          last_name: "",
          date_of_birth: "",
          jmb: "",
          street: "",
          city: "",
          postal_code: "",
          phone: "",
          email: "",
          notes: "",
          photo_url: null,
          google_reviewed: false,
          facebook_reviewed: false,
          instagram_reviewed: false,
        }}
      />
    </div>
  );
}
