"use client";

import { useState, useTransition } from "react";
import { addDevice, deleteDevice } from "@/app/actions/devices";
import type { Device } from "@/app/actions/devices";

type Props = {
  devices: Device[];
  appUrl: string;
};

export default function DevicesSettings({ devices, appUrl }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addDevice(name);
      if (result.error) {
        setError("Greška pri dodavanju uređaja.");
        return;
      }
      setName("");
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteDevice(id);
      setConfirmDelete(null);
    });
  }

  function copyLink(device: Device) {
    const link = `${appUrl}/device-setup/${device.device_identifier}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(device.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Uređaji</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registrirani uređaji sa kojih se radnici mogu prijaviti
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 w-9 h-9 text-xl font-medium text-white hover:bg-indigo-700 transition-colors leading-none"
          >
            +
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">Novi uređaj</p>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Naziv uređaja
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="npr. Tablet recepcija, Kasa 1"
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setName(""); setError(null); }}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Odustani
            </button>
            <button
              onClick={handleAdd}
              disabled={!name.trim() || isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Dodajem…" : "Dodaj"}
            </button>
          </div>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-400">Nema registriranih uređaja</p>
          <p className="text-xs text-slate-300 mt-1">Kliknite + da dodate uređaj</p>
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((d) => {
            const setupLink = `${appUrl}/device-setup/${d.device_identifier}`;
            return (
              <div
                key={d.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                  <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono truncate" title={d.device_identifier}>
                    {d.device_identifier}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      readOnly
                      value={setupLink}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 font-mono truncate"
                    />
                    <button
                      onClick={() => copyLink(d)}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {copiedId === d.id ? "✓ Kopirano" : "Kopiraj"}
                    </button>
                  </div>
                </div>
                <div className="shrink-0">
                  {confirmDelete === d.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(d.id)}
                        disabled={isPending}
                        className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Da
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        Ne
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(d.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
