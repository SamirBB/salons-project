"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createEmployee } from "@/app/actions/create-employee";
import type { Device } from "@/app/actions/devices";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const INVITABLE_ROLES = ["manager", "employee", "receptionist"] as const;

type Props = {
  devices: Device[];
};

export default function NewEmployeeForm({ devices }: Props) {
  const [state, action, pending] = useActionState(createEmployee, undefined);
  const tRoles = useTranslations("roles");
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard/employees");
    }
  }, [state?.success, router]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Podaci radnika</h3>

      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="full_name" className="block text-xs font-medium text-slate-700 mb-1.5">
              Ime i prezime *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="npr. Ana Begić"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ana@email.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1.5">
              Lozinka *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Min. 6 karaktera"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-xs text-slate-400">Posaopćite lozinku radniku direktno.</p>
          </div>
          <div>
            <label htmlFor="role" className="block text-xs font-medium text-slate-700 mb-1.5">
              Rola *
            </label>
            <select
              id="role"
              name="role"
              defaultValue="employee"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>{tRoles(r)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Uređaji */}
        {devices.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Dozvoljeni uređaji
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Ako nijedan nije označen, pristup nije ograničen po uređaju.
            </p>
            <div className="space-y-2">
              {devices.map((device) => (
                <label
                  key={device.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    name="device_ids"
                    value={device.id}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                    <svg className="h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-800">{device.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {state?.error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Kreiram…" : "Kreiraj radnika"}
        </button>
      </form>
    </div>
  );
}
