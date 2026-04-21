import type { Promotion } from "@/app/actions/promotions";

export function promotionLinkedServiceName(p: Pick<Promotion, "services">): string | null {
  const s = p.services;
  if (s == null) return null;
  if (Array.isArray(s)) return s[0]?.name ?? null;
  return s.name;
}
