import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";

export const PUBLIC_QUOTES_PAGE_SIZE = 20;

type QuoteRow = {
  slaughterhouse: string;
  category: string;
  pricePerArroba: string;
  referenceDate: string;
  updatedAt: Date;
};

function pageNumber(value: number) {
  return Number.isSafeInteger(value) && value > 0 && value <= 100_000
    ? value
    : 1;
}

export async function getPublicQuotes(
  database: PrismaClient,
  filters: { regionId?: string; categoryId?: string; page?: number } = {},
) {
  const regions = await database.region.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const categories = await database.cattleCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const region =
    regions.find((item) => item.id === filters.regionId) ?? regions[0];
  const category = categories.find((item) => item.id === filters.categoryId);
  const page = pageNumber(filters.page ?? 1);
  if (!region)
    return {
      regions,
      categories,
      region: null,
      categoryId: category?.id ?? "",
      page,
      total: 0,
      items: [] as Array<{
        slaughterhouse: string;
        category: string;
        pricePerArroba: string;
        referenceDate: string;
        updatedAt: string;
      }>,
    };

  const categoryFilter = category
    ? Prisma.sql`AND q."categoryId" = ${category.id}::uuid`
    : Prisma.empty;
  const ranked = Prisma.sql`
    WITH ranked AS (
      SELECT s."name" AS "slaughterhouse", c."name" AS "category",
             q."pricePerArroba"::text AS "pricePerArroba",
             to_char(q."referenceDate", 'YYYY-MM-DD') AS "referenceDate",
             q."createdAt" AS "updatedAt",
             row_number() OVER (
               PARTITION BY q."slaughterhouseId", q."categoryId"
               ORDER BY q."referenceDate" DESC, q."createdAt" DESC, q."id" DESC
             ) AS position
      FROM "Quote" q
      JOIN "Slaughterhouse" s ON s."id" = q."slaughterhouseId"
      JOIN "CattleCategory" c ON c."id" = q."categoryId"
      WHERE q."regionId" = ${region.id}::uuid
        AND s."regionId" = ${region.id}::uuid
        AND s."isActive" = true
        AND NOT EXISTS (
          SELECT 1 FROM "Quote" newer WHERE newer."previousQuoteId" = q."id"
        )
        ${categoryFilter}
    )`;
  const count = await database.$queryRaw<Array<{ total: bigint }>>`
    ${ranked} SELECT count(*) AS total FROM ranked WHERE position = 1`;
  const rows = await database.$queryRaw<QuoteRow[]>`
    ${ranked}
    SELECT "slaughterhouse", "category", "pricePerArroba", "referenceDate", "updatedAt"
    FROM ranked WHERE position = 1
    ORDER BY "slaughterhouse", "category"
    LIMIT ${PUBLIC_QUOTES_PAGE_SIZE} OFFSET ${(page - 1) * PUBLIC_QUOTES_PAGE_SIZE}`;
  return {
    regions,
    categories,
    region,
    categoryId: category?.id ?? "",
    page,
    total: Number(count[0]?.total ?? 0),
    items: rows.map((row) => ({
      slaughterhouse: row.slaughterhouse,
      category: row.category,
      pricePerArroba: row.pricePerArroba,
      referenceDate: row.referenceDate,
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}
