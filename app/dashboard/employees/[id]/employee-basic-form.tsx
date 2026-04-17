"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateEmployee } from "@/app/actions/employees";

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#64748b",
];

type Props = {
  employeeId: string;
  canManage: boolean;
  initialData: {
    full_name: string;
    email: string;
    phone: string | null;
    job_title: string | null;
    color: string | null;
    bio: string | null;
  };
};

export default function EmployeeBasicForm({ employeeId, canManage, initialData }: Props) {
  const t = useTranslations("employeeDetail");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(initialData.full_name);
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [jobTitle, setJobTitle] = useState(initialData.job_title ?? "");
  const [color, setColor] = useState(initialData.color ?? PRESET_COLORS[0]);
  const [bio, setBio] = useState(initialData.bio ?? "");

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateEmployee(employeeId, {
        full_name: fullName,
        phone: phone || undefined,
        job_title: jobTitle || undefined,
        color,
        bio: bio || undefined,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      <h3 className="text-sm font-semibold text-slate-700">{t("basicInfo")}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Full name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            {t("fullName")}
          </label>
          {canManage ? (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-sm text-slate-900 py-2">{fullName}</p>
          )}
        </div>

        {/* Email (read-only always) */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <p className="text-sm text-slate-600 py-2">{initialData.email}</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            {t("phone")}
          </label>
          {canManage ? (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-sm text-slate-900 py-2">{phone || "—"}</p>
          )}
        </div>

        {/* Job title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            {t("position")}
          </label>
          {canManage ? (
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-sm text-slate-900 py-2">{jobTitle || "—"}</p>
          )}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          {t("color")}
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={!canManage}
              onClick={() => canManage && setColor(c)}
              title={c}
              className="relative h-7 w-7 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-default"
              style={{ backgroundColor: c }}
            >
              {color === c && (
                <svg
                  className="absolute inset-0 m-auto h-4 w-4 text-white"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          {t("bio")}
        </label>
        {canManage ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          />
        ) : (
          <p className="text-sm text-slate-900 py-2 whitespace-pre-line">{bio || "—"}</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      {saved && (
        <p className="rounded-lg bg-green-50 border border-green-200 px-3.5 py-2.5 text-sm text-green-700">
          {t("changesSaved")}
        </p>
      )}

      {canManage && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? t("saving") : t("save")}
        </button>
      )}
    </div>
  );
}
