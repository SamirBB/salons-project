import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function RootPage() {
  const session = await getSession().catch(() => null);
  if (session?.userId) {
    redirect("/dashboard");
  }
  redirect("/login");
}
