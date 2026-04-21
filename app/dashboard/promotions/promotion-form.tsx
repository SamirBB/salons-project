"use client";

import { useTranslations } from "next-intl";
import { createPromotion } from "@/app/actions/promotions";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const COLOR_SWATCHES = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6b7280",
];

type ServiceOption = { id: string; name: string };

export default function PromotionForm({ services }: { services: ServiceOption[] }) {
  const t = useTranslations("promocije");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createPromotion, null);
  const [color, setColor] = useState("#6366f1");
  const [endsMin, setEndsMin] = useState("");

  useEffect(() => {
    if (state && "id" in state && state.id) {
      router.push(`/dashboard/promotions/${state.id}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {t(`errors.${state.error}`, { defaultValue: t("errors.generic") })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-slate-700">{t("basicInfo")}</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("nameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder={t("namePlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("descriptionLabel")}</label>
          <textarea
            name="description"
            rows={2}
            placeholder={t("descriptionPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("linkedServiceLabel")}</label>
          <select
            name="service_id"
            defaultValue=""
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">{t("serviceNone")}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("promotionTypeLabel")}</label>
          <select
            name="promotion_type"
            defaultValue="bundle"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="bundle">{t("promotionTypeBundle")}</option>
            <option value="discount">{t("promotionTypeDiscount")}</option>
            <option value="other">{t("promotionTypeOther")}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("startsAtLabel")}</label>
            <input
              name="starts_at"
              type="datetime-local"
              onChange={(e) => setEndsMin(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("endsAtLabel")} <span className="text-red-500">*</span>
            </label>
            <input
              name="ends_at"
              type="datetime-local"
              required
              min={endsMin || undefined}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("termsLabel")}</label>
          <textarea
            name="terms"
            rows={3}
            placeholder={t("termsPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("displayOrderLabel")}</label>
          <input
            name="display_order"
            type="number"
            defaultValue={0}
            className="w-full max-w-[12rem] rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" name="is_active" defaultChecked className="rounded border-slate-300 text-indigo-600" />
          {t("isActiveLabel")}
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-700">{t("colorLabel")}</h2>
        <div className="flex flex-wrap gap-2">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#1e293b" : "transparent",
              }}
            />
          ))}
        </div>
        <input type="hidden" name="color" value={color} />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? t("creating") : t("createButton")}
        </button>
      </div>
    </form>
  );
}
