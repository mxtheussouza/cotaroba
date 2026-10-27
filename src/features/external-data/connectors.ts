import "server-only";

import { z } from "zod";

import { todayInBahia } from "@/features/quotes/format";

import { civilDate, type Connector, type ObservationInput } from "./schema";

export class SourceError extends Error {
  constructor(public readonly code: "fonte" | "formato" | "sem-dados") {
    super(code);
  }
}

export const connectorDefinitions = {
  BCB_PTAX: {
    name: "Dólar PTAX venda · Brasil",
    metric: "USD_BRL",
    frequency: "DAILY",
    geography: "Brasil",
    sourceName: "Banco Central do Brasil — PTAX",
    sourceUrl:
      "https://dadosabertos.bcb.gov.br/dataset/dolar-americano-usd-todos-os-boletins-diarios",
    staleAfterDays: 5,
  },
  IBGE_SLAUGHTER_BA: {
    name: "Abates bovinos · Bahia · IBGE",
    metric: "CATTLE_SLAUGHTER",
    frequency: "QUARTERLY",
    geography: "Bahia (UF 29)",
    sourceName: "IBGE — Pesquisa Trimestral do Abate de Animais, SIDRA 1092",
    sourceUrl: "https://sidra.ibge.gov.br/tabela/1092",
    staleAfterDays: 180,
  },
} as const;

export type FetchSource = typeof fetch;

async function fetchJson(
  url: string,
  fetchSource: FetchSource,
): Promise<unknown> {
  try {
    const response = await fetchSource(url, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
      redirect: "error",
      headers: { Accept: "application/json" },
    });
    if (!response.ok || !response.body) throw new SourceError("fonte");
    // Bound the streamed response before parsing, including chunked responses.
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 256_000) throw new SourceError("formato");
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new SourceError("formato");
    }
  } catch (error) {
    if (error instanceof SourceError) throw error;
    throw new SourceError("fonte");
  }
}

const ptaxSchema = z.object({
  value: z
    .array(
      z.object({
        cotacaoVenda: z.number().finite().positive().max(999_999),
        dataHoraCotacao: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/),
      }),
    )
    .max(40),
});

export function parsePtax(payload: unknown, today: string): ObservationInput[] {
  const parsed = ptaxSchema.safeParse(payload);
  if (!parsed.success) throw new SourceError("formato");
  return parsed.data.value.map((row) => {
    const date = row.dataHoraCotacao.slice(0, 10);
    if (
      !civilDate.safeParse(date).success ||
      date > today ||
      Number(row.cotacaoVenda.toFixed(4)) !== row.cotacaoVenda
    )
      throw new SourceError("formato");
    return {
      periodStart: date,
      periodEnd: date,
      value: row.cotacaoVenda.toFixed(4),
      validUntil: "",
    };
  });
}

const ibgeSchema = z
  .array(
    z.object({
      id: z.literal("284"),
      unidade: z.literal("Cabeças"),
      resultados: z
        .array(
          z.object({
            classificacoes: z.array(
              z.object({
                id: z.string(),
                categoria: z.record(z.string(), z.string()),
              }),
            ),
            series: z
              .array(
                z.object({
                  localidade: z.object({
                    id: z.literal("29"),
                    nivel: z.object({ id: z.literal("N3") }),
                  }),
                  serie: z.record(z.string(), z.string()),
                }),
              )
              .length(1),
          }),
        )
        .length(1),
    }),
  )
  .length(1);

export function parseIbge(payload: unknown, today: string): ObservationInput[] {
  const parsed = ibgeSchema.safeParse(payload);
  if (!parsed.success) throw new SourceError("formato");
  const result = parsed.data[0].resultados[0];
  const expected = { "12716": "115236", "18": "992", "12529": "118225" };
  if (
    result.classificacoes.length !== 3 ||
    !Object.entries(expected).every(([id, category]) => {
      const match = result.classificacoes.find((item) => item.id === id);
      return (
        match &&
        Object.keys(match.categoria).length === 1 &&
        Object.hasOwn(match.categoria, category)
      );
    })
  )
    throw new SourceError("formato");
  const rows: ObservationInput[] = [];
  const entries = Object.entries(result.series[0].serie);
  if (entries.length > 4) throw new SourceError("formato");
  for (const [period, value] of entries) {
    if (!/^(?!0000)\d{4}0[1-4]$/.test(period)) throw new SourceError("formato");
    // IBGE suppression/missing symbols are never interpreted as zero.
    if (["-", "...", "..", "X"].includes(value)) continue;
    if (!/^\d{1,14}$/.test(value)) throw new SourceError("formato");
    const year = period.slice(0, 4);
    const quarter = Number(period.slice(4));
    const periodStart = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}-01`;
    const periodEnd = `${year}-${String(quarter * 3).padStart(2, "0")}-${quarter === 1 || quarter === 4 ? "31" : "30"}`;
    if (periodEnd > today) throw new SourceError("formato");
    rows.push({ periodStart, periodEnd, value, validUntil: "" });
  }
  return rows;
}

export async function collectSource(
  connector: Connector,
  now = new Date(),
  fetchSource: FetchSource = fetch,
) {
  const today = todayInBahia(now);
  let rows: ObservationInput[];
  if (connector === "BCB_PTAX") {
    const start = new Date(`${today}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 14);
    const american = (date: string) =>
      `${date.slice(5, 7)}-${date.slice(8, 10)}-${date.slice(0, 4)}`;
    const url = new URL(
      "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)",
    );
    url.search = new URLSearchParams({
      "@dataInicial": `'${american(start.toISOString().slice(0, 10))}'`,
      "@dataFinalCotacao": `'${american(today)}'`,
      $format: "json",
      $top: "40",
    }).toString();
    rows = parsePtax(await fetchJson(url.href, fetchSource), today);
    if (rows.some((row) => row.periodStart < start.toISOString().slice(0, 10)))
      throw new SourceError("formato");
  } else {
    const url =
      "https://servicodados.ibge.gov.br/api/v3/agregados/1092/periodos/-4/variaveis/284?localidades=N3%5B29%5D&classificacao=12716%5B115236%5D%7C18%5B992%5D%7C12529%5B118225%5D";
    rows = parseIbge(await fetchJson(url, fetchSource), today);
  }
  if (!rows.length) throw new SourceError("sem-dados");
  const unique = new Set(
    rows.map((row) => `${row.periodStart}:${row.periodEnd}`),
  );
  if (unique.size !== rows.length) throw new SourceError("formato");
  return rows.sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
}
