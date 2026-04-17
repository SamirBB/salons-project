import { NAV_ACCESS, type Role } from "@/lib/roles";

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  key: string;
};

export const ALL_NAV_ITEMS: NavItem[] = [
  { key: "calendar",   title: "Calendar",    href: "/dashboard/calendar",    icon: "calendar"  },
  { key: "clients",    title: "Clients",     href: "/dashboard/clients",     icon: "users"     },
  { key: "messages",   title: "Messages",    href: "/dashboard/messages",    icon: "mail"      },
  { key: "price-list", title: "Price list",  href: "/dashboard/price-list",  icon: "tag"       },
  { key: "promotions", title: "Promotions",  href: "/dashboard/promotions",  icon: "gift"      },
  { key: "employees",  title: "Employees",   href: "/dashboard/employees",   icon: "briefcase" },
  { key: "inventory",  title: "Inventory",   href: "/dashboard/inventory",   icon: "box"       },
  { key: "orders",     title: "Orders",      href: "/dashboard/orders",      icon: "clipboard" },
  { key: "reports",    title: "Reports",     href: "/dashboard/reports",     icon: "chart"     },
  { key: "profile",    title: "Profile",     href: "/dashboard/profile",     icon: "settings"  },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  const allowed = NAV_ACCESS[role];
  return ALL_NAV_ITEMS.filter((item) => allowed.includes(item.key));
}
