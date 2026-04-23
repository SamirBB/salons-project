"use client";

import { useEffect, useRef, useState } from "react";

/* ─── types & helpers ─── */

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

function isoToParts(iso: string | null | undefined): Parts | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

/** Builds an ISO string that includes the browser's local timezone offset. */
function partsToIsoWithTz(p: Parts): string {
  const d = new Date(p.year, p.month - 1, p.day, p.hour, p.minute, 0);
  const off = -d.getTimezoneOffset(); // minutes, positive = east of UTC
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  const Y = String(p.year);
  const M = String(p.month).padStart(2, "0");
  const D = String(p.day).padStart(2, "0");
  const h = String(p.hour).padStart(2, "0");
  const m = String(p.minute).padStart(2, "0");
  return `${Y}-${M}-${D}T${h}:${m}:00${sign}${hh}:${mm}`;
}

function formatLabel(p: Parts | null, placeholder: string): string {
  if (!p) return placeholder;
  const d = new Date(p.year, p.month - 1, p.day);
  const days = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"];
  const dayName = days[d.getDay()];
  return `${dayName}, ${String(p.day).padStart(2, "0")}.${String(p.month).padStart(2, "0")}.${p.year}. ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar",
];
const DAY_HEADERS = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns 0=Mon … 6=Sun for the first day of the given month. */
function getFirstWeekday(year: number, month: number): number {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7;
}

/* ─── component ─── */

type Props = {
  name: string;
  defaultValue?: string | null;  // raw ISO from DB (UTC)
  placeholder?: string;
  required?: boolean;
  minIso?: string | null;        // minimum allowed ISO
  onChange?: (isoWithTz: string) => void;
};

export default function DateTimePicker({
  name,
  defaultValue,
  placeholder = "Odaberi datum i sat...",
  required,
  minIso,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<Parts | null>(() => isoToParts(defaultValue));
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const p = isoToParts(defaultValue);
    const now = new Date();
    return { year: p?.year ?? now.getFullYear(), month: p?.month ?? (now.getMonth() + 1) };
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const hiddenValue = parts ? partsToIsoWithTz(parts) : "";

  function selectDay(day: number) {
    const hour = parts?.hour ?? 12;
    const minute = parts?.minute ?? 0;
    const newParts: Parts = { year: view.year, month: view.month, day, hour, minute };
    setParts(newParts);
    onChange?.(partsToIsoWithTz(newParts));
  }

  function setHour(h: number) {
    const now = new Date();
    const base = parts ?? { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: 12, minute: 0 };
    const newParts = { ...base, hour: h };
    setParts(newParts);
    onChange?.(partsToIsoWithTz(newParts));
  }

  function setMinute(m: number) {
    const now = new Date();
    const base = parts ?? { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: 12, minute: 0 };
    const newParts = { ...base, minute: m };
    setParts(newParts);
    onChange?.(partsToIsoWithTz(newParts));
  }

  // Calendar grid
  const firstWd = getFirstWeekday(view.year, view.month);
  const daysInMonth = getDaysInMonth(view.year, view.month);
  const cells: (number | null)[] = [
    ...Array<null>(firstWd).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Disable days strictly before min
  const minParts = isoToParts(minIso ?? null);
  function isDisabled(day: number): boolean {
    if (!minParts) return false;
    if (view.year !== minParts.year) return view.year < minParts.year;
    if (view.month !== minParts.month) return view.month < minParts.month;
    return day < minParts.day;
  }

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();

  function prevMonth() {
    setView(v => v.month === 1 ? { year: v.year - 1, month: 12 } : { year: v.year, month: v.month - 1 });
  }
  function nextMonth() {
    setView(v => v.month === 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: v.month + 1 });
  }

  // 5-minute steps for minute selector
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input submitted with the form */}
      <input type="hidden" name={name} value={hiddenValue} />
      {/* Invisible real input for required validation fallback */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={hiddenValue}
          onChange={() => {}}
          className="absolute inset-0 w-full opacity-0 pointer-events-none"
        />
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors"
      >
        <span className={parts ? "text-slate-800" : "text-slate-400"}>
          {formatLabel(parts, placeholder)}
        </span>
        <svg className="w-4 h-4 text-slate-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl p-4 space-y-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Prethodni mjesec"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-700 select-none">
              {MONTH_NAMES[view.month - 1]} {view.year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Sljedeći mjesec"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 text-center">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-[10px] font-semibold text-slate-400 uppercase pb-1 select-none">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const isSelected =
                parts?.year === view.year &&
                parts?.month === view.month &&
                parts?.day === day;
              const isToday =
                todayY === view.year && todayM === view.month && todayD === day;
              const disabled = isDisabled(day);
              return (
                <button
                  key={`d-${day}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={[
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors select-none",
                    isSelected
                      ? "bg-indigo-600 text-white font-semibold"
                      : isToday
                      ? "ring-1 ring-indigo-400 text-indigo-600 hover:bg-indigo-50"
                      : disabled
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            <select
              value={parts?.hour ?? ""}
              onChange={e => setHour(Number(e.target.value))}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Sat</option>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-slate-400 font-bold">:</span>
            <select
              value={parts?.minute !== undefined ? Math.round(parts.minute / 5) * 5 % 60 : ""}
              onChange={e => setMinute(Number(e.target.value))}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Min</option>
              {minuteOptions.map(m => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </select>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Odaberi
          </button>
        </div>
      )}
    </div>
  );
}
