import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { ROLE_PERMISSIONS } from "@/lib/roles";
import { clientDisplayName, clientInitialLetter } from "@/lib/clients";
import ClientForm from "../client-form";
import TreatmentKarton from "./treatment-karton";
import { getActiveCustomFields } from "@/app/actions/custom-fields";

function dateToInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const supabase = await createClient();
  const t = await getTranslations("klijenti");

  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, full_name, first_name, last_name, date_of_birth, jmb, street, city, postal_code, phone, email, notes, photo_url, google_reviewed, facebook_reviewed, instagram_reviewed, is_active"
    )
    .eq("id", id)
    .eq("tenant_id", session.tenantId)
    .single();

  if (!client) notFound();

  const canManage = ROLE_PERMISSIONS[session.role].canManageClients;

  const [{ data: rawTreatments }, { data: employees }, { data: services }, customFields] = await Promise.all([
    supabase
      .from("client_treatments")
      .select("*, employees(full_name, color), client_treatment_services(service_id, services(id, name, price))")
      .eq("client_id", id)
      .eq("tenant_id", session.tenantId)
      .order("treated_at", { ascending: false }),
    supabase
      .from("employees")
      .select("id, full_name, color")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("services")
      .select("id, name, price, category")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true)
      .order("category", { nullsFirst: true })
      .order("name"),
    getActiveCustomFields(),
  ]);

  // Flatten junction table into services array per treatment
  const treatments = (rawTreatments ?? []).map((t: any) => ({
    ...t,
    services: (t.client_treatment_services ?? [])
      .map((cts: any) => cts.services)
      .filter(Boolean),
  }));
  const display = clientDisplayName(client);
  const initialLetter = clientInitialLetter(display);

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
          {t("title")}
        </Link>
      </div>

      {/* Client header — avatar, ime, export */}
      <div className="flex flex-wrap items-center gap-3">
        {client.photo_url ? (
          <img
            src={client.photo_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
            {initialLetter}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{display}</h2>
          <p className="text-sm text-slate-500">
            {client.is_active ? (
              <span className="text-green-700">{t("active")}</span>
            ) : (
              <span className="text-slate-500">{t("inactive")}</span>
            )}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={`/api/dashboard/clients/export?format=xlsx&clientId=${encodeURIComponent(client.id)}`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            {t("exportClientExcel")}
          </a>
          <a
            href={`/api/dashboard/clients/export?format=pdf&clientId=${encodeURIComponent(client.id)}`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            {t("exportClientPdf")}
          </a>
        </div>
      </div>

      <ClientForm
        mode="edit"
        clientId={client.id}
        canManage={canManage}
        initial={{
          first_name: client.first_name ?? "",
          last_name: client.last_name ?? "",
          date_of_birth: dateToInputValue(client.date_of_birth),
          jmb: client.jmb ?? "",
          street: client.street ?? "",
          city: client.city ?? "",
          postal_code: client.postal_code ?? "",
          phone: client.phone ?? "",
          email: client.email ?? "",
          notes: client.notes ?? "",
          photo_url: client.photo_url,
          google_reviewed: client.google_reviewed,
          facebook_reviewed: client.facebook_reviewed,
          instagram_reviewed: client.instagram_reviewed,
          legacy_full_name: client.full_name,
        }}
      />

      <TreatmentKarton
        clientId={client.id}
        treatments={treatments as any}
        employees={employees ?? []}
        services={(services ?? []) as any}
        customFields={customFields}
        canManage={canManage}
        currentEmployeeId={session.employeeId}
      />
    </div>
  );
}
