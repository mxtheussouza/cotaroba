import { z } from "zod";

function decimal(max: number, positive: boolean, places: number) {
  return z
    .string()
    .trim()
    .max(18)
    .regex(
      new RegExp(`^\\d{1,8}(?:[,.]\\d{1,${places}})?$`),
      "Use um número sem milhar, com vírgula ou ponto decimal.",
    )
    .transform((value) => value.replace(",", "."))
    .refine(
      (value) =>
        Number(value) <= max &&
        (positive ? Number(value) > 0 : Number(value) >= 0),
      "Valor fora dos limites permitidos.",
    );
}

export const simulationSchema = z.strictObject({
  liveWeight: decimal(2000, true, 3),
  yieldPercent: decimal(100, true, 2),
  arrobaPrice: decimal(1_000_000, true, 2),
  totalCost: decimal(10_000_000, false, 2),
  alternativePrice: z
    .union([z.literal(""), decimal(1_000_000, true, 2)])
    .default(""),
});

export type SimulationValues = z.output<typeof simulationSchema>;
export type SimulationResult = {
  carcassWeight: string;
  arrobas: string;
  revenue: string;
  cost: string;
  margin: string;
  breakEvenPrice: string;
  alternative: {
    price: string;
    revenue: string;
    margin: string;
    revenueDifference: string;
  } | null;
};
export type SimulationState = {
  values: SimulationValues;
  result: SimulationResult | null;
  error: string | null;
};
export const initialSimulationState: SimulationState = {
  values: {
    liveWeight: "",
    yieldPercent: "",
    arrobaPrice: "",
    totalCost: "",
    alternativePrice: "",
  },
  result: null,
  error: null,
};
