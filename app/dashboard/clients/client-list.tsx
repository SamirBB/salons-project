"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toggleClientActive, deleteClient } from "@/app/actions/clients";
import { clientDisplayName, clientInitialLetter } from "@/lib/clients";

export type ClientListRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  is_active: boolean;
  last_visit_at: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  jmb: string | null;
};

function ListAvatar({ url, letter }: { url: string | null; letter: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        {letter}
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt=""
      width={36}
      height={36}
      className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200"
      onError={() => setBroken(true)}
      unoptimized
    />
  );
}

export default function ClientList({
  clients,
  canManage,
}: {
  clients: ClientListRow[];
  canManage: boolean;
}) {
  const t = useTranslations("klijenti");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const name = clientDisplayName(c).toLowerCase();
    return (
      name.includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  function formatVisit(iso: string | null) {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteClient(id);
      setConfirmDeleteId(null);
    });
  }

  function handleToggle(e: React.MouseEvent, c: ClientListRow) {
    e.stopPropagation();
    setLoadingId(c.id);
    startTransition(async () => {
      await toggleClientActive(c.id, c.is_active);
      setLoadingId(null);
    });
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="text-4xl mb-3">👤</div>
        <p className="text-slate-500 text-sm">{t("noClients")}</p>
        {canManage && <p className="text-slate-400 text-xs mt-1">{t("noClientsHint")}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{t("allClients")}</h3>
        <div className="relative w-full sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>


      {filtered.length > 0 ? (
        <>
          {/* Table header — visible md+ */}
          <div className="hidden md:grid md:grid-cols-[auto_1fr_1fr_1fr_auto_auto_auto] lg:grid-cols-[auto_1fr_1fr_1fr_1fr_auto_auto_auto] items-center gap-x-4 px-5 py-2 border-b border-slate-100 bg-slate-50">
            <div className="w-9" />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("nameSummary")}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("phoneLabel")}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("emailLabel")}</span>
            <span className="hidden lg:block text-xs font-semibold uppercase tracking-wide text-slate-400">{t("lastVisit")}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("active")}</span>
            <div className="w-4" />
            {canManage && <div className="w-7" />}
          </div>

          <ul className="divide-y divide-slate-100">
            {filtered.map((c) => {
              const visitLabel = formatVisit(c.last_visit_at);
              const display = clientDisplayName(c);
              const initial = clientInitialLetter(display);
              return (
                <li
                  key={c.id}
                  onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors group"
                >
                  {/* Mobile layout */}
                  <div className="flex items-center gap-3 px-5 py-3.5 md:hidden">
                    <ListAvatar url={c.photo_url} letter={initial} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{display}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {visitLabel && (
                        <p className="text-xs text-slate-400 mt-0.5">{t("lastVisit")}: {visitLabel}</p>
                      )}
                    </div>
                    {canManage ? (
                      <button
                        type="button"
                        disabled={loadingId === c.id || isPending}
                        onClick={(e) => handleToggle(e, c)}
                        title={c.is_active ? t("setInactive") : t("setActive")}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors disabled:opacity-50 shrink-0 ${c.is_active ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"}`}
                      >
                        {loadingId === c.id ? "..." : c.is_active ? t("active") : t("inactive")}
                      </button>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${c.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.is_active ? t("active") : t("inactive")}
                      </span>
                    )}
                    <svg className="h-4 w-4 text-slate-300 group-hover:text-slate-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    {canManage && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {confirmDeleteId === c.id ? (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleDelete(c.id)} disabled={isPending} className="rounded px-2 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100">Da</button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Ne</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeleteId(c.id)} className="rounded p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="Obriši klijenta">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Desktop table layout md+ */}
                  <div className="hidden md:grid md:grid-cols-[auto_1fr_1fr_1fr_auto_auto_auto] lg:grid-cols-[auto_1fr_1fr_1fr_1fr_auto_auto_auto] items-center gap-x-4 px-5 py-3">
                    <ListAvatar url={c.photo_url} letter={initial} />
                    <p className="text-sm font-medium text-slate-900 truncate">{display}</p>
                    <p className="text-sm text-slate-500 truncate">{c.phone || "—"}</p>
                    <p className="text-sm text-slate-500 truncate">{c.email || "—"}</p>
                    <p className="hidden lg:block text-sm text-slate-400 truncate whitespace-nowrap">{visitLabel || "—"}</p>
                    {canManage ? (
                      <button
                        type="button"
                        disabled={loadingId === c.id || isPending}
                        onClick={(e) => handleToggle(e, c)}
                        title={c.is_active ? t("setInactive") : t("setActive")}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors disabled:opacity-50 whitespace-nowrap ${c.is_active ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"}`}
                      >
                        {loadingId === c.id ? "..." : c.is_active ? t("active") : t("inactive")}
                      </button>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${c.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.is_active ? t("active") : t("inactive")}
                      </span>
                    )}
                    <svg className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    {canManage && (
                      <div onClick={(e) => e.stopPropagation()}>
                        {confirmDeleteId === c.id ? (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleDelete(c.id)} disabled={isPending} className="rounded px-2 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100">Da</button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Ne</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeleteId(c.id)} className="rounded p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="Obriši klijenta">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          {search ? t("noSearchResults") : t("noClients")}
        </div>
      )}
    </div>
  );
}
