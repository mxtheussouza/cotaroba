import "server-only";

import { z } from "zod";

import { AccessDeniedError } from "@/features/auth/authorization";
import { todayInBahia } from "@/features/quotes/format";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";

import {
  collectSource,
  connectorDefinitions,
  SourceError,
  type FetchSource,
} from "./connectors";
import {
  connectorSchema,
  type frequencies,
  metrics,
  observationSchema,
  seriesSchema,
  type ObservationInput,
} from "./schema";

type Transaction = Prisma.TransactionClient;
export class ExternalDataError extends Error {
  constructor(
    public readonly code:
      | "dados"
      | "duplicada"
      | "serie"
      | "limite"
      | "fonte"
      | "formato"
      | "sem-dados",
  ) {
    super(code);
  }
}

async function assertManager(
  database: Transaction | PrismaClient,
  actorId: string | null,
) {
  if (!actorId) throw new AccessDeniedError(401);
  const user = await database.user.findUnique({
    where: { id: actorId },
    select: { role: true, isActive: true },
  });
  if (!user?.isActive) throw new AccessDeniedError(401);
  if (user.role !== "MANAGER") throw new AccessDeniedError(403);
}

export async function createManualSeries(
  database: PrismaClient,
  actorId: string | null,
  input: unknown,
) {
  try {
    return await database.$transaction(async (tx) => {
      await assertManager(tx, actorId);
      const data = seriesSchema.parse(input);
      return tx.externalSeries.create({ data, select: { id: true } });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new ExternalDataError("duplicada");
    throw error;
  }
}

function validateObservation(
  data: ObservationInput,
  series: {
    metric: keyof typeof metrics;
    frequency: keyof typeof frequencies;
  },
  today: string,
) {
  if (data.periodEnd > today) throw new ExternalDataError("dados");
  const value = new Prisma.Decimal(data.value);
  if (
    (metrics[series.metric].positive && value.lte(0)) ||
    (series.metric === "CATTLE_SLAUGHTER" && !value.isInteger())
  )
    throw new ExternalDataError("dados");
  const start = new Date(`${data.periodStart}T00:00:00Z`);
  const end = new Date(`${data.periodEnd}T00:00:00Z`);
  const days = (end.getTime() - start.getTime()) / 86_400_000 + 1;
  const monthEnd = new Date(end);
  monthEnd.setUTCDate(end.getUTCDate() + 1);
  if (
    (series.frequency === "DAILY" && days !== 1) ||
    (series.frequency === "WEEKLY" && days !== 7) ||
    (series.frequency === "MONTHLY" &&
      !(
        start.getUTCDate() === 1 &&
        monthEnd.getUTCDate() === 1 &&
        start.getUTCFullYear() === end.getUTCFullYear() &&
        start.getUTCMonth() === end.getUTCMonth()
      )) ||
    (series.frequency === "QUARTERLY" &&
      !(
        start.getUTCDate() === 1 &&
        start.getUTCMonth() % 3 === 0 &&
        start.getUTCFullYear() === end.getUTCFullYear() &&
        end.getUTCMonth() === start.getUTCMonth() + 2 &&
        monthEnd.getUTCDate() === 1
      ))
  )
    throw new ExternalDataError("dados");
}

async function appendObservation(
  tx: Transaction,
  seriesId: string,
  data: ObservationInput,
  origin: "API" | "MANUAL",
  actorId: string | null,
) {
  const periodStart = new Date(`${data.periodStart}T00:00:00Z`);
  const periodEnd = new Date(`${data.periodEnd}T00:00:00Z`);
  const validUntil = data.validUntil
    ? new Date(`${data.validUntil}T00:00:00Z`)
    : null;
  const previous = await tx.externalObservation.findFirst({
    where: { seriesId, periodStart, periodEnd },
    orderBy: { revision: "desc" },
  });
  if (
    previous &&
    previous.value.eq(data.value) &&
    previous.validUntil?.getTime() === validUntil?.getTime()
  )
    return { inserted: false };
  await tx.externalObservation.create({
    data: {
      seriesId,
      periodStart,
      periodEnd,
      validUntil,
      value: data.value,
      revision: (previous?.revision ?? 0) + 1,
      origin,
      createdById: actorId,
    },
  });
  return { inserted: true };
}

export async function saveManualObservation(
  database: PrismaClient,
  actorId: string | null,
  id: string,
  input: unknown,
  now = new Date(),
) {
  return database.$transaction(async (tx) => {
    await assertManager(tx, actorId);
    const seriesId = z.uuid().parse(id);
    // Serialize corrections and retries for a series, including concurrent requests.
    await tx.$queryRaw`SELECT "id" FROM "ExternalSeries" WHERE "id" = ${seriesId}::uuid FOR UPDATE`;
    const series = await tx.externalSeries.findUnique({
      where: { id: seriesId },
    });
    if (!series || series.connector) throw new ExternalDataError("serie");
    const data = observationSchema.parse(input);
    validateObservation(data, series, todayInBahia(now));
    return appendObservation(tx, seriesId, data, "MANUAL", actorId);
  });
}

export async function synchronizeSource(
  database: PrismaClient,
  actorId: string | null,
  input: unknown,
  options: { now?: Date; fetchSource?: FetchSource } = {},
) {
  await assertManager(database, actorId);
  const connector = connectorSchema.parse(input);
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - 60_000);
  const reservation = await database.$queryRaw<Array<{ connector: string }>>`
    INSERT INTO "ExternalSync" ("connector", "attemptedAt", "status") VALUES (${connector}, ${now}, 'RUNNING')
    ON CONFLICT ("connector") DO UPDATE SET "attemptedAt" = ${now}, "status" = 'RUNNING', "errorCode" = NULL
    WHERE "ExternalSync"."attemptedAt" <= ${cutoff}
    RETURNING "connector"
  `;
  if (!reservation.length) throw new ExternalDataError("limite");
  try {
    const rows = await collectSource(connector, now, options.fetchSource);
    const result = await database.$transaction(async (tx) => {
      await assertManager(tx, actorId);
      const series = await tx.externalSeries.upsert({
        where: { connector },
        create: { connector, ...connectorDefinitions[connector] },
        update: {},
        select: { id: true, metric: true, frequency: true },
      });
      await tx.$queryRaw`SELECT "id" FROM "ExternalSeries" WHERE "id" = ${series.id}::uuid FOR UPDATE`;
      let inserted = 0;
      for (const row of rows) {
        const data = observationSchema.parse(row);
        validateObservation(data, series, todayInBahia(now));
        if (
          (await appendObservation(tx, series.id, data, "API", null)).inserted
        )
          inserted++;
      }
      await tx.externalSync.update({
        where: { connector },
        data: { status: "SUCCESS", succeededAt: now, errorCode: null },
      });
      return { inserted };
    });
    return result;
  } catch (error) {
    const code = error instanceof SourceError ? error.code : "fonte";
    await database.externalSync.update({
      where: { connector },
      data: { status: "FAILED", errorCode: code },
    });
    if (error instanceof AccessDeniedError) throw error;
    throw new ExternalDataError(code);
  }
}

export const EXTERNAL_PAGE_SIZE = 20;
export function safePage(page: number) {
  return Number.isSafeInteger(page) && page > 0 && page <= 100_000 ? page : 1;
}

export function observationFreshness(
  observation: { periodEnd: string; validUntil: string | null },
  staleAfterDays: number,
  now = new Date(),
) {
  const today = todayInBahia(now);
  if (observation.validUntil && observation.validUntil < today)
    return "expired" as const;
  const date = new Date(`${observation.periodEnd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + staleAfterDays);
  return date.toISOString().slice(0, 10) < today
    ? ("stale" as const)
    : ("current" as const);
}

export async function listPublicExternalData(
  database: PrismaClient,
  page = 1,
  now = new Date(),
) {
  page = safePage(page);
  const [series, total] = await Promise.all([
    database.externalSeries.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (page - 1) * EXTERNAL_PAGE_SIZE,
      take: EXTERNAL_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        metric: true,
        frequency: true,
        geography: true,
        sourceName: true,
        sourceUrl: true,
        staleAfterDays: true,
        connector: true,
        observations: {
          orderBy: [
            { periodEnd: "desc" },
            { periodStart: "desc" },
            { revision: "desc" },
          ],
          take: 1,
          select: {
            value: true,
            periodStart: true,
            periodEnd: true,
            validUntil: true,
            collectedAt: true,
            origin: true,
          },
        },
      },
    }),
    database.externalSeries.count(),
  ]);
  const items = series.map(({ observations, ...item }) => {
    const row = observations[0];
    const observation = row
      ? {
          value: row.value.toFixed(4),
          periodStart: row.periodStart.toISOString().slice(0, 10),
          periodEnd: row.periodEnd.toISOString().slice(0, 10),
          validUntil: row.validUntil?.toISOString().slice(0, 10) ?? null,
          collectedAt: row.collectedAt.toISOString(),
          origin: row.origin,
        }
      : null;
    return {
      ...item,
      unit: metrics[item.metric].unit,
      observation,
      freshness: observation
        ? observationFreshness(observation, item.staleAfterDays, now)
        : ("missing" as const),
    };
  });
  return { items, total, page };
}

export async function listManagerExternalData(
  database: PrismaClient,
  actorId: string | null,
  page = 1,
) {
  await assertManager(database, actorId);
  const board = await listPublicExternalData(database, page);
  const syncs = await database.externalSync.findMany();
  return { ...board, syncs };
}

export async function getExternalHistory(
  database: PrismaClient,
  actorId: string | null,
  id: string,
  page = 1,
) {
  await assertManager(database, actorId);
  if (!z.uuid().safeParse(id).success) return null;
  const series = await database.externalSeries.findUnique({ where: { id } });
  if (!series) return null;
  page = safePage(page);
  const rows = await database.externalObservation.findMany({
    where: { seriesId: id },
    orderBy: [
      { periodEnd: "desc" },
      { periodStart: "desc" },
      { revision: "desc" },
    ],
    skip: (page - 1) * EXTERNAL_PAGE_SIZE,
    take: EXTERNAL_PAGE_SIZE,
    include: { createdBy: { select: { name: true } } },
  });
  const total = await database.externalObservation.count({
    where: { seriesId: id },
  });
  return { series, rows, total, page };
}
