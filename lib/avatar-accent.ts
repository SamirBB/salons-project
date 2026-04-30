/**
 * Avatari na listama: slovo koristi baznu palettu (#iz boravka kod color pickera),
 * krug dobija svjetliju nijansu iste boje (miks s bijelim).
 */

function normalizeHex(raw: string | null | undefined): string {
  if (!raw?.trim()) return "#6366f1";
  let h = raw.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    h = [...h].map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#6366f1";
  return `#${h.slice(0, 6).toLowerCase()}`;
}

function mixWithWhite(hex: string, whiteWeight: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const w = Math.min(1, Math.max(0, whiteWeight));
  const rr = Math.round(r * (1 - w) + 255 * w);
  const gg = Math.round(g * (1 - w) + 255 * w);
  const bb = Math.round(b * (1 - w) + 255 * w);
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(rr)}${to(gg)}${to(bb)}`;
}

export function employeeAvatarAccent(baseColor: string | null | undefined): {
  foreground: string;
  background: string;
} {
  const foreground = normalizeHex(baseColor);
  const background = mixWithWhite(foreground, 0.78);
  return { foreground, background };
}
