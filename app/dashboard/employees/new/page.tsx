import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewEmployeeForm from "../new-employee-form";
import { getDevices } from "@/app/actions/devices";

export default async function NoviUposlenik() {
  const session = await getSession();
  const t = await getTranslations("uposlenici");
  const tDetail = await getTranslations("employeeDetail");

  const canManage = session.role === "owner" || session.role === "manager";
  if (!canManage) redirect("/dashboard/employees");

  const devices = await getDevices();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t("title")}
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">{tDetail("newEmployee")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{tDetail("newEmployeeSubtitle")}</p>
      </div>

      <NewEmployeeForm devices={devices} />
    </div>
  );
}
