export type Role = "owner" | "manager" | "employee" | "receptionist";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Vlasnik",
  manager: "Menadžer",
  employee: "Radnik",
  receptionist: "Recepcija",
};

// Koje nav stavke smije vidjeti svaka rola
export const NAV_ACCESS: Record<Role, string[]> = {
  owner: [
    "calendar",
    "clients",
    "messages",
    "price-list",
    "promotions",
    "employees",
    "inventory",
    "orders",
    "reports",
    "profile",
  ],
  manager: [
    "calendar",
    "clients",
    "messages",
    "price-list",
    "promotions",
    "employees",
    "inventory",
    "orders",
    "reports",
  ],
  receptionist: [
    "calendar",
    "clients",
    "price-list",
    "promotions",
  ],
  employee: [
    "calendar",
    "clients",
  ],
};

// Granularne dozvole po roli (default vrijednosti)
export const ROLE_PERMISSIONS: Record<
  Role,
  {
    canViewRevenue: boolean;
    canViewReports: boolean;
    canViewPaymentStatus: boolean;
    canViewOtherEmployees: boolean;
    canManageEmployees: boolean;
    canManageServices: boolean;
    canManageClients: boolean;
  }
> = {
  owner: {
    canViewRevenue: true,
    canViewReports: true,
    canViewPaymentStatus: true,
    canViewOtherEmployees: true,
    canManageEmployees: true,
    canManageServices: true,
    canManageClients: true,
  },
  manager: {
    canViewRevenue: true,
    canViewReports: true,
    canViewPaymentStatus: true,
    canViewOtherEmployees: true,
    canManageEmployees: false,
    canManageServices: true,
    canManageClients: true,
  },
  receptionist: {
    canViewRevenue: false,
    canViewReports: false,
    canViewPaymentStatus: false,
    canViewOtherEmployees: true,
    canManageEmployees: false,
    canManageServices: false,
    canManageClients: true,
  },
  employee: {
    canViewRevenue: false,
    canViewReports: false,
    canViewPaymentStatus: false,
    canViewOtherEmployees: false,
    canManageEmployees: false,
    canManageServices: false,
    canManageClients: false,
  },
};

export function isValidRole(role: string): role is Role {
  return ["owner", "manager", "employee", "receptionist"].includes(role);
}
