import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { NAV_ACCESS, isValidRole, type Role } from "@/lib/roles";

const PUBLIC_PATHS = ["/login", "/register", "/auth", "/invite", "/device-setup"];

// Mapa dashboard ruta → nav ključ
const ROUTE_TO_NAV_KEY: Record<string, string> = {
  "/dashboard/calendar":    "calendar",
  "/dashboard/clients":     "clients",
  "/dashboard/messages":    "messages",
  "/dashboard/price-list":  "price-list",
  "/dashboard/promotions":  "promotions",
  "/dashboard/employees":   "employees",
  "/dashboard/inventory":   "inventory",
  "/dashboard/orders":      "orders",
  "/dashboard/reports":     "reports",
  "/dashboard/profile":     "profile",
};

function getNavKeyForPath(pathname: string): string | null {
  for (const [route, key] of Object.entries(ROUTE_TO_NAV_KEY)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return key;
    }
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Root "/" → dashboard ili login
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // Unauthenticated → login
  if (!user && !isPublic && pathname !== "/setup") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated na public rutama → dashboard
  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && !isPublic && pathname !== "/setup") {
    // Provjeri user_tenants (tenant + rola)
    const { data: userTenant } = await supabase
      .from("user_tenants")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .single();

    if (!userTenant) {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      return NextResponse.redirect(url);
    }

    // Provjeri role-based pristup rutama
    const navKey = getNavKeyForPath(pathname);
    if (navKey) {
      const role: Role = isValidRole(userTenant.role) ? userTenant.role : "employee";
      const allowed = NAV_ACCESS[role];
      if (!allowed.includes(navKey)) {
        // Rola nema pristup — redirect na dashboard
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  // Korisnik s tenantom na /setup → dashboard
  if (user && pathname === "/setup") {
    const { data: userTenant } = await supabase
      .from("user_tenants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (userTenant) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
