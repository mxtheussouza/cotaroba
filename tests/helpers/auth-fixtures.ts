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
      const events = await database.managementEvent.findMany({
        where: { actorId: manager.id },
      });
      const createdUsers = events
        .filter((event) => event.action === "ACCESS_CREATED")
        .map((event) => event.targetUserId!)
        .filter(Boolean);
      const createdCompanies = events
        .filter((event) => event.action === "SLAUGHTERHOUSE_CREATED")
        .map((event) => event.slaughterhouseId!)
        .filter(Boolean);
      const createdRegions = events
        .filter((event) => event.action === "REGION_CREATED")
        .map((event) => (event.changes as { after: { id: string } }).after.id);
      const createdCategories = events
        .filter((event) => event.action === "CATEGORY_CREATED")
        .map((event) => (event.changes as { after: { id: string } }).after.id);
      const companyIds = [
        ...slaughterhouses.map((company) => company.id),
        ...createdCompanies,
      ];
      await database.quote.deleteMany({
        where: { slaughterhouseId: { in: companyIds } },
      });
      await database.rateLimit.deleteMany({
        where: { key: { in: companyIds.map((id) => `quotes:${id}`) } },
      });
      await database.rateLimit.deleteMany({
        where: { key: `management:${manager.id}` },
      });
      await database.managementEvent.deleteMany({
        where: { actorId: manager.id },
      });
      // External observations keep their author for audit; remove only fixture-owned data.
      const externalSeries = await database.externalSeries.findMany({
        where: { observations: { some: { createdById: manager.id } } },
        select: { id: true },
      });
      await database.externalObservation.deleteMany({
        where: { createdById: manager.id },
      });
      await database.externalSeries.deleteMany({
        where: {
          id: { in: externalSeries.map((series) => series.id) },
          connector: null,
          observations: { none: {} },
        },
      });
      await database.user.deleteMany({
        where: {
          id: { in: [manager.id, ...users.map((u) => u.id), ...createdUsers] },
        },
      });
      await database.slaughterhouse.deleteMany({
        where: {
          id: {
            in: [...slaughterhouses.map((s) => s.id), ...createdCompanies],
          },
        },
      });
      await database.region.delete({ where: { id: region.id } });
      await database.region.deleteMany({
        where: { id: { in: createdRegions } },
      });
      await database.cattleCategory.deleteMany({
        where: { id: { in: createdCategories } },
      });
    },
  };
}
