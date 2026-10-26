import "server-only";

import type { PrismaClient, UserRole } from "@/generated/prisma/client";

import type { createAuth } from "./auth";

export async function resolveSessionUser(
  database: PrismaClient,
  auth: ReturnType<typeof createAuth>,
  headers: Headers,
) {
  const session = await auth.api.getSession({
    headers,
    query: { disableRefresh: true },
  });
  if (!session) return null;

  // Read current privileges on every request, never from client fields or cached cookies.
  const user = await database.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      slaughterhouseId: true,
      slaughterhouse: { select: { id: true, name: true, isActive: true } },
    },
  });

  if (
    !user?.isActive ||
    (user.role === "SLAUGHTERHOUSE" && !user.slaughterhouse?.isActive)
  )
    return null;
  return user;
}

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof resolveSessionUser>>
>;

export class AccessDeniedError extends Error {
  constructor(public readonly status: 401 | 403) {
    super("Acesso não permitido.");
  }
}

export function assertRole(
  user: SessionUser | null,
  role: UserRole,
): asserts user is SessionUser {
  if (!user) throw new AccessDeniedError(401);
  if (user.role !== role) throw new AccessDeniedError(403);
}
