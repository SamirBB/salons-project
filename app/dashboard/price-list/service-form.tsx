"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createService, updateService } from "@/app/actions/services";
import type { Service } from "@/app/actions/services";
import ColorPicker from "@/components/color-picker";

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

type Props =
  | { mode: "create"; service?: undefined }
  | { mode: "edit"; service: Service };

export default function ServiceForm({ mode, service }: Props) {
  const t = useTranslations("cjenovnik");
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState<string>(service?.color ?? "#6366f1");

  const action = mode === "create"
    ? createService
    : updateService.bind(null, service!.id);

  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state && "id" in state && state.id) {
      router.push(`/dashboard/price-list/${state.id}`);
    }
    if (state && "success" in state && state.success) {
      router.push(`/dashboard/price-list/${service!.id}`);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {t(`errors.${state.error}`, { defaultValue: t("errors.generic") })}
        </div>
      )}

      {/* Name */}
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
            defaultValue={service?.name ?? ""}
            placeholder={t("namePlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("descriptionLabel")}
          </label>
          <textarea
            name="description"
            rows={2}
            defaultValue={service?.description ?? ""}
            placeholder={t("descriptionPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("categoryLabel")}
          </label>
          <input
            name="category"
            type="text"
            defaultValue={service?.category ?? ""}
            placeholder={t("categoryPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Duration + Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("durationLabel")}
            </label>
            <select
              name="duration_minutes"
              defaultValue={service?.duration_minutes ?? 30}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d < 60
                    ? `${d} ${t("min")}`
                    : d % 60 === 0
                    ? `${d / 60}h`
                    : `${Math.floor(d / 60)}h ${d % 60}${t("min")}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("priceLabel")}
            </label>
            <div className="relative">
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={service?.price ?? "0"}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 pl-3.5 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Color */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-700">{t("colorLabel")}</h2>
        <ColorPicker selectedColor={selectedColor} onChange={setSelectedColor} />
      </div>

      {/* Internal note */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-700">{t("internalNoteLabel")}</h2>
        <textarea
          name="internal_note"
          rows={2}
          defaultValue={service?.internal_note ?? ""}
          placeholder={t("internalNotePlaceholder")}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Actions */}
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
          {pending
            ? mode === "create" ? t("creating") : t("saving")
            : mode === "create" ? t("createButton") : t("saveButton")}
        </button>
      </div>
    </form>
  );
}
