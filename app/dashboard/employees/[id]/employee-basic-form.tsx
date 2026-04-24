"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateEmployee, updateEmployeeRole } from "@/app/actions/employees";
import ColorPicker from "@/components/color-picker";

const EDITABLE_ROLES = ["manager", "employee", "receptionist"] as const;

type Props = {
  employeeId: string;
  profileId: string | null;
  canManage: boolean;
  initialData: {
    full_name: string;
    email: string;
    phone: string | null;
    job_title: string | null;
    color: string | null;
    bio: string | null;
    role: string;
  };
};

export default function EmployeeBasicForm({ employeeId, profileId, canManage, initialData }: Props) {
  const t = useTranslations("employeeDetail");
  const tRoles = useTranslations("roles");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Split full_name into first + last
  const nameParts = initialData.full_name.split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));

  const [email, setEmail] = useState(initialData.email);
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [jobTitle, setJobTitle] = useState(initialData.job_title ?? "");
  const [color, setColor] = useState(initialData.color ?? "#6366f1");
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [role, setRole] = useState(initialData.role);

  function handleSave() {
    if (!firstName.trim()) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

      // Update role if changed
      if (role !== initialData.role && profileId) {
        const roleResult = await updateEmployeeRole(profileId, role);
        if (roleResult.error) {
          setError(roleResult.error);
          return;
        }
      }

      const result = await updateEmployee(employeeId, {
        full_name: fullName,
        email: email !== initialData.email ? email : undefined,
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
        {/* First name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Ime *
          </label>
          {canManage ? (
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="off"
              placeholder="npr. Ana"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-sm text-slate-900 py-2">{firstName}</p>
          )}
        </div>

        {/* Last name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Prezime
          </label>
          {canManage ? (
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="off"
              placeholder="npr. Begić"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-sm text-slate-900 py-2">{lastName || "—"}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Email *
          </label>
          {canManage ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-sm text-slate-900 py-2">{email}</p>
          )}
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
              autoComplete="off"
              placeholder="npr. +387 61 123 456"
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
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <p className="text-sm text-slate-900 py-2">{jobTitle || "—"}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Rola *
          </label>
          {canManage ? (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {EDITABLE_ROLES.map((r) => (
                <option key={r} value={r}>{tRoles(r)}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-slate-900 py-2">{tRoles(role as "manager" | "employee" | "receptionist")}</p>
          )}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          {t("color")}
        </label>
        {canManage ? (
          <ColorPicker selectedColor={color} onChange={setColor} name="__color_unused" />
        ) : (
          <span
            className="inline-block w-6 h-6 rounded-full border border-slate-200"
            style={{ backgroundColor: color }}
          />
        )}
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
          disabled={isPending || !firstName.trim()}
          onClick={handleSave}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? t("saving") : t("save")}
        </button>
      )}
    </div>
  );
}
