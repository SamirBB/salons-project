"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { navItems } from "./nav-items";

function getPageTitle(pathname: string): string {
  const item = navItems.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/")
  );
  return item?.title ?? "Dashboard";
}

export default function DashboardShell({
  children,
  userEmail,
  salonName,
}: {
  children: React.ReactNode;
  userEmail: string;
  salonName: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
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
        <Sidebar salonName={salonName} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar
          userEmail={userEmail}
          pageTitle={pageTitle}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
