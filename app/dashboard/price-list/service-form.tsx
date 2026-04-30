"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createService, updateService } from "@/app/actions/services";
import type { Service } from "@/app/actions/services";
import ColorPicker from "@/components/color-picker";
import { formatServiceDuration } from "@/lib/service-ui";

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

export type ServiceFormProps =
  | { mode: "create" }
  | { mode: "edit"; service: Service; drawer?: boolean; onCloseDrawer?: () => void };

export default function ServiceForm(props: ServiceFormProps) {
  const t = useTranslations("cjenovnik");
  const router = useRouter();
  const mode = props.mode;
  const service = mode === "edit" ? props.service : undefined;
  const isDrawer = props.mode === "edit" ? props.drawer === true : false;
  const onCloseDrawer =
    props.mode === "edit" && isDrawer ? props.onCloseDrawer : undefined;

  const [selectedColor, setSelectedColor] = useState<string>(service?.color ?? "#6366f1");

  const action =
    mode === "create" ? createService : updateService.bind(null, service!.id);

  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;

    if ("id" in state && state.id) {
      router.push(`/dashboard/price-list/${state.id}`);
      return;
    }

    if ("success" in state && state.success && mode === "edit" && service?.id) {
      if (isDrawer && onCloseDrawer) {
        router.refresh();
        onCloseDrawer();
        return;
      }
      router.push(`/dashboard/price-list/${service.id}`);
    }
  }, [state, router, service, mode, isDrawer, onCloseDrawer]);

  const suffix = `${mode}-${isDrawer ? "drawer" : "page"}`;
  /** Isti vizuelni jezik kao EmployeeBasicForm (Uposlenici) */
  const labelClass = "block text-xs font-medium text-slate-700 mb-1.5";
  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
  const selectClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white";
  const textareaClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none";

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
          {t(`errors.${state.error}`, { defaultValue: t("errors.generic") })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div className="min-w-0">
          <label htmlFor={`service-name-${suffix}`} className={labelClass}>
            {t("nameLabel")}
            <span className="text-red-500"> *</span>
          </label>
          <input
            id={`service-name-${suffix}`}
            name="name"
            type="text"
            required
            defaultValue={service?.name ?? ""}
            placeholder={t("namePlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="min-w-0">
            <label className={labelClass} htmlFor={`service-category-${suffix}`}>
              {t("categoryLabel")}
            </label>
            <input
              id={`service-category-${suffix}`}
              name="category"
              type="text"
              defaultValue={service?.category ?? ""}
              placeholder={t("categoryPlaceholder")}
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label className={labelClass} htmlFor={`service-duration-${suffix}`}>
              {t("durationLabel")}
            </label>
            <select
              id={`service-duration-${suffix}`}
              name="duration_minutes"
              defaultValue={service?.duration_minutes ?? 30}
              className={selectClass}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {formatServiceDuration(d, t("min"))}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className={labelClass} htmlFor={`service-price-${suffix}`}>
              {t("priceLabel")}
            </label>
            <div className="relative">
              <input
                id={`service-price-${suffix}`}
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={service?.price ?? "0"}
                placeholder="0.00"
                className={`${inputClass} pl-3 pr-7`}
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                €
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
        <div>
          <label className={labelClass} htmlFor={`service-description-${suffix}`}>
            {t("descriptionLabel")}
          </label>
          <textarea
            id={`service-description-${suffix}`}
            name="description"
            rows={2}
            defaultValue={service?.description ?? ""}
            placeholder={t("descriptionPlaceholder")}
            className={textareaClass}
          />
        </div>

        <div className="border-t border-slate-100 pt-5">
          <label className="block text-xs font-medium text-slate-700 mb-2">
            {t("colorLabel")}
          </label>
          <ColorPicker selectedColor={selectedColor} onChange={setSelectedColor} />
        </div>

        <div className="border-t border-slate-100 pt-5">
          <label className={labelClass} htmlFor={`service-internal-note-${suffix}`}>
            {t("internalNoteLabel")}
          </label>
          <textarea
            id={`service-internal-note-${suffix}`}
            name="internal_note"
            rows={2}
            defaultValue={service?.internal_note ?? ""}
            placeholder={t("internalNotePlaceholder")}
            className={textareaClass}
          />
        </div>

        <div
          className={`border-t border-slate-100 pt-4 flex items-center gap-3 ${isDrawer ? "justify-start" : "justify-end"}`}
        >
          {!isDrawer && (
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t("cancel")}
            </button>
          )}
          <button
            type="submit"
            disabled={pending}
            className={
              isDrawer
                ? "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                : "rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            }
          >
            {pending
              ? mode === "create"
                ? t("creating")
                : t("saving")
              : mode === "create"
                ? t("createButton")
                : t("saveButton")}
          </button>
        </div>
      </div>
    </form>
  );
}
