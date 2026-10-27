import "server-only";

import { Prisma } from "@/generated/prisma/client";

import { simulationSchema, type SimulationResult } from "./schema";

export function calculateSimulation(input: unknown): SimulationResult {
  const values = simulationSchema.parse(input);
  const carcassWeight = new Prisma.Decimal(values.liveWeight)
    .times(values.yieldPercent)
    .div(100);
  const arrobas = carcassWeight.div(15);
  const revenue = arrobas.times(values.arrobaPrice);
  const cost = new Prisma.Decimal(values.totalCost);
  const alternativeRevenue = values.alternativePrice
    ? arrobas.times(values.alternativePrice)
    : null;
  // Keep intermediate precision; rounding happens only in the displayed result.
  const money = (value: Prisma.Decimal) =>
    value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2);
  return {
    carcassWeight: carcassWeight.toFixed(3),
    arrobas: arrobas.toFixed(4),
    revenue: money(revenue),
    cost: money(cost),
    margin: money(revenue.minus(cost)),
    breakEvenPrice: money(cost.div(arrobas)),
    alternative: alternativeRevenue
      ? {
          price: values.alternativePrice,
          revenue: money(alternativeRevenue),
          margin: money(alternativeRevenue.minus(cost)),
          revenueDifference: money(alternativeRevenue.minus(revenue)),
        }
      : null,
  };
}
