export type NavItem = {
  title: string;
  href: string;
  icon: string;
};

export const navItems: NavItem[] = [
  { title: "Kalendar", href: "/dashboard/kalendar", icon: "calendar" },
  { title: "Klijenti", href: "/dashboard/klijenti", icon: "users" },
  { title: "Poruke", href: "/dashboard/poruke", icon: "mail" },
  { title: "Cjenovnik", href: "/dashboard/cjenovnik", icon: "tag" },
  { title: "Promocije", href: "/dashboard/promocije", icon: "gift" },
  { title: "Uposlenici", href: "/dashboard/uposlenici", icon: "briefcase" },
  { title: "Stanje robe", href: "/dashboard/roba", icon: "box" },
  { title: "Narudžbenice", href: "/dashboard/narudzbenice", icon: "clipboard" },
  { title: "Izvještaji", href: "/dashboard/izvjestaji", icon: "chart" },
  { title: "Profil", href: "/dashboard/profil", icon: "settings" },
];
