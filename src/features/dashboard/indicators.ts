import "server-only";

import { Prisma } from "@/generated/prisma/client";

export function priceVariation(first: string, last: string) {
  const base = new Prisma.Decimal(first);
  const difference = new Prisma.Decimal(last).minus(base);
  return {
    absolute: difference.toFixed(4),
    percent: base.eq(0) ? null : difference.div(base).times(100).toFixed(2),
  };
}

export function replacementRatio(
  arroba: {
    metric: string;
    value: string;
    geography: string;
    frequency: string;
    periodStart: string;
    periodEnd: string;
    freshness: string;
  } | null,
  calf: {
    metric: string;
    value: string;
    geography: string;
    frequency: string;
    periodStart: string;
    periodEnd: string;
    freshness: string;
  } | null,
) {
  if (
    !arroba ||
    !calf ||
    arroba.metric !== "ARROBA_REFERENCE" ||
    calf.metric !== "CALF_PRICE" ||
    arroba.freshness !== "current" ||
    calf.freshness !== "current"
  )
    return null;
  const normalize = (value: string) =>
    value
      .normalize("NFC")
      .trim()
      .replace(/\s+/gu, " ")
      .toLocaleLowerCase("pt-BR");
  if (
    normalize(arroba.geography) !== normalize(calf.geography) ||
    arroba.frequency !== calf.frequency ||
    arroba.periodStart !== calf.periodStart ||
    arroba.periodEnd !== calf.periodEnd
  )
    return null;
  const denominator = new Prisma.Decimal(arroba.value);
  const numerator = new Prisma.Decimal(calf.value);
  return denominator.lte(0) || numerator.lte(0)
    ? null
    : numerator.div(denominator).toFixed(4);
}
