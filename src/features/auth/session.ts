import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { UserRole } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";

import { getAuth } from "./auth";
import { assertRole, resolveSessionUser } from "./authorization";

export const getCurrentUser = cache(async () => {
  const requestHeaders = await headers();
  if (!requestHeaders.has("cookie")) return null;
  return resolveSessionUser(getDatabase(), getAuth(), requestHeaders);
});

export async function requireRole(role: UserRole) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect("/acesso-negado");
  assertRole(user, role);
  return user;
}
