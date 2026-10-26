import { PrivateArea } from "@/features/auth/private-area";
import { requireRole } from "@/features/auth/session";

export default async function SlaughterhousePage() {
  const user = await requireRole("SLAUGHTERHOUSE");
  return <PrivateArea user={user} title="Área do frigorífico" />;
}
