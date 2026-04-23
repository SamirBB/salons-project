import { redirect } from "next/navigation";

// Middleware handles the redirect — this is a fallback only.
export default function RootPage() {
  redirect("/login");
}
