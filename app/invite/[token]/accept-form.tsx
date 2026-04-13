"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/app/actions/invite";

export default function AcceptForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(acceptInvite, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1.5">
          Kreirajte lozinku
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Minimum 6 karaktera"
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "Prijavljivanje..." : "Prihvati i pristupi salonu"}
      </button>
    </form>
  );
}
