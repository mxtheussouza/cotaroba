import { PrivateArea } from "@/features/auth/private-area";
import { requireRole } from "@/features/auth/session";

export default async function ManagerPage() {
  const user = await requireRole("MANAGER");
  return <PrivateArea user={user} title="Área do gestor" />;
}
