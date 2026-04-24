"use client";

import { useState, useTransition } from "react";
import { setEmployeeDevices } from "@/app/actions/devices";
import type { Device } from "@/app/actions/devices";

type Props = {
  employeeId: string;
  allDevices: Device[];
  assignedDeviceIds: string[];
};

export default function EmployeeDevicesForm({ employeeId, allDevices, assignedDeviceIds }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedDeviceIds));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await setEmployeeDevices(employeeId, Array.from(selected));
      if (result.error) {
        setError("Greška pri snimanju dozvoljenih uređaja.");
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Dozvoljeni uređaji</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Radnik se može prijaviti samo sa označenih uređaja. Ako nijedan nije označen, pristup nije ograničen.
        </p>
      </div>

      {allDevices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-400">Nema registriranih uređaja.</p>
          <p className="text-xs text-slate-300 mt-1">
            Dodajte uređaje u Postavke → Uređaji.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allDevices.map((device) => (
            <label
              key={device.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(device.id)}
                onChange={() => toggle(device.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-800">{device.name}</span>
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {allDevices.length > 0 && (
        <div className="flex items-center gap-3 justify-end">
          {saved && (
            <span className="text-xs text-green-600 font-medium">✓ Snimljeno</span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Snimam…" : "Snimi"}
          </button>
        </div>
      )}
    </div>
  );
}
