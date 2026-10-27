import { z } from "zod";

export const metrics = {
  USD_BRL: { label: "Dólar (PTAX venda)", unit: "R$/US$", positive: true },
  RAINFALL: { label: "Chuva acumulada", unit: "mm", positive: false },
  CORN: { label: "Milho", unit: "R$/saca de 60 kg", positive: true },
  SOYBEAN: { label: "Soja", unit: "R$/saca de 60 kg", positive: true },
  CATTLE_SLAUGHTER: {
    label: "Abates bovinos",
    unit: "cabeças",
    positive: false,
  },
  CALF_PRICE: { label: "Bezerro", unit: "R$/cabeça", positive: true },
  ARROBA_REFERENCE: {
    label: "Referência da arroba",
    unit: "R$/@",
    positive: true,
  },
} as const;

export const frequencies = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
} as const;

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((v) => v.replace(/\s+/gu, " ").normalize("NFC"));

export const civilDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !value.startsWith("0000") &&
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  });

export const seriesSchema = z.strictObject({
  name: text(160),
  metric: z.enum(
    Object.keys(metrics) as [keyof typeof metrics, ...(keyof typeof metrics)[]],
  ),
  frequency: z.enum(
    Object.keys(frequencies) as [
      keyof typeof frequencies,
      ...(keyof typeof frequencies)[],
    ],
  ),
  geography: text(160),
  sourceName: text(160),
  // This URL is attribution only. It is never fetched by the server.
  sourceUrl: z
    .url()
    .max(1000)
    .refine((value) => {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    }),
  staleAfterDays: z.coerce.number().int().min(1).max(730),
});

export const observationSchema = z
  .strictObject({
    periodStart: civilDate,
    periodEnd: civilDate,
    value: z
      .string()
      .trim()
      .regex(/^\d{1,14}(?:[,.]\d{1,4})?$/)
      .transform((v) => v.replace(",", ".")),
    validUntil: z.union([civilDate, z.literal("")]).default(""),
  })
  .refine((data) => data.periodStart <= data.periodEnd, {
    message: "O fim deve ser igual ou posterior ao início.",
  })
  .refine((data) => !data.validUntil || data.validUntil >= data.periodEnd, {
    message: "A validade deve ser igual ou posterior ao fim do período.",
  });

export type ObservationInput = z.output<typeof observationSchema>;
export type Connector = "BCB_PTAX" | "IBGE_SLAUGHTER_BA";
export const connectorSchema = z.enum(["BCB_PTAX", "IBGE_SLAUGHTER_BA"]);
