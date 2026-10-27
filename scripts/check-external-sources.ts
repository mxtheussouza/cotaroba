import { collectSource } from "@/features/external-data/connectors";
import type { Connector } from "@/features/external-data/schema";

// Optional read-only live probe; deterministic regression tests use fixture responses.
for (const connector of [
  "BCB_PTAX",
  "IBGE_SLAUGHTER_BA",
] satisfies Connector[]) {
  try {
    const rows = await collectSource(connector);
    console.log(
      `${connector}: ${rows.length} registros válidos; última referência ${rows.at(-1)!.periodEnd}. Nenhum dado gravado.`,
    );
  } catch {
    console.error(
      `${connector}: fonte indisponível ou formato inesperado. Nenhum dado gravado.`,
    );
    process.exitCode = 1;
  }
}
