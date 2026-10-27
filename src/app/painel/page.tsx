import { PublicShell } from "@/components/public-shell";
import {
  CurrentQuoteCards,
  DashboardFilters,
  ExternalTrend,
  LocalTrend,
  ReplacementRatio,
} from "@/features/dashboard/components";
import type { DashboardSearch } from "@/features/dashboard/filters";
import { getDashboard } from "@/features/dashboard/service";
import { DashboardWorkspace } from "@/features/dashboard/workspace";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearch>;
}) {
  const board = await getDashboard(getDatabase(), await searchParams);
  return (
    <PublicShell
      compact
      title="Painel do mercado pecuário"
      description="Preços por frigorífico e referências de mercado, com fonte e data. Valores não são em tempo real."
    >
      {board.period.error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-danger bg-surface p-3 text-sm text-danger"
        >
          {board.period.error} Exibindo os últimos 90 dias.
        </p>
      )}
      <DashboardWorkspace
        filters={<DashboardFilters board={board} />}
        panels={[
          <section key="prices" aria-labelledby="current-quotes-title">
            <h2 id="current-quotes-title" className="text-xl font-bold">
              Preços vigentes por região
            </h2>
            <p className="mt-1 text-sm text-muted">
              Sem média. Compare referências e condições comerciais. O período
              dos gráficos não altera os preços vigentes.
            </p>
            <div
              className={`mt-3 grid items-start gap-4 ${board.comparison ? "lg:grid-cols-2" : ""}`}
            >
              <CurrentQuoteCards data={board.quotes} />
              {board.comparison && (
                <CurrentQuoteCards data={board.comparison} />
              )}
            </div>
          </section>,
          <LocalTrend key="local" board={board} />,
          <ExternalTrend key="external" board={board} />,
          <ReplacementRatio key="ratio" board={board} />,
        ]}
      />
    </PublicShell>
  );
}
