import "server-only";

import { getPublicQuotes } from "@/features/public-quotes/service";
import type { PrismaClient } from "@/generated/prisma/client";

import { getExternalTrend, listExternalChartSources } from "./external-service";
import { dashboardPeriod, single, type DashboardSearch } from "./filters";
import { replacementRatio } from "./indicators";
import { getQuoteTrend, listChartSlaughterhouses } from "./quote-service";

type ExternalTrend = Awaited<ReturnType<typeof getExternalTrend>>;
function ratioBasis(trend: ExternalTrend) {
  const last = trend?.points.at(-1);
  return trend && last
    ? {
        ...last,
        metric: trend.metric,
        geography: trend.geography,
        frequency: trend.frequency,
        periodEnd: last.date,
        freshness: trend.freshness,
      }
    : null;
}

export async function getDashboard(
  database: PrismaClient,
  search: DashboardSearch,
  now = new Date(),
) {
  const period = dashboardPeriod(search, now);
  const [quotes, sources] = await Promise.all([
    getPublicQuotes(database, {
      regionId: single(search.regiao),
      categoryId: single(search.categoria),
    }),
    listExternalChartSources(database),
  ]);
  const slaughterhouses = await listChartSlaughterhouses(
    database,
    quotes.region?.id,
  );
  const slaughterhouse =
    slaughterhouses.find((row) => row.id === single(search.frigorifico)) ??
    slaughterhouses[0];
  const source =
    sources.find((row) => row.id === single(search.serie)) ??
    sources.find((row) => row.metric === "USD_BRL") ??
    sources[0];
  const comparisonRegion = quotes.regions.find(
    (row) => row.id === single(search.comparar) && row.id !== quotes.region?.id,
  );
  const arrobaSource = sources.find(
    (row) =>
      row.id === single(search.arroba) && row.metric === "ARROBA_REFERENCE",
  );
  const calfSource = sources.find(
    (row) => row.id === single(search.bezerro) && row.metric === "CALF_PRICE",
  );
  const [quoteTrend, externalTrend, comparison, arrobaTrend, calfTrend] =
    await Promise.all([
      getQuoteTrend(database, {
        slaughterhouseId: slaughterhouse?.id,
        categoryId: quotes.categoryId || undefined,
        regionId: quotes.region?.id,
        ...period,
      }),
      getExternalTrend(database, source?.id, period, now),
      comparisonRegion
        ? getPublicQuotes(database, {
            regionId: comparisonRegion.id,
            categoryId: quotes.categoryId,
          })
        : null,
      getExternalTrend(database, arrobaSource?.id, period, now),
      getExternalTrend(database, calfSource?.id, period, now),
    ]);
  return {
    period,
    quotes,
    sources,
    slaughterhouses,
    slaughterhouse,
    source,
    comparisonRegion,
    comparison,
    quoteTrend,
    externalTrend,
    arrobaSource,
    calfSource,
    arrobaTrend,
    calfTrend,
    ratio: replacementRatio(ratioBasis(arrobaTrend), ratioBasis(calfTrend)),
  };
}
