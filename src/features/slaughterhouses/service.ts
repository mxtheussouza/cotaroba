import "server-only";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";

import { AccessDeniedError } from "@/features/auth/authorization";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { categorySchema } from "@/features/quotes/schema";

import {
  accessPasswordSchema,
  accessSchema,
  idSchema,
  regionSchema,
  slaughterhouseSchema,
  updateAccessSchema,
  updateSlaughterhouseSchema,
} from "./schema";

type Transaction = Prisma.TransactionClient;

export class ManagementError extends Error {
  constructor(
    public readonly code:
      | "nao-encontrado"
      | "regiao"
      | "regiao-duplicada"
      | "categoria-duplicada"
      | "email"
      | "inativo"
      | "limite",
  ) {
    super(code);
  }
}

async function assertManager(database: Transaction, actorId: string | null) {
  if (!actorId) throw new AccessDeniedError(401);
  const actor = await database.user.findUnique({
    where: { id: actorId },
    select: { role: true, isActive: true },
  });
  if (!actor?.isActive) throw new AccessDeniedError(401);
  if (actor.role !== "MANAGER") throw new AccessDeniedError(403);
}

function asManager<T>(
  database: PrismaClient,
  actorId: string | null,
  operation: (transaction: Transaction) => Promise<T>,
) {
  return database.$transaction(async (transaction) => {
    await assertManager(transaction, actorId);
    return operation(transaction);
  });
}

async function lockSlaughterhouse(transaction: Transaction, id: string) {
  // Serialize administrative access changes with company deactivation.
  const rows = await transaction.$queryRaw<
    Array<{ id: string; name: string; regionId: string; isActive: boolean }>
  >`SELECT "id", "name", "regionId", "isActive" FROM "Slaughterhouse" WHERE "id" = ${id}::uuid FOR UPDATE`;
  if (!rows[0]) throw new ManagementError("nao-encontrado");
  return rows[0];
}

async function requireRegion(transaction: Transaction, id: string) {
  if (
    !(await transaction.region.findUnique({
      where: { id },
      select: { id: true },
    }))
  )
    throw new ManagementError("regiao");
}

const accessSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
} satisfies Prisma.UserSelect;

async function findAccess(
  transaction: Transaction,
  slaughterhouseId: string,
  userId: string,
) {
  const user = await transaction.user.findFirst({
    where: { id: userId, slaughterhouseId, role: "SLAUGHTERHOUSE" },
    select: accessSelect,
  });
  if (!user) throw new ManagementError("nao-encontrado");
  return user;
}

async function handleEmailConflict<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new ManagementError("email");
    throw error;
  }
}

export const PAGE_SIZE = 20;

export function listSlaughterhouses(
  database: PrismaClient,
  actorId: string | null,
  page = 1,
) {
  return asManager(database, actorId, async (transaction) => {
    const currentPage =
      Number.isSafeInteger(page) && page > 0 && page <= 100_000 ? page : 1;
    const [items, total] = await Promise.all([
      transaction.slaughterhouse.findMany({
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          isActive: true,
          region: { select: { id: true, name: true } },
          _count: { select: { users: true } },
        },
      }),
      transaction.slaughterhouse.count(),
    ]);
    return { items, total, page: currentPage };
  });
}

export function listRegions(database: PrismaClient, actorId: string | null) {
  return asManager(database, actorId, (transaction) =>
    transaction.region.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  );
}

export function listCategoriesForManager(
  database: PrismaClient,
  actorId: string | null,
) {
  return asManager(database, actorId, (transaction) =>
    transaction.cattleCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  );
}

export async function createCategory(
  database: PrismaClient,
  actorId: string,
  input: unknown,
) {
  try {
    return await asManager(database, actorId, async (transaction) => {
      const data = categorySchema.parse(input);
      const category = await transaction.cattleCategory.create({
        data,
        select: { id: true, name: true },
      });
      await transaction.managementEvent.create({
        data: {
          actorId,
          action: "CATEGORY_CREATED",
          changes: { after: category },
        },
      });
      return { id: category.id };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new ManagementError("categoria-duplicada");
    throw error;
  }
}

export async function createRegion(
  database: PrismaClient,
  actorId: string,
  input: unknown,
) {
  try {
    return await asManager(database, actorId, async (transaction) => {
      const data = regionSchema.parse(input);
      const region = await transaction.region.create({
        data,
        select: { id: true, name: true },
      });
      await transaction.managementEvent.create({
        data: {
          actorId,
          action: "REGION_CREATED",
          changes: { after: region },
        },
      });
      return { id: region.id };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new ManagementError("regiao-duplicada");
    throw error;
  }
}

export function getSlaughterhouse(
  database: PrismaClient,
  actorId: string | null,
  id: string,
) {
  return asManager(database, actorId, async (transaction) => {
    const record = await transaction.slaughterhouse.findUnique({
      where: { id: idSchema.parse(id) },
      select: {
        id: true,
        name: true,
        regionId: true,
        isActive: true,
        region: { select: { name: true } },
        users: {
          where: { role: "SLAUGHTERHOUSE" },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          select: accessSelect,
        },
      },
    });
    if (!record) throw new ManagementError("nao-encontrado");
    return record;
  });
}

export function createSlaughterhouse(
  database: PrismaClient,
  actorId: string,
  input: unknown,
) {
  return asManager(database, actorId, async (transaction) => {
    const data = slaughterhouseSchema.parse(input);
    await requireRegion(transaction, data.regionId);
    const record = await transaction.slaughterhouse.create({
      data,
      select: { id: true, name: true, regionId: true, isActive: true },
    });
    await transaction.managementEvent.create({
      data: {
        actorId,
        slaughterhouseId: record.id,
        action: "SLAUGHTERHOUSE_CREATED",
        changes: { after: record },
      },
    });
    return { id: record.id };
  });
}

export function updateSlaughterhouse(
  database: PrismaClient,
  actorId: string,
  id: string,
  input: unknown,
) {
  return asManager(database, actorId, async (transaction) => {
    const data = updateSlaughterhouseSchema.parse(input);
    const previous = await lockSlaughterhouse(transaction, idSchema.parse(id));
    await requireRegion(transaction, data.regionId);
    await transaction.slaughterhouse.update({ where: { id }, data });
    await transaction.session.deleteMany({
      where: { user: { slaughterhouseId: id } },
    });
    await transaction.managementEvent.create({
      data: {
        actorId,
        slaughterhouseId: id,
        action: "SLAUGHTERHOUSE_UPDATED",
        changes: { before: previous, after: data },
      },
    });
    return { id };
  });
}

export function createAccess(
  database: PrismaClient,
  actorId: string,
  slaughterhouseId: string,
  input: unknown,
) {
  return handleEmailConflict(() =>
    asManager(database, actorId, async (transaction) => {
      const data = accessSchema.parse(input);
      const company = await lockSlaughterhouse(
        transaction,
        idSchema.parse(slaughterhouseId),
      );
      if (!company.isActive) throw new ManagementError("inativo");
      const password = await hashPassword(data.password);
      const id = randomUUID();
      const user = await transaction.user.create({
        data: {
          id,
          name: data.name,
          email: data.email,
          role: "SLAUGHTERHOUSE",
          slaughterhouseId,
          accounts: {
            create: { accountId: id, providerId: "credential", password },
          },
        },
        select: accessSelect,
      });
      await transaction.managementEvent.create({
        data: {
          actorId,
          slaughterhouseId,
          targetUserId: id,
          action: "ACCESS_CREATED",
          changes: { after: user },
        },
      });
      return { id };
    }),
  );
}

export function updateAccess(
  database: PrismaClient,
  actorId: string,
  slaughterhouseId: string,
  userId: string,
  input: unknown,
) {
  return handleEmailConflict(() =>
    asManager(database, actorId, async (transaction) => {
      const data = updateAccessSchema.parse(input);
      await lockSlaughterhouse(transaction, idSchema.parse(slaughterhouseId));
      const previous = await findAccess(
        transaction,
        slaughterhouseId,
        idSchema.parse(userId),
      );
      await transaction.user.update({
        where: { id: userId },
        data: {
          ...data,
          ...(data.email !== previous.email ? { emailVerified: false } : {}),
        },
      });
      // Profile/email changes also revoke sessions so the previous identity cannot stay signed in.
      await transaction.session.deleteMany({ where: { userId } });
      await transaction.managementEvent.create({
        data: {
          actorId,
          slaughterhouseId,
          targetUserId: userId,
          action: "ACCESS_UPDATED",
          changes: { before: previous, after: data },
        },
      });
    }),
  );
}

export function resetAccessPassword(
  database: PrismaClient,
  actorId: string,
  slaughterhouseId: string,
  userId: string,
  input: unknown,
) {
  return asManager(database, actorId, async (transaction) => {
    const data = accessPasswordSchema.parse(input);
    await lockSlaughterhouse(transaction, idSchema.parse(slaughterhouseId));
    await findAccess(transaction, slaughterhouseId, idSchema.parse(userId));
    const account = await transaction.account.findUnique({
      where: {
        providerId_accountId: { providerId: "credential", accountId: userId },
      },
      select: { id: true },
    });
    if (!account) throw new ManagementError("nao-encontrado");
    const password = await hashPassword(data.password);
    await transaction.account.update({
      where: { id: account.id },
      data: { password },
    });
    await transaction.session.deleteMany({ where: { userId } });
    await transaction.managementEvent.create({
      data: {
        actorId,
        slaughterhouseId,
        targetUserId: userId,
        action: "ACCESS_PASSWORD_RESET",
        changes: { sessionsRevoked: true },
      },
    });
  });
}
