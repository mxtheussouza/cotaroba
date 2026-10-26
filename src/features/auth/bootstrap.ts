import "server-only";

import { hashPassword } from "better-auth/crypto";

import type { PrismaClient } from "@/generated/prisma/client";

import { initialManagerSchema } from "./schema";

export class InitialManagerExistsError extends Error {
  constructor() {
    super("Já existe um gestor. Este comando cria somente o primeiro acesso.");
  }
}

// Local operator command only: this module is not a Server Action or an HTTP route.
export async function createInitialManager(
  database: PrismaClient,
  input: unknown,
) {
  const data = initialManagerSchema.parse(input);
  const password = await hashPassword(data.password);

  return database.$transaction(async (transaction) => {
    // Serialize first-access creation so two operator commands cannot both bootstrap.
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(8241052)`;
    if (await transaction.user.count({ where: { role: "MANAGER" } })) {
      throw new InitialManagerExistsError();
    }

    const user = await transaction.user.create({
      data: { name: data.name, email: data.email, role: "MANAGER" },
    });
    await transaction.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password,
      },
    });
    return { id: user.id, name: user.name, email: user.email };
  });
}
