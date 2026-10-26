import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";

import { createInitialManager } from "@/features/auth/bootstrap";
import type { PrismaClient, User } from "@/generated/prisma/client";

export async function createAuthFixtures(database: PrismaClient) {
  const suffix = randomUUID();
  const password = randomUUID() + "-aB1!";
  const manager = await createInitialManager(database, {
    name: "Gestor de teste",
    email: `gestor-${suffix}@example.invalid`,
    password,
  });
  const region = await database.region.create({
    data: { name: `Região auth ${suffix}` },
  });
  const slaughterhouses = await Promise.all(
    ["A", "B"].map((letter) =>
      database.slaughterhouse.create({
        data: {
          name: `Frigorífico de teste ${letter} ${suffix}`,
          regionId: region.id,
        },
      }),
    ),
  );
  const hash = await hashPassword(password);
  const users: User[] = [];
  for (const slaughterhouse of slaughterhouses) {
    const id = randomUUID();
    users.push(
      await database.user.create({
        data: {
          id,
          name: `Usuário ${slaughterhouse.name}`,
          email: `${id}@example.invalid`,
          role: "SLAUGHTERHOUSE",
          slaughterhouseId: slaughterhouse.id,
          accounts: {
            create: { accountId: id, providerId: "credential", password: hash },
          },
        },
      }),
    );
  }
  return {
    manager,
    users,
    slaughterhouses,
    password,
    async cleanup() {
      await database.user.deleteMany({
        where: { id: { in: [manager.id, ...users.map((u) => u.id)] } },
      });
      await database.slaughterhouse.deleteMany({
        where: { id: { in: slaughterhouses.map((s) => s.id) } },
      });
      await database.region.delete({ where: { id: region.id } });
    },
  };
}
