"use client";

import Link from "next/link";

type Tab = "salon" | "uredaji" | "polja";

type Props = {
  activeTab: Tab;
};

export default function ProfileTabs({ activeTab }: Props) {
  const tabs: { key: Tab; label: string; href: string }[] = [
    { key: "salon", label: "Postavke salona", href: "/dashboard/profile" },
    { key: "uredaji", label: "Uređaji", href: "/dashboard/profile?tab=uredaji" },
    { key: "polja", label: "Prilagođena polja", href: "/dashboard/profile?tab=polja" },
  ];

  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === tab.key
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
