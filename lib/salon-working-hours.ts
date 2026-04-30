/** Dijeli se između postavki salona (forma) i pregleda kartice (summary). */

export type DayHours = { open: string; close: string; closed: boolean };
export type WorkingHours = Record<string, DayHours>;

export const DAY_KEYS = [
  { key: "1", t: "monday" },
  { key: "2", t: "tuesday" },
  { key: "3", t: "wednesday" },
  { key: "4", t: "thursday" },
  { key: "5", t: "friday" },
  { key: "6", t: "saturday" },
  { key: "0", t: "sunday" },
] as const;

export const DEFAULT_HOURS: WorkingHours = {
  "1": { open: "09:00", close: "18:00", closed: false },
  "2": { open: "09:00", close: "18:00", closed: false },
  "3": { open: "09:00", close: "18:00", closed: false },
  "4": { open: "09:00", close: "18:00", closed: false },
  "5": { open: "09:00", close: "18:00", closed: false },
  "6": { open: "09:00", close: "14:00", closed: false },
  "0": { open: "09:00", close: "18:00", closed: true },
};

export function mergeWithDefaults(raw: Record<string, unknown>): WorkingHours {
  const result: WorkingHours = { ...DEFAULT_HOURS };
  for (const key of Object.keys(DEFAULT_HOURS)) {
    const val = raw[key] as Partial<DayHours> | undefined;
    if (val && typeof val === "object") {
      result[key] = {
        open: val.open ?? DEFAULT_HOURS[key].open,
        close: val.close ?? DEFAULT_HOURS[key].close,
        closed: val.closed ?? DEFAULT_HOURS[key].closed,
      };
    }
  }
  return result;
}
