import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";

export default async function AccessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "MANAGER" ? "/gestor" : "/frigorifico");
}
