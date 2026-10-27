import Link from "next/link";

import { PublicShell } from "@/components/public-shell";
import {
  CurrentQuoteCards,
  DashboardCharts,
  DashboardFilters,
} from "@/features/dashboard/components";
import type { DashboardSearch } from "@/features/dashboard/filters";
import { getDashboard } from "@/features/dashboard/service";
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
      title="Painel do mercado pecuário"
      description="Acompanhe preços individuais por região, evolução das referências e contexto climático e econômico. Cada informação mantém sua fonte, unidade e data; os valores não são em tempo real."
    >
      <DashboardFilters board={board} />
      {board.period.error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-danger bg-surface p-4 text-danger"
        >
          {board.period.error} Exibindo os últimos 90 dias.
        </p>
      )}
      <section aria-labelledby="current-quotes-title" className="mt-10">
        <h2 id="current-quotes-title" className="text-2xl font-bold">
          Preços vigentes por região
        </h2>
        <p className="mt-3 text-sm text-muted">
          Preços individuais, sem média. Região e categoria filtram esta lista;
          o período filtra os gráficos abaixo. Compare as datas e condições
          comerciais antes de comparar os preços.
        </p>
        <div
          className={`mt-6 grid gap-8 ${board.comparison ? "lg:grid-cols-2" : "max-w-2xl"}`}
        >
          <CurrentQuoteCards data={board.quotes} />
          {board.comparison && <CurrentQuoteCards data={board.comparison} />}
        </div>
      </section>
      <DashboardCharts board={board} />
      <section
        className="mt-10 rounded-xl border border-border bg-secondary p-6 sm:p-8"
        aria-labelledby="simulator-link-title"
      >
        <h2 id="simulator-link-title" className="text-2xl font-bold">
          Compare seus cenários
        </h2>
        <p className="mt-3 text-sm text-muted">
          Informe peso vivo, rendimento, preço e custo por animal para estimar
          receita e margem.
        </p>
        <Link
          href="/simulador"
          className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Abrir simulador
        </Link>
      </section>
    </PublicShell>
  );
}
