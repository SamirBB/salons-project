"use client";

import { useState, useEffect, useRef } from "react";

type ServiceOption = { id: string; name: string; category?: string | null };

type Props = {
  name: string;
  services: ServiceOption[];
  selectedIds: string[]; // may contain duplicates when mode="counted"
  onChange: (ids: string[]) => void;
  placeholder?: string;
  /** "multi"   — checkbox, unique items only (default)
   *  "counted" — + button, same item can be added multiple times */
  mode?: "multi" | "counted";
};

export default function ServiceMultiSelect({
  name,
  services,
  selectedIds,
  onChange,
  placeholder = "Odaberi usluge...",
  mode = "multi",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // --- multi mode helpers ---
  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    );
  }

  // --- counted mode helpers ---
  // Count occurrences per id
  const countMap = selectedIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  function addOne(id: string) {
    onChange([...selectedIds, id]);
  }

  function removeOne(id: string) {
    const idx = selectedIds.lastIndexOf(id);
    if (idx === -1) return;
    const next = [...selectedIds];
    next.splice(idx, 1);
    onChange(next);
  }

  function removeAll(id: string) {
    onChange(selectedIds.filter((s) => s !== id));
  }

  // Filtered + grouped services
  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = filtered.reduce<Record<string, ServiceOption[]>>((acc, s) => {
    const cat = s.category ?? "Ostalo";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  // For chip display
  const uniqueSelectedIds = [...new Set(selectedIds)];
  const selectedServices = services.filter((s) => uniqueSelectedIds.includes(s.id));
  const totalCount = selectedIds.length;

  const triggerLabel =
    totalCount === 0
      ? placeholder
      : mode === "counted"
      ? `${totalCount} stavki`
      : `${totalCount} odabrano`;

  return (
    <div className="relative" ref={ref}>
      {/* Hidden inputs — one per occurrence */}
      {selectedIds.map((id, i) => (
        <input key={`${id}-${i}`} type="hidden" name={name} value={id} />
      ))}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
          open
            ? "border-indigo-400 ring-2 ring-indigo-500"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={totalCount === 0 ? "text-slate-400" : "text-slate-700"}>
          {triggerLabel}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Chips */}
      {selectedServices.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {mode === "counted"
            ? selectedServices.map((s) => {
                const count = countMap[s.id] ?? 0;
                return (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-700"
                  >
                    {/* − */}
                    <button
                      type="button"
                      onClick={() => removeOne(s.id)}
                      className="flex h-4 w-4 items-center justify-center rounded hover:bg-indigo-200 transition-colors font-bold text-base leading-none"
                      title="Ukloni jedan"
                    >
                      −
                    </button>
                    <span className="px-0.5">{s.name}</span>
                    {/* Count badge */}
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {count}
                    </span>
                    {/* + */}
                    <button
                      type="button"
                      onClick={() => addOne(s.id)}
                      className="flex h-4 w-4 items-center justify-center rounded hover:bg-indigo-200 transition-colors font-bold text-base leading-none"
                      title="Dodaj još jedan"
                    >
                      +
                    </button>
                    {/* × remove all */}
                    <button
                      type="button"
                      onClick={() => removeAll(s.id)}
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-indigo-300 transition-colors ml-0.5"
                      title="Ukloni sve"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                );
              })
            : selectedServices.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-700"
                >
                  {s.name}
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="ml-0.5 rounded-full hover:bg-indigo-200 transition-colors p-0.5"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pretraži..."
                autoFocus
                className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto">
            {Object.keys(grouped).length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400 text-center">Nema rezultata</p>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                    {cat}
                  </p>
                  {items.map((s) => {
                    const count = countMap[s.id] ?? 0;
                    const checked = selectedIds.includes(s.id);

                    if (mode === "counted") {
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-slate-50 ${count > 0 ? "bg-indigo-50/40" : ""}`}
                        >
                          <span className={`text-sm ${count > 0 ? "text-indigo-700 font-medium" : "text-slate-700"}`}>
                            {s.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {count > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => removeOne(s.id)}
                                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base leading-none transition-colors"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center text-sm font-semibold text-indigo-700">
                                  {count}
                                </span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => addOne(s.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base leading-none transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // mode === "multi"
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggle(s.id)}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors hover:bg-slate-50 ${checked ? "bg-indigo-50/60" : ""}`}
                      >
                        <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${checked ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
                          {checked && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        <span className={checked ? "text-indigo-700 font-medium" : "text-slate-700"}>
                          {s.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {totalCount > 0 && (
            <div className="border-t border-slate-100 px-3.5 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {mode === "counted" ? `${totalCount} stavki` : `${totalCount} odabrano`}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                Obriši sve
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
