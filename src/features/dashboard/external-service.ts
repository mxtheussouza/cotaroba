import "server-only";

import { z } from "zod";

import { metrics, civilDate } from "@/features/external-data/schema";
import { observationFreshness } from "@/features/external-data/service";
import { type PrismaClient } from "@/generated/prisma/client";

import { priceVariation } from "./indicators";

export async function listExternalChartSources(database: PrismaClient) {
  return database.externalSeries.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true, metric: true },
  });
}

export async function getExternalTrend(
  database: PrismaClient,
  id: string | undefined,
  period: { start: string; end: string },
  now = new Date(),
) {
  if (!z.uuid().safeParse(id).success) return null;
  const start = civilDate.parse(period.start);
  const end = civilDate.parse(period.end);
  if (start > end || (Date.parse(end) - Date.parse(start)) / 86_400_000 > 365)
    return null;
  const series = await database.externalSeries.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      metric: true,
      geography: true,
      frequency: true,
      sourceName: true,
      sourceUrl: true,
      staleAfterDays: true,
      connector: true,
    },
  });
  if (!series) return null;
  const points = await database.$queryRaw<
    Array<{
      date: string;
      periodStart: string;
      value: string;
      validUntil: string | null;
      collectedAt: Date;
      origin: "API" | "MANUAL";
    }>
  >`
    WITH ranked AS (
      SELECT o.*, row_number() OVER (PARTITION BY "periodStart", "periodEnd" ORDER BY "revision" DESC) AS position
      FROM "ExternalObservation" o
      WHERE "seriesId" = ${id}::uuid AND "periodEnd" BETWEEN ${start}::date AND ${end}::date
    )
    SELECT to_char("periodEnd", 'YYYY-MM-DD') AS date, to_char("periodStart", 'YYYY-MM-DD') AS "periodStart",
           "value"::text AS value, to_char("validUntil", 'YYYY-MM-DD') AS "validUntil", "collectedAt", "origin"
    FROM ranked WHERE position = 1 ORDER BY "periodEnd", "periodStart" LIMIT 366
  `;
  const last = points.at(-1);
  return {
    ...series,
    unit: metrics[series.metric].unit,
    points: points.map((row) => ({
      ...row,
      collectedAt: row.collectedAt.toISOString(),
    })),
    variation:
      points.length >= 2 ? priceVariation(points[0].value, last!.value) : null,
    freshness: last
      ? observationFreshness(
          { periodEnd: last.date, validUntil: last.validUntil },
          series.staleAfterDays,
          now,
        )
      : ("missing" as const),
  };
}
