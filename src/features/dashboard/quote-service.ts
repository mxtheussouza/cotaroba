import "server-only";

import { z } from "zod";

import { civilDate } from "@/features/external-data/schema";
import type { PrismaClient } from "@/generated/prisma/client";

import { priceVariation } from "./indicators";

export async function listChartSlaughterhouses(
  database: PrismaClient,
  regionId: string | undefined,
) {
  if (!z.uuid().safeParse(regionId).success) return [];
  return database.slaughterhouse.findMany({
    where: { regionId, isActive: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
}

export async function getQuoteTrend(
  database: PrismaClient,
  filters: {
    slaughterhouseId?: string;
    regionId?: string;
    categoryId?: string;
    start: string;
    end: string;
  },
) {
  if (
    ![filters.slaughterhouseId, filters.regionId, filters.categoryId].every(
      (id) => z.uuid().safeParse(id).success,
    )
  )
    return null;
  const start = civilDate.parse(filters.start);
  const end = civilDate.parse(filters.end);
  if (start > end || (Date.parse(end) - Date.parse(start)) / 86_400_000 > 365)
    return null;
  const slaughterhouse = await database.slaughterhouse.findFirst({
    where: {
      id: filters.slaughterhouseId,
      regionId: filters.regionId,
      isActive: true,
    },
    select: { name: true, region: { select: { name: true } } },
  });
  const category = await database.cattleCategory.findUnique({
    where: { id: filters.categoryId },
    select: { name: true },
  });
  if (!slaughterhouse || !category) return null;
  const rows = await database.$queryRaw<
    Array<{ date: string; value: string; updatedAt: Date }>
  >`
    WITH ranked AS (
      SELECT q."referenceDate", q."pricePerArroba", q."createdAt",
             row_number() OVER (PARTITION BY q."referenceDate" ORDER BY q."createdAt" DESC, q."id" DESC) AS position
      FROM "Quote" q
      JOIN "Slaughterhouse" s ON s."id" = q."slaughterhouseId"
      WHERE q."slaughterhouseId" = ${filters.slaughterhouseId}::uuid
        AND q."regionId" = ${filters.regionId}::uuid AND s."regionId" = ${filters.regionId}::uuid AND s."isActive" = true
        AND q."categoryId" = ${filters.categoryId}::uuid
        AND q."referenceDate" BETWEEN ${start}::date AND ${end}::date
        AND NOT EXISTS (SELECT 1 FROM "Quote" revision WHERE revision."previousQuoteId" = q."id")
    )
    SELECT to_char("referenceDate", 'YYYY-MM-DD') AS date, "pricePerArroba"::text AS value, "createdAt" AS "updatedAt"
    FROM ranked WHERE position = 1 ORDER BY "referenceDate" LIMIT 366
  `;
  return {
    slaughterhouse: slaughterhouse.name,
    region: slaughterhouse.region.name,
    category: category.name,
    points: rows.map((row) => ({
      ...row,
      updatedAt: row.updatedAt.toISOString(),
    })),
    variation:
      rows.length >= 2
        ? priceVariation(rows[0].value, rows.at(-1)!.value)
        : null,
  };
}
