import { getTranslations } from "next-intl/server";
import type { Role } from "@/lib/roles";

type Invite = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700",
  accepted: "bg-green-50 text-green-700",
  expired:  "bg-slate-100 text-slate-500",
};

export default async function InviteList({ invitations }: { invitations: Invite[] }) {
  const t = await getTranslations("uposlenici");
  const tStatus = await getTranslations("inviteStatus");
  const tRoles = await getTranslations("roles");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">{t("sentInvitations")}</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {invitations.map((inv) => (
          <li key={inv.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{inv.full_name}</p>
              <p className="text-xs text-slate-500">{inv.email}</p>
            </div>
            <span className="text-xs text-slate-500 hidden sm:block">
              {tRoles(inv.role as Role) ?? inv.role}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[inv.status] ?? "bg-slate-100 text-slate-500"}`}>
              {["pending", "accepted", "expired"].includes(inv.status)
                ? tStatus(inv.status as "pending" | "accepted" | "expired")
                : inv.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
