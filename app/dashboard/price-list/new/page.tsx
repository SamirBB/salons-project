import { getSession } from "@/lib/session";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ServiceForm from "../service-form";

export default async function NovaUslugaPage() {
  const session = await getSession();
  const t = await getTranslations("cjenovnik");

  if (!["owner", "manager"].includes(session.role)) {
    redirect("/dashboard/price-list");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/price-list"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t("backToList")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t("newService")}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t("newServiceSubtitle")}</p>
      </div>

      <ServiceForm mode="create" />
    </div>
  );
}
