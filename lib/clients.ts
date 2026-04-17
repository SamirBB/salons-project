/** Prikaz imena klijenta: ime + prezime ako postoje, inače legacy `full_name`. */
export function clientDisplayName(row: {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
}): string {
  const f = row.first_name?.trim() ?? "";
  const l = row.last_name?.trim() ?? "";
  if (f || l) return [f, l].filter(Boolean).join(" ");
  return row.full_name?.trim() ?? "";
}

export function clientInitialLetter(displayName: string): string {
  const c = displayName.trim()[0];
  return c ? c.toUpperCase() : "?";
}
