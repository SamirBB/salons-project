"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createService, updateService } from "@/app/actions/services";
import type { Service } from "@/app/actions/services";

// Paleta organizirana po nijansama, 7 tonova po redu (tamno → svjetlo)
const COLOR_PALETTE: string[][] = [
  ["#7f1d1d","#991b1b","#b91c1c","#dc2626","#ef4444","#f87171","#fca5a5"], // red
  ["#7c2d12","#9a3412","#c2410c","#ea580c","#f97316","#fb923c","#fdba74"], // orange
  ["#78350f","#92400e","#b45309","#d97706","#f59e0b","#fbbf24","#fcd34d"], // amber
  ["#713f12","#854d0e","#a16207","#ca8a04","#eab308","#facc15","#fde047"], // yellow
  ["#365314","#3f6212","#4d7c0f","#65a30d","#84cc16","#a3e635","#bef264"], // lime
  ["#14532d","#166534","#15803d","#16a34a","#22c55e","#4ade80","#86efac"], // green
  ["#064e3b","#065f46","#047857","#059669","#10b981","#34d399","#6ee7b7"], // emerald
  ["#134e4a","#115e59","#0f766e","#0d9488","#14b8a6","#2dd4bf","#5eead4"], // teal
  ["#164e63","#155e75","#0e7490","#0891b2","#06b6d4","#22d3ee","#67e8f9"], // cyan
  ["#0c4a6e","#075985","#0369a1","#0284c7","#0ea5e9","#38bdf8","#7dd3fc"], // sky
  ["#1e3a8a","#1e40af","#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd"], // blue
  ["#312e81","#3730a3","#4338ca","#4f46e5","#6366f1","#818cf8","#a5b4fc"], // indigo
  ["#4a1d96","#5b21b6","#6d28d9","#7c3aed","#8b5cf6","#a78bfa","#c4b5fd"], // violet
  ["#581c87","#6b21a8","#7e22ce","#9333ea","#a855f7","#c084fc","#d8b4fe"], // purple
  ["#701a75","#86198f","#a21caf","#c026d3","#d946ef","#e879f9","#f0abfc"], // fuchsia
  ["#831843","#9d174d","#be185d","#db2777","#ec4899","#f472b6","#f9a8d4"], // pink
  ["#881337","#9f1239","#be123c","#e11d48","#f43f5e","#fb7185","#fda4af"], // rose
  ["#1c1917","#292524","#44403c","#57534e","#78716c","#a8a29e","#d6d3d1"], // stone
  ["#111827","#1f2937","#374151","#4b5563","#6b7280","#9ca3af","#d1d5db"], // gray
  ["#0f172a","#1e293b","#334155","#475569","#64748b","#94a3b8","#cbd5e1"], // slate
];

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

type Props =
  | { mode: "create"; service?: undefined }
  | { mode: "edit"; service: Service };

export default function ServiceForm({ mode, service }: Props) {
  const t = useTranslations("cjenovnik");
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState<string>(service?.color ?? "#6366f1");

  const action = mode === "create"
    ? createService
    : updateService.bind(null, service!.id);

  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state && "id" in state && state.id) {
      router.push(`/dashboard/price-list/${state.id}`);
    }
    if (state && "success" in state && state.success) {
      router.push(`/dashboard/price-list/${service!.id}`);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {t(`errors.${state.error}`, { defaultValue: t("errors.generic") })}
        </div>
      )}

      {/* Name */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-slate-700">{t("basicInfo")}</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("nameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={service?.name ?? ""}
            placeholder={t("namePlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("descriptionLabel")}
          </label>
          <textarea
            name="description"
            rows={2}
            defaultValue={service?.description ?? ""}
            placeholder={t("descriptionPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("categoryLabel")}
          </label>
          <input
            name="category"
            type="text"
            defaultValue={service?.category ?? ""}
            placeholder={t("categoryPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Duration + Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("durationLabel")}
            </label>
            <select
              name="duration_minutes"
              defaultValue={service?.duration_minutes ?? 30}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d < 60
                    ? `${d} ${t("min")}`
                    : d % 60 === 0
                    ? `${d / 60}h`
                    : `${Math.floor(d / 60)}h ${d % 60}${t("min")}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("priceLabel")}
            </label>
            <div className="relative">
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={service?.price ?? "0"}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 pl-3.5 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Color */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-700">{t("colorLabel")}</h2>
        <ColorPicker selectedColor={selectedColor} onChange={setSelectedColor} />
      </div>

      {/* Internal note */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-700">{t("internalNoteLabel")}</h2>
        <textarea
          name="internal_note"
          rows={2}
          defaultValue={service?.internal_note ?? ""}
          placeholder={t("internalNotePlaceholder")}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending
            ? mode === "create" ? t("creating") : t("saving")
            : mode === "create" ? t("createButton") : t("saveButton")}
        </button>
      </div>
    </form>
  );
}

// ── Color Picker ──────────────────────────────────────────────────
function ColorPicker({
  selectedColor,
  onChange,
}: {
  selectedColor: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(selectedColor);
  const nativeRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(selectedColor);
  }, [selectedColor]);

  // Zatvori na klik izvan
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleHexInput(val: string) {
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val.toLowerCase());
  }

  function handleNativeChange(val: string) {
    onChange(val.toLowerCase());
    setHexInput(val.toLowerCase());
  }

  function pickSwatch(color: string) {
    onChange(color);
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <span
          className="inline-block w-5 h-5 rounded-md border border-slate-200 shrink-0"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="font-mono text-xs text-slate-500">{selectedColor}</span>
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl space-y-2.5 w-max">
          {/* Palette grid */}
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: "80px" }}>
            {COLOR_PALETTE.map((row, ri) => (
              <div key={ri} className="flex gap-1">
                {row.map((color) => {
                  const active = selectedColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      onClick={() => pickSwatch(color)}
                      className="w-6 h-6 rounded-md transition-all hover:scale-110 relative flex items-center justify-center"
                      style={{
                        backgroundColor: color,
                        outline: active ? "2px solid #1e293b" : "none",
                        outlineOffset: "2px",
                      }}
                    >
                      {active && (
                        <svg className="w-3 h-3 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Custom hex row */}
          <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
            <div
              className="w-7 h-7 rounded-lg border border-slate-200 shrink-0 cursor-pointer"
              style={{ backgroundColor: selectedColor }}
              onClick={() => nativeRef.current?.click()}
              title="Odaberi vlastitu boju"
            />
            <input
              ref={nativeRef}
              type="color"
              value={selectedColor}
              onChange={(e) => handleNativeChange(e.target.value)}
              className="sr-only"
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              maxLength={7}
              placeholder="#000000"
              spellCheck={false}
              className="w-24 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <input type="hidden" name="color" value={selectedColor} onChange={() => {}} />
    </div>
  );
}
