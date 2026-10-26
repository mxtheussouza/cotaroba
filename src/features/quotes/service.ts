import "server-only";

import { AccessDeniedError } from "@/features/auth/authorization";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";

import { quoteIdSchema, quoteSchema } from "./schema";

export class QuoteError extends Error {
  constructor(
    public readonly code:
      "nao-encontrada" | "categoria" | "atualizada" | "limite",
  ) {
    super(code);
  }
}

type Transaction = Prisma.TransactionClient;

async function memberIdentity(database: Transaction, actorId: string | null) {
  if (!actorId) throw new AccessDeniedError(401);
  const user = await database.user.findUnique({
    where: { id: actorId },
    select: {
      id: true,
      role: true,
      isActive: true,
      slaughterhouseId: true,
      slaughterhouse: {
        select: {
          id: true,
          name: true,
          regionId: true,
          isActive: true,
          region: { select: { name: true } },
        },
      },
    },
  });
  if (!user?.isActive) throw new AccessDeniedError(401);
  if (user.role !== "SLAUGHTERHOUSE") throw new AccessDeniedError(403);
  if (!user.slaughterhouse?.isActive || !user.slaughterhouseId)
    throw new AccessDeniedError(401);
  return { id: user.id, slaughterhouse: user.slaughterhouse };
}

function asMember<T>(
  database: PrismaClient,
  actorId: string | null,
  operation: (
    transaction: Transaction,
    member: Awaited<ReturnType<typeof memberIdentity>>,
  ) => Promise<T>,
  write = false,
) {
  return database.$transaction(
    async (transaction) => {
      let member = await memberIdentity(transaction, actorId);
      if (write) {
        // Use the same company lock as manager changes. Recheck privileges after waiting.
        await transaction.$queryRaw`SELECT "id" FROM "Slaughterhouse" WHERE "id" = ${member.slaughterhouse.id}::uuid FOR UPDATE`;
        member = await memberIdentity(transaction, actorId);
      }
      return operation(transaction, member);
    },
    {
      isolationLevel: write
        ? Prisma.TransactionIsolationLevel.ReadCommitted
        : Prisma.TransactionIsolationLevel.RepeatableRead,
    },
  );
}

const quoteSelect = {
  id: true,
  seriesId: true,
  version: true,
  categoryId: true,
  pricePerArroba: true,
  referenceDate: true,
  createdAt: true,
  category: { select: { name: true } },
  region: { select: { name: true } },
  createdBy: { select: { name: true } },
} satisfies Prisma.QuoteSelect;

type SelectedQuote = Prisma.QuoteGetPayload<{ select: typeof quoteSelect }>;

function toQuoteDto(quote: SelectedQuote) {
  return {
    id: quote.id,
    seriesId: quote.seriesId,
    version: quote.version,
    categoryId: quote.categoryId,
    category: quote.category.name,
    region: quote.region.name,
    pricePerArroba: quote.pricePerArroba.toFixed(2),
    referenceDate: quote.referenceDate.toISOString().slice(0, 10),
    createdAt: quote.createdAt.toISOString(),
    createdBy: quote.createdBy?.name ?? "Autoria não registrada",
  };
}

export const QUOTES_PAGE_SIZE = 20;
function validPage(page: number) {
  return Number.isSafeInteger(page) && page > 0 && page <= 100_000 ? page : 1;
}

export function getQuoteWorkspace(
  database: PrismaClient,
  actorId: string | null,
  page = 1,
) {
  return asMember(database, actorId, async (transaction, member) => {
    const currentPage = validPage(page);
    const where = {
      slaughterhouseId: member.slaughterhouse.id,
      nextQuote: null,
    };
    const [records, total, categories] = await Promise.all([
      transaction.quote.findMany({
        where,
        select: quoteSelect,
        orderBy: [
          { referenceDate: "desc" },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip: (currentPage - 1) * QUOTES_PAGE_SIZE,
        take: QUOTES_PAGE_SIZE,
      }),
      transaction.quote.count({ where }),
      transaction.cattleCategory.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    return {
      slaughterhouse: {
        name: member.slaughterhouse.name,
        region: member.slaughterhouse.region.name,
      },
      items: records.map(toQuoteDto),
      total,
      categories,
      page: currentPage,
    };
  });
}

export function getQuoteHistory(
  database: PrismaClient,
  actorId: string | null,
  seriesId: string,
  page = 1,
) {
  return asMember(database, actorId, async (transaction, member) => {
    const where = {
      slaughterhouseId: member.slaughterhouse.id,
      seriesId: quoteIdSchema.parse(seriesId),
    };
    const current = await transaction.quote.findFirst({
      where: { ...where, nextQuote: null },
      select: quoteSelect,
    });
    if (!current) throw new QuoteError("nao-encontrada");
    const currentPage = validPage(page);
    const [versions, total, categories] = await Promise.all([
      transaction.quote.findMany({
        where,
        select: quoteSelect,
        orderBy: { version: "desc" },
        take: QUOTES_PAGE_SIZE,
        skip: (currentPage - 1) * QUOTES_PAGE_SIZE,
      }),
      transaction.quote.count({ where }),
      transaction.cattleCategory.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    return {
      current: toQuoteDto(current),
      versions: versions.map(toQuoteDto),
      total,
      page: currentPage,
      categories,
    };
  });
}

async function requireCategory(database: Transaction, id: string) {
  if (
    !(await database.cattleCategory.findUnique({
      where: { id },
      select: { id: true },
    }))
  )
    throw new QuoteError("categoria");
}

export function createQuote(
  database: PrismaClient,
  actorId: string,
  input: unknown,
) {
  return asMember(
    database,
    actorId,
    async (transaction, member) => {
      const data = quoteSchema.parse(input);
      await requireCategory(transaction, data.categoryId);
      const quote = await transaction.quote.create({
        data: {
          categoryId: data.categoryId,
          pricePerArroba: new Prisma.Decimal(data.pricePerArroba),
          referenceDate: new Date(`${data.referenceDate}T00:00:00.000Z`),
          slaughterhouseId: member.slaughterhouse.id,
          regionId: member.slaughterhouse.regionId,
          createdById: member.id,
        },
        select: { id: true, seriesId: true },
      });
      return quote;
    },
    true,
  );
}

export function reviseQuote(
  database: PrismaClient,
  actorId: string,
  previousQuoteId: string,
  input: unknown,
) {
  return asMember(
    database,
    actorId,
    async (transaction, member) => {
      const data = quoteSchema.parse(input);
      const previous = await transaction.quote.findFirst({
        where: {
          id: quoteIdSchema.parse(previousQuoteId),
          slaughterhouseId: member.slaughterhouse.id,
        },
        select: {
          id: true,
          seriesId: true,
          version: true,
          regionId: true,
          nextQuote: { select: { id: true } },
        },
      });
      if (!previous) throw new QuoteError("nao-encontrada");
      if (previous.nextQuote) throw new QuoteError("atualizada");
      await requireCategory(transaction, data.categoryId);
      return transaction.quote.create({
        data: {
          seriesId: previous.seriesId,
          version: previous.version + 1,
          previousQuoteId: previous.id,
          slaughterhouseId: member.slaughterhouse.id,
          regionId: previous.regionId,
          createdById: member.id,
          categoryId: data.categoryId,
          pricePerArroba: new Prisma.Decimal(data.pricePerArroba),
          referenceDate: new Date(`${data.referenceDate}T00:00:00.000Z`),
        },
        select: { id: true, seriesId: true },
      });
    },
    true,
  );
}
