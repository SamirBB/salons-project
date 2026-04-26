"use client";

import { useTranslations } from "next-intl";
import { updatePromotion, type Promotion } from "@/app/actions/promotions";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ColorPicker from "@/components/color-picker";
import DateTimePicker from "@/components/date-time-picker";
import ServiceMultiSelect from "@/components/service-multi-select";

type ServiceOption = { id: string; name: string; category?: string | null };

type Props = {
  promotion: Promotion;
  services: ServiceOption[];
};

export default function PromotionEditForm({ promotion: p, services }: Props) {
  const t = useTranslations("promocije");
  const router = useRouter();
  const action = updatePromotion.bind(null, p.id);
  const [state, formAction, pending] = useActionState(action, null);
  const [color, setColor] = useState(p.color ?? "#6366f1");
  const [startsAtIso, setStartsAtIso] = useState<string>(p.starts_at ?? "");
  const [linkedIds, setLinkedIds] = useState<string[]>(p.linked_service_ids ?? []);
  const [bonusIds, setBonusIds] = useState<string[]>(p.bonus_service_ids ?? []);
  const isExpired = !!p.ends_at && new Date(p.ends_at) < new Date();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {t(`errors.${state.error}`, { defaultValue: t("errors.generic") })}
        </div>
      )}
      {state?.success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          {t("changesSaved")}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-slate-700">{t("editSectionTitle")}</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("nameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={p.name}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("descriptionLabel")}</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={p.description ?? ""}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t("linkedServiceLabel")}
          </label>
          <p className="text-xs text-slate-400 mb-2">Usluge koje klijent kupuje ili na koje se promocija odnosi.</p>
          <ServiceMultiSelect
            name="linked_service_ids"
            services={services}
            selectedIds={linkedIds}
            onChange={setLinkedIds}
            placeholder="Odaberi povezane usluge..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Promotivna usluga
          </label>
          <p className="text-xs text-slate-400 mb-2">Usluge koje klijent dobija kroz promociju.</p>
          <ServiceMultiSelect
            name="bonus_service_ids"
            services={services}
            selectedIds={bonusIds}
            onChange={setBonusIds}
            placeholder="Odaberi bonus usluge..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("promotionTypeLabel")}</label>
          <select
            name="promotion_type"
            defaultValue={p.promotion_type}
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
            <DateTimePicker
              name="starts_at"
              defaultValue={p.starts_at}
              placeholder="Odaberi početak..."
              onChange={setStartsAtIso}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("endsAtLabel")} <span className="text-red-500">*</span>
            </label>
            <DateTimePicker
              name="ends_at"
              required
              defaultValue={p.ends_at}
              placeholder="Odaberi završetak..."
              minIso={startsAtIso || null}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("termsLabel")}</label>
          <textarea
            name="terms"
            rows={3}
            defaultValue={p.terms ?? ""}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {isExpired ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            <p className="font-medium">Promocija je istekla</p>
            <p className="text-xs mt-0.5 text-amber-600">
              Promijenite datum završetka na budući datum — promocija će automatski postati aktivna.
            </p>
          </div>
        ) : (
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" name="is_active" defaultChecked={p.is_active} className="rounded border-slate-300 text-indigo-600" />
            {t("isActiveLabel")}
          </label>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-700">{t("colorLabel")}</h2>
        <ColorPicker selectedColor={color} onChange={setColor} />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {pending ? t("savingPromotion") : t("savePromotion")}
        </button>
      </div>
    </form>
  );
}
