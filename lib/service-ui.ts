/** Prikaz trajanja usluge kao u obrascu (lista opcija mora ostati konzistentna). */
export function formatServiceDuration(d: number, minSuffix: string): string {
  if (d < 60) {
    return `${d} ${minSuffix}`;
  }
  if (d % 60 === 0) {
    return `${d / 60}h`;
  }
  return `${Math.floor(d / 60)}h ${d % 60}${minSuffix}`;
}
