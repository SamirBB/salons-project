"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  insertClient,
  removeClientPhoto,
  updateClient,
  uploadClientPhoto,
} from "@/app/actions/clients";
import { clientDisplayName } from "@/lib/clients";

export type ClientFormInitial = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  jmb: string;
  street: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  notes: string;
  photo_url: string | null;
  google_reviewed: boolean;
  facebook_reviewed: boolean;
  instagram_reviewed: boolean;
  /** Za read-only prikaz ako nema first/last (stari zapisi) */
  legacy_full_name?: string;
};

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  clientId?: string;
  canManage: boolean;
  initial: ClientFormInitial;
  onSaved?: () => void;
};

function ReviewToggle({
  active,
  label,
  abbr,
  onToggle,
  disabled,
}: {
  active: boolean;
  label: string;
  abbr: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold transition-colors disabled:opacity-50 ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
    >
      <span className={active ? "line-through decoration-2 decoration-slate-700" : ""}>{abbr}</span>
    </button>
  );
}

export default function ClientForm({ mode, clientId, canManage, initial, onSaved }: Props) {
  const t = useTranslations("klijenti");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [photoPending, setPhotoPending] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoFileRef = useRef<File | null>(null);

  const [first_name, setFirstName] = useState(initial.first_name);
  const [last_name, setLastName] = useState(initial.last_name);
  const [date_of_birth, setDateOfBirth] = useState(initial.date_of_birth);
  const [jmb, setJmb] = useState(initial.jmb);
  const [street, setStreet] = useState(initial.street);
  const [city, setCity] = useState(initial.city);
  const [postal_code, setPostalCode] = useState(initial.postal_code);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [notes, setNotes] = useState(initial.notes);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photo_url);
  const [google_reviewed, setGoogleReviewed] = useState(initial.google_reviewed);
  const [facebook_reviewed, setFacebookReviewed] = useState(initial.facebook_reviewed);
  const [instagram_reviewed, setInstagramReviewed] = useState(initial.instagram_reviewed);

  if (!canManage) {
    const display = clientDisplayName({
      first_name,
      last_name,
      full_name: initial.legacy_full_name ?? null,
    });
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-sm text-slate-500">{t("readOnlyHint")}</p>
        <div className="flex flex-wrap items-start gap-4">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt=""
              className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 object-cover"
            />
          ) : null}
          <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2 min-w-0">
            <div className="sm:col-span-2">
              <dt className="text-slate-400">{t("nameSummary")}</dt>
              <dd className="font-medium text-slate-900">{display || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t("dateOfBirthLabel")}</dt>
              <dd className="text-slate-800">{date_of_birth || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t("jmbLabel")}</dt>
              <dd className="text-slate-800">{jmb || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">{t("streetLabel")}</dt>
              <dd className="text-slate-800">{street || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t("cityLabel")}</dt>
              <dd className="text-slate-800">{city || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t("postalCodeLabel")}</dt>
              <dd className="text-slate-800">{postal_code || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t("phoneLabel")}</dt>
              <dd className="text-slate-800">{phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">{t("emailLabel")}</dt>
              <dd className="text-slate-800">{email || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">{t("specialNoteLabel")}</dt>
              <dd className="text-slate-800 whitespace-pre-wrap">{notes || "—"}</dd>
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <dt className="text-slate-400 shrink-0">{t("reviewsTitle")}</dt>
              <dd className="flex gap-1.5">
                <ReviewToggle
                  active={google_reviewed}
                  label={t("reviewGoogle")}
                  abbr="G"
                  onToggle={() => {}}
                  disabled
                />
                <ReviewToggle
                  active={facebook_reviewed}
                  label={t("reviewFacebook")}
                  abbr="f"
                  onToggle={() => {}}
                  disabled
                />
                <ReviewToggle
                  active={instagram_reviewed}
                  label={t("reviewInstagram")}
                  abbr="In"
                  onToggle={() => {}}
                  disabled
                />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  function applyPhotoFile(file: File | null) {
    pendingPhotoFileRef.current = file;
    if (!file) {
      setPhotoPreview(initial.photo_url);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handlePhotoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    applyPhotoFile(file);
    if (mode === "edit" && clientId && file && file.size > 0) {
      setPhotoPending(true);
      const fd = new FormData();
      fd.set("photo", file);
      startTransition(async () => {
        const res = await uploadClientPhoto(clientId, fd);
        setPhotoPending(false);
        if ("error" in res) {
          setMessage({ type: "err", text: t(`errors.${res.error}`) });
          applyPhotoFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setPhotoPreview(res.photo_url);
        pendingPhotoFileRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
        setMessage({ type: "ok", text: t("photoSaved") });
      });
    }
  }

  function handleRemovePhoto() {
    if (mode === "create") {
      pendingPhotoFileRef.current = null;
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!clientId) return;
    setPhotoPending(true);
    startTransition(async () => {
      const res = await removeClientPhoto(clientId);
      setPhotoPending(false);
      if ("error" in res) {
        setMessage({ type: "err", text: t(`errors.${res.error}`) });
        return;
      }
      setPhotoPreview(null);
      pendingPhotoFileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage({ type: "ok", text: t("photoRemoved") });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const payload = {
        first_name,
        last_name,
        date_of_birth,
        jmb,
        street,
        city,
        postal_code,
        phone,
        email,
        notes,
        google_reviewed,
        facebook_reviewed,
        instagram_reviewed,
      };

      if (mode === "create") {
        const res = await insertClient(payload);
        if ("error" in res) {
          setMessage({ type: "err", text: t(`errors.${res.error}`) });
          return;
        }
        const newId = res.id;
        const file = pendingPhotoFileRef.current;
        if (file && file.size > 0) {
          const fd = new FormData();
          fd.set("photo", file);
          const up = await uploadClientPhoto(newId, fd);
          if ("error" in up) {
            setMessage({ type: "err", text: t(`errors.${up.error}`) });
            router.push(`/dashboard/clients/${newId}`);
            return;
          }
        }
        router.push(`/dashboard/clients/${newId}`);
        return;
      }

      if (!clientId) return;
      const res = await updateClient(clientId, payload);
      if ("error" in res) {
        setMessage({ type: "err", text: t(`errors.${res.error}`) });
        return;
      }
      setMessage({ type: "ok", text: t("savedChanges") });
      onSaved?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {message && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">{t("clientPhoto")}</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white">
            {photoPreview ? (
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-slate-400 text-center px-1">{t("noPhoto")}</span>
            )}
          </div>
          <div className="space-y-2">
            <button
              type="button"
              disabled={photoPending}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {photoPreview ? t("photoChange") : t("photoUpload")}
            </button>
            <p className="text-xs text-slate-400 max-w-xs">{t("photoHint")}</p>
            {photoPreview && (
              <button
                type="button"
                disabled={photoPending}
                onClick={handleRemovePhoto}
                className="block text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {t("photoRemove")}
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handlePhotoInput}
          className="hidden"
        />
      </div>

      {/* Ime, Prezime, Datum rođenja, JMB — 2 kol na sm, 4 kol na lg */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="client-first" className="block text-sm font-medium text-slate-700 mb-1">
            {t("firstNameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="client-first"
            required
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("firstNamePlaceholder")}
            autoComplete="given-name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="client-last" className="block text-sm font-medium text-slate-700 mb-1">
            {t("lastNameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="client-last"
            required
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("lastNamePlaceholder")}
            autoComplete="family-name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="client-dob" className="block text-sm font-medium text-slate-700 mb-1">
            {t("dateOfBirthLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="client-dob"
            type="date"
            required
            value={date_of_birth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="client-jmb" className="mb-1 block text-sm font-medium text-slate-700">
            <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span>{t("jmbLabel")}</span>
              <span className="text-xs font-normal text-slate-400">{t("jmbOptionalHint")}</span>
            </span>
          </label>
          <input
            id="client-jmb"
            value={jmb}
            onChange={(e) => setJmb(e.target.value)}
            placeholder={t("jmbPlaceholder")}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Ulica, Grad, Poštanski — puna širina na sm, 3 kol na lg */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label htmlFor="client-street" className="block text-sm font-medium text-slate-700 mb-1">
            {t("streetLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="client-street"
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={t("streetPlaceholder")}
            autoComplete="street-address"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="client-city" className="block text-sm font-medium text-slate-700 mb-1">
            {t("cityLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="client-city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("cityPlaceholder")}
            autoComplete="address-level2"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="client-postal" className="block text-sm font-medium text-slate-700 mb-1">
            {t("postalCodeLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="client-postal"
            required
            value={postal_code}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder={t("postalCodePlaceholder")}
            autoComplete="postal-code"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Telefon + Email — 2 kol */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="client-phone" className="block text-sm font-medium text-slate-700 mb-1">
            {t("phoneLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="client-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("phonePlaceholder")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="client-email" className="block text-sm font-medium text-slate-700 mb-1">
            {t("emailLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="client-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="client-notes" className="block text-sm font-medium text-slate-700 mb-1">
          {t("specialNoteLabel")}
        </label>
        <textarea
          id="client-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("specialNotePlaceholder")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{t("reviewsTitle")}</h3>
        <p className="text-xs text-slate-500 mb-3">{t("reviewsHint")}</p>
        <div className="flex flex-wrap gap-2">
          <ReviewToggle
            active={google_reviewed}
            label={t("reviewGoogle")}
            abbr="G"
            onToggle={() => setGoogleReviewed(!google_reviewed)}
            disabled={isPending}
          />
          <ReviewToggle
            active={facebook_reviewed}
            label={t("reviewFacebook")}
            abbr="f"
            onToggle={() => setFacebookReviewed(!facebook_reviewed)}
            disabled={isPending}
          />
          <ReviewToggle
            active={instagram_reviewed}
            label={t("reviewInstagram")}
            abbr="In"
            onToggle={() => setInstagramReviewed(!instagram_reviewed)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || photoPending}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {isPending ? t("saving") : mode === "create" ? t("createButton") : t("saveButton")}
        </button>
        <Link
          href="/dashboard/clients"
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
