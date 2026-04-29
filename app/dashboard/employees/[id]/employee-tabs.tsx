"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import EmployeeScheduleForm from "./employee-schedule-form";
import EmployeeServicesForm from "./employee-services-form";
import EmployeeDevicesForm from "./employee-devices-form";
import type { WorkingHours } from "@/app/actions/employees";
import type { Device } from "@/app/actions/devices";

type ServiceItem = {
  id: string;
  name: string;
  color: string | null;
  category: string | null;
};

type ActiveTab = "schedule" | "services" | "devices";

type Props = {
  employeeId: string;
  canManage: boolean;
  employeeSchedule: WorkingHours;
  salonSchedule: WorkingHours;
  allServices: ServiceItem[];
  assignedServiceIds: string[];
  allDevices: Device[];
  assignedDeviceIds: string[];
};

export default function EmployeeTabs({
  employeeId,
  canManage,
  employeeSchedule,
  salonSchedule,
  allServices,
  assignedServiceIds,
  allDevices,
  assignedDeviceIds,
}: Props) {
  const t = useTranslations("employeeDetail");
  const [activeTab, setActiveTab] = useState<ActiveTab>("schedule");

  const tabStyle = (isActive: boolean) =>
    `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
      isActive
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
    }`;

  const tabs: { key: ActiveTab; label: string; show: boolean }[] = [
    { key: "schedule", label: t("workSchedule"), show: true },
    { key: "services", label: t("services"), show: canManage },
    { key: "devices", label: t("devices"), show: canManage },
  ];

  const visibleTabs = tabs.filter((tab) => tab.show);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-end border-b border-slate-200 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={tabStyle(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "schedule" && (
        <EmployeeScheduleForm
          employeeId={employeeId}
          canManage={canManage}
          employeeSchedule={employeeSchedule}
          salonSchedule={salonSchedule}
        />
      )}

      {activeTab === "services" && canManage && (
        <EmployeeServicesForm
          employeeId={employeeId}
          allServices={allServices}
          assignedIds={assignedServiceIds}
        />
      )}

      {activeTab === "devices" && canManage && (
        <EmployeeDevicesForm
          employeeId={employeeId}
          allDevices={allDevices}
          assignedDeviceIds={assignedDeviceIds}
        />
      )}
    </div>
  );
}
