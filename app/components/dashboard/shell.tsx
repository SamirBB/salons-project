"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { ALL_NAV_ITEMS } from "./nav-items";
import type { Role } from "@/lib/roles";
import type { Locale } from "@/lib/locale";

export default function DashboardShell({
  children,
  userEmail,
  salonName,
  role,
  locale,
}: {
  children: React.ReactNode;
  userEmail: string;
  salonName: string;
  role: Role;
  locale: Locale;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  function getPageTitle(path: string): string {
    const item = ALL_NAV_ITEMS.find(
      (n) => path === n.href || path.startsWith(n.href + "/")
    );
    return item ? tNav(item.key) : tNav("dashboard");
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg, drawer on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform lg:static lg:translate-x-0 lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar salonName={salonName} role={role} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar
          userEmail={userEmail}
          pageTitle={pageTitle}
          locale={locale}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
