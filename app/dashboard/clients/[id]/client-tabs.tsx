"use client";

import { useState } from "react";

type Tab = "karton" | "promocije";

type Props = {
  karton: React.ReactNode;
};

export default function ClientTabs({ karton }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("karton");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["karton", "promocije"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab === "karton" ? "Karton" : "Promocije"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "karton" && karton}

      {activeTab === "promocije" && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <p className="text-sm font-medium text-slate-500">Modul promocija nije još povezan sa klijentima.</p>
          <p className="mt-1 text-xs text-slate-400">Uskoro dostupno.</p>
        </div>
      )}
    </div>
  );
}
