"use client";

import { useEffect, useRef, useState } from "react";

const COLOR_PALETTE: string[][] = [
  ["#7f1d1d","#991b1b","#b91c1c","#dc2626","#ef4444","#f87171","#fca5a5"],
  ["#7c2d12","#9a3412","#c2410c","#ea580c","#f97316","#fb923c","#fdba74"],
  ["#78350f","#92400e","#b45309","#d97706","#f59e0b","#fbbf24","#fcd34d"],
  ["#713f12","#854d0e","#a16207","#ca8a04","#eab308","#facc15","#fde047"],
  ["#365314","#3f6212","#4d7c0f","#65a30d","#84cc16","#a3e635","#bef264"],
  ["#14532d","#166534","#15803d","#16a34a","#22c55e","#4ade80","#86efac"],
  ["#064e3b","#065f46","#047857","#059669","#10b981","#34d399","#6ee7b7"],
  ["#134e4a","#115e59","#0f766e","#0d9488","#14b8a6","#2dd4bf","#5eead4"],
  ["#164e63","#155e75","#0e7490","#0891b2","#06b6d4","#22d3ee","#67e8f9"],
  ["#0c4a6e","#075985","#0369a1","#0284c7","#0ea5e9","#38bdf8","#7dd3fc"],
  ["#1e3a8a","#1e40af","#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd"],
  ["#312e81","#3730a3","#4338ca","#4f46e5","#6366f1","#818cf8","#a5b4fc"],
  ["#4a1d96","#5b21b6","#6d28d9","#7c3aed","#8b5cf6","#a78bfa","#c4b5fd"],
  ["#581c87","#6b21a8","#7e22ce","#9333ea","#a855f7","#c084fc","#d8b4fe"],
  ["#701a75","#86198f","#a21caf","#c026d3","#d946ef","#e879f9","#f0abfc"],
  ["#831843","#9d174d","#be185d","#db2777","#ec4899","#f472b6","#f9a8d4"],
  ["#881337","#9f1239","#be123c","#e11d48","#f43f5e","#fb7185","#fda4af"],
  ["#1c1917","#292524","#44403c","#57534e","#78716c","#a8a29e","#d6d3d1"],
  ["#111827","#1f2937","#374151","#4b5563","#6b7280","#9ca3af","#d1d5db"],
  ["#0f172a","#1e293b","#334155","#475569","#64748b","#94a3b8","#cbd5e1"],
];

type Props = {
  selectedColor: string;
  onChange: (color: string) => void;
  /** ime hidden inputa koje forma šalje; default "color" */
  name?: string;
};

export default function ColorPicker({ selectedColor, onChange, name = "color" }: Props) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(selectedColor);
  const nativeRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHexInput(selectedColor);
  }, [selectedColor]);

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
          {/* Palette grid — scroll after 3 rows */}
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

      <input type="hidden" name={name} value={selectedColor} onChange={() => {}} />
    </div>
  );
}
