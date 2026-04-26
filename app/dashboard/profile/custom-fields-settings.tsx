"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FieldManager from "@/app/dashboard/clients/custom-fields/field-manager";
import type { CustomField, EntityType } from "@/app/actions/custom-fields";

type Props = {
  fields: Record<EntityType, CustomField[]>;
};

const ENTITY_TABS: { key: EntityType; label: string }[] = [
  { key: "treatment", label: "Tretmani" },
  { key: "client", label: "Klijenti" },
  { key: "employee", label: "Uposlenici" },
  { key: "pricelist", label: "Cjenovnik" },
];

const VALID_ENTITIES = new Set<string>(ENTITY_TABS.map((t) => t.key));

export default function CustomFieldsSettings({ fields }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const entityParam = searchParams.get("entity") ?? "";
  const activeEntity: EntityType = VALID_ENTITIES.has(entityParam)
    ? (entityParam as EntityType)
    : "treatment";

  function setActiveEntity(key: EntityType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("entity", key);
    router.replace(`/dashboard/profile?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-5">
      {/* Inner entity-type tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveEntity(tab.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeEntity === tab.key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            {fields[tab.key].length > 0 && (
              <span
                className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                  activeEntity === tab.key
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {fields[tab.key].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Field manager for the selected entity */}
      <FieldManager
        key={activeEntity}
        initialFields={fields[activeEntity]}
        entityType={activeEntity}
      />
    </div>
  );
}
