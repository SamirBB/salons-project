"use client";

import { useTranslations } from "next-intl";
import ServiceEmployees from "./service-employees";

type Props = {
  serviceId: string;
  employees: {
    id: string;
    full_name: string;
    color: string | null;
    is_active: boolean;
  }[];
  assignedIds: string[];
};

const tabActiveClasses =
  "inline-flex px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap border-indigo-600 text-indigo-600";

export default function ServiceDetailTabs({ serviceId, employees, assignedIds }: Props) {
  const t = useTranslations("cjenovnik");

  return (
    <div className="space-y-4">
      <div className="flex items-end border-b border-slate-200 overflow-x-auto">
        <span className={tabActiveClasses} role="tab" aria-selected="true" aria-current="page">
          {t("assignedEmployees")}
        </span>
      </div>

      <ServiceEmployees
        serviceId={serviceId}
        employees={employees}
        assignedIds={assignedIds}
        hideHeading
      />
    </div>
  );
}
