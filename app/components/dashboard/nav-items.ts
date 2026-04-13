import { NAV_ACCESS, type Role } from "@/lib/roles";

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  key: string;
};

export const ALL_NAV_ITEMS: NavItem[] = [
  { key: "kalendar",     title: "Kalendar",      href: "/dashboard/kalendar",     icon: "calendar"   },
  { key: "klijenti",     title: "Klijenti",       href: "/dashboard/klijenti",     icon: "users"      },
  { key: "poruke",       title: "Poruke",          href: "/dashboard/poruke",       icon: "mail"       },
  { key: "cjenovnik",    title: "Cjenovnik",       href: "/dashboard/cjenovnik",    icon: "tag"        },
  { key: "promocije",    title: "Promocije",       href: "/dashboard/promocije",    icon: "gift"       },
  { key: "uposlenici",   title: "Uposlenici",      href: "/dashboard/uposlenici",   icon: "briefcase"  },
  { key: "roba",         title: "Stanje robe",     href: "/dashboard/roba",         icon: "box"        },
  { key: "narudzbenice", title: "Narudžbenice",    href: "/dashboard/narudzbenice", icon: "clipboard"  },
  { key: "izvjestaji",   title: "Izvještaji",      href: "/dashboard/izvjestaji",   icon: "chart"      },
  { key: "profil",       title: "Profil",          href: "/dashboard/profil",       icon: "settings"   },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  const allowed = NAV_ACCESS[role];
  return ALL_NAV_ITEMS.filter((item) => allowed.includes(item.key));
}
