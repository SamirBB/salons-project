import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { ROLE_PERMISSIONS } from "@/lib/roles";
import { clientDisplayName, clientInitialLetter } from "@/lib/clients";
import ClientSummary from "./client-summary";
import ClientTabs from "./client-tabs";
import TreatmentKarton from "./treatment-karton";
import { getActiveCustomFields } from "@/app/actions/custom-fields";
import { getClientPromotions, getAvailablePromotions } from "@/app/actions/client-promotions";
import ClientSuggestionsKarton from "./client-suggestions-karton";
import { getClientSuggestions } from "@/app/actions/client-suggestions";
import type { Treatment, TreatmentService } from "@/app/actions/clients";

function dateToInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

type KartonEmployee = { id: string; full_name: string; color: string | null };
type KartonService = { id: string; name: string; price: number; category: string | null; color: string | null };

type NestedServiceRow = { id: string; name: string; price: number; color?: string | null };

type RawTreatmentServiceJoin = {
  service_id: string;
  services: NestedServiceRow | NestedServiceRow[] | null;
};

/** Oblik reda iz Supabase selecta sa `client_treatment_services(..., services(...))`. */
type RawTreatmentRow = {
  id: string;
  client_id: string;
  employee_id: string | null;
  treated_at: string;
  notes: string | null;
  amount_charged: number | null;
  invoice_number: string | null;
  created_at: string;
  custom_data?: Record<string, string | number | boolean | null>;
  employees?: { full_name: string; color: string | null } | null;
  client_treatment_services?: RawTreatmentServiceJoin[] | null;
  client_promotion_id?: string | null;
  promotion_treatment_status?: string | null;
  promotion_service_type?: string | null;
  is_cancelled?: boolean;
};

function joinedServiceToTreatmentService(
  svc: NestedServiceRow | NestedServiceRow[] | null | undefined
): TreatmentService | null {
  if (svc == null) return null;
  const row = Array.isArray(svc) ? svc[0] : svc;
  if (!row || typeof row.id !== "string") return null;
  return { id: row.id, name: row.name, price: Number(row.price), color: row.color ?? null };
}

function mapRawTreatmentToTreatment(row: RawTreatmentRow): Treatment {
  const treatmentServices = (row.client_treatment_services ?? [])
    .map((j) => joinedServiceToTreatmentService(j.services))
    .filter((s): s is TreatmentService => s !== null);

  return {
    id: row.id,
    client_id: row.client_id,
    employee_id: row.employee_id,
    treated_at: row.treated_at,
    notes: row.notes,
    amount_charged: row.amount_charged,
    invoice_number: row.invoice_number,
    custom_data: row.custom_data,
    created_at: row.created_at,
    employees: row.employees ?? undefined,
    services: treatmentServices,
    client_promotion_id: row.client_promotion_id ?? null,
    promotion_treatment_status: (row.promotion_treatment_status ?? null) as Treatment["promotion_treatment_status"],
    promotion_service_type: (row.promotion_service_type ?? null) as Treatment["promotion_service_type"],
    is_cancelled: row.is_cancelled ?? false,
  };
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

  const [{ data: rawTreatments }, { data: employees }, { data: services }, customFields, clientPromotions, availablePromotions, clientSuggestions] = await Promise.all([
    supabase
      .from("client_treatments")
      .select("*, employees(full_name, color), client_treatment_services(service_id, services(id, name, price, color))")
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
      .select("id, name, price, category, color")
      .eq("tenant_id", session.tenantId)
      .eq("is_active", true)
      .order("category", { nullsFirst: true })
      .order("name"),
    getActiveCustomFields(),
    getClientPromotions(id),
    getAvailablePromotions(),
    getClientSuggestions(id),
  ]);

  const allTreatments: Treatment[] = (rawTreatments ?? []).map((row) =>
    mapRawTreatmentToTreatment(row as RawTreatmentRow)
  );
  // Exclude pending promotion treatments — they only appear inside the promotion tab
  const treatments: Treatment[] = allTreatments.filter(
    (t) => t.promotion_treatment_status !== "pending"
  );

  const kartonEmployees: KartonEmployee[] = (employees ?? []).map((e) => ({
    id: e.id,
    full_name: e.full_name,
    color: e.color,
  }));

  const kartonServices: KartonService[] = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    category: s.category,
    color: s.color,
  }));

  const display = clientDisplayName(client);
  const initialLetter = clientInitialLetter(display);

  const initial = {
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
  };

  return (
    <div className="space-y-5">
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

      {/* Compact summary card */}
      <ClientSummary
        clientId={client.id}
        display={display}
        initialLetter={initialLetter}
        photoUrl={client.photo_url}
        isActive={client.is_active}
        canManage={canManage}
        initial={initial}
      />

      {/* Tabs: Prijedlozi | Tretman | [promotion tabs] | + Dodaj Promociju */}
      <ClientTabs
        clientId={client.id}
        promotions={clientPromotions}
        available={availablePromotions}
        canManage={canManage}
        employees={kartonEmployees}
        services={kartonServices}
        customFields={customFields}
        currentEmployeeId={session.employeeId}
        karton={
          <TreatmentKarton
            clientId={client.id}
            treatments={treatments}
            employees={kartonEmployees}
            services={kartonServices}
            customFields={customFields}
            canManage={canManage}
            currentEmployeeId={session.employeeId}
          />
        }
        prijedlozi={
          <ClientSuggestionsKarton
            clientId={client.id}
            suggestions={clientSuggestions}
            canManage={canManage}
          />
        }
      />
    </div>
  );
}
