import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionOptional } from "@/lib/session";
import { getLocale } from "@/lib/locale-server";
import { NAV_ACCESS } from "@/lib/roles";
import {
  buildClientsPdf,
  buildClientsXlsx,
  safeExportFilename,
  type ClientExportRow,
} from "@/lib/clients-export";

function dispositionAttachment(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(req: NextRequest) {
  const session = await getSessionOptional();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!NAV_ACCESS[session.role].includes("clients")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = req.nextUrl.searchParams.get("format");
  if (format !== "xlsx" && format !== "pdf") {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const clientId = req.nextUrl.searchParams.get("clientId");
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select(
      "first_name, last_name, full_name, date_of_birth, jmb, street, city, postal_code, phone, email, notes, google_reviewed, facebook_reviewed, instagram_reviewed, is_active, last_visit_at, created_at"
    )
    .eq("tenant_id", session.tenantId)
    .order("full_name");

  if (clientId) {
    query = query.eq("id", clientId);
  }

  const { data: clients, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (clients ?? []) as ClientExportRow[];

  if (clientId && rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const locale = await getLocale();

  const suffix = clientId ? `klijent-${clientId.slice(0, 8)}` : undefined;
  const filename = safeExportFilename(session.salonName, format === "xlsx" ? "xlsx" : "pdf", suffix);

  if (format === "xlsx") {
    const buf = await buildClientsXlsx(rows, locale);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": dispositionAttachment(filename),
        "Cache-Control": "no-store",
      },
    });
  }

  const buf = await buildClientsPdf(rows, locale, session.salonName);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": dispositionAttachment(filename),
      "Cache-Control": "no-store",
    },
  });
}
