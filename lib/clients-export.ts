import { readFileSync } from "node:fs";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { clientDisplayName } from "@/lib/clients";
import type { Locale } from "@/lib/locale";

export type ClientExportRow = {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  jmb: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  google_reviewed: boolean;
  facebook_reviewed: boolean;
  instagram_reviewed: boolean;
  is_active: boolean;
  last_visit_at: string | null;
  created_at: string;
};

type ExportMessages = {
  columns: string[];
  yes: string;
  no: string;
  pdfTitle: string;
};

const LOCALE_TO_BCP47: Record<Locale, string> = {
  bs: "bs-BA",
  hr: "hr-HR",
  en: "en-GB",
  sl: "sl-SI",
  it: "it-IT",
  es: "es-ES",
};

async function loadExportMessages(locale: Locale): Promise<ExportMessages> {
  const mod = await import(`../messages/${locale}.json`);
  const k = (mod as { default: { klijentiExport: ExportMessages } }).default.klijentiExport;
  return k;
}

function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(LOCALE_TO_BCP47[locale], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function dataRow(c: ClientExportRow, m: ExportMessages, locale: Locale): string[] {
  const yn = (v: boolean) => (v ? m.yes : m.no);
  return [
    clientDisplayName(c),
    c.first_name?.trim() ?? "",
    c.last_name?.trim() ?? "",
    formatDate(c.date_of_birth, locale),
    c.jmb ?? "",
    c.street ?? "",
    c.city ?? "",
    c.postal_code ?? "",
    c.phone ?? "",
    c.email ?? "",
    c.notes ?? "",
    yn(c.google_reviewed),
    yn(c.facebook_reviewed),
    yn(c.instagram_reviewed),
    yn(c.is_active),
    formatDate(c.last_visit_at, locale),
    formatDate(c.created_at, locale),
  ];
}

export async function buildClientsXlsx(
  clients: ClientExportRow[],
  locale: Locale
): Promise<Buffer> {
  const m = await loadExportMessages(locale);
  const aoa: string[][] = [m.columns, ...clients.map((c) => dataRow(c, m, locale))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Klijenti");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return buf;
}

function dejaVuPath(): string {
  return join(process.cwd(), "node_modules", "dejavu-fonts-ttf", "ttf", "DejaVuSans.ttf");
}

export async function buildClientsPdf(
  clients: ClientExportRow[],
  locale: Locale,
  salonTitle: string
): Promise<Buffer> {
  const m = await loadExportMessages(locale);
  const fontBuf = readFileSync(dejaVuPath());
  const headers = m.columns;
  const rows = clients.map((c) => dataRow(c, m, locale));

  const colWeights = [1.4, 1, 1, 0.85, 1, 1.3, 0.9, 0.65, 1, 1.2, 2.4, 0.45, 0.45, 0.45, 0.5, 0.85, 0.85];
  const sumW = colWeights.reduce((a, b) => a + b, 0);
  const usableWidth = 842 - 72;
  const colWidths = colWeights.map((w) => (w / sumW) * usableWidth);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 36,
      bufferPages: true,
    });
    doc.font(fontBuf);
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(12).text(`${m.pdfTitle}: ${salonTitle}`, { underline: true });
    doc.moveDown(0.75);

    const left = 36;
    let y = doc.y;
    const headerSize = 7;
    const bodySize = 6;
    const rowPad = 2;
    const bottom = doc.page.height - 36;

    function drawRow(cells: string[], size: number) {
      const lineH = size + rowPad * 2;
      if (y + lineH > bottom) {
        doc.addPage();
        doc.font(fontBuf);
        y = 36;
      }
      let x = left;
      doc.fontSize(size);
      for (let i = 0; i < cells.length; i++) {
        const w = colWidths[i] ?? 40;
        const txt = cells[i] ?? "";
        doc.text(txt, x + 2, y + rowPad, {
          width: w - 4,
          ellipsis: true,
          lineGap: 0,
        });
        x += w;
      }
      y += lineH;
    }

    drawRow(headers, headerSize);
    for (const r of rows) {
      drawRow(r, bodySize);
    }

    doc.end();
  });
}

export function safeExportFilename(salonName: string, ext: "xlsx" | "pdf", clientSuffix?: string): string {
  const base =
    salonName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40) || "salon";
  const d = new Date().toISOString().slice(0, 10);
  const part = clientSuffix ? `${base}-${clientSuffix}-${d}` : `${base}-${d}`;
  return `${part}.${ext}`;
}
