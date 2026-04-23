"use client";

import { useState } from "react";

type Tab = "karton" | "promocije" | "prijedlozi";

type Props = {
  karton: React.ReactNode;
  promocije: React.ReactNode;
  prijedlozi: React.ReactNode;
};

export default function ClientTabs({ karton, promocije, prijedlozi }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("karton");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["karton", "promocije", "prijedlozi"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab === "karton" ? "Karton" : tab === "promocije" ? "Promocije" : "Prijedlozi"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "karton" && karton}

      {activeTab === "promocije" && promocije}

      {activeTab === "prijedlozi" && prijedlozi}
    </div>
  );
}
