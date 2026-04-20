import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/session";
import { getCustomFields } from "@/app/actions/custom-fields";
import FieldManager from "./field-manager";

export default async function CustomFieldsPage() {
  const session = await getSession();
  if (session.role !== "owner") redirect("/dashboard/clients");

  const [fields, t, tKlijenti] = await Promise.all([
    getCustomFields(),
    getTranslations("customFields"),
    getTranslations("klijenti"),
  ]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {tKlijenti("title")}
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("pageTitle")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("pageSubtitle")}</p>
      </div>

      <FieldManager initialFields={fields} />
    </div>
  );
}
