import Link from "next/link";

import {
  fieldClass,
  formatCollectedAt,
  formatExternalValue,
  linkClass,
} from "@/features/external-data/components";
import { frequencies } from "@/features/external-data/schema";
import {
  formatPrice,
  formatReferenceDate,
  todayInBahia,
} from "@/features/quotes/format";
import type { getPublicQuotes } from "@/features/public-quotes/service";

import { TimeSeriesChart } from "./chart";
import { DashboardFilterForm } from "./filter-form";
import type { priceVariation } from "./indicators";
import type { getDashboard } from "./service";

type Board = Awaited<ReturnType<typeof getDashboard>>;
const filterFieldClass = fieldClass
  .replace("mt-2", "mt-1")
  .replace("py-3", "py-2");

export function DashboardFilters({ board }: { board: Board }) {
  return (
    <DashboardFilterForm
      today={todayInBahia()}
      values={{
        regiao: board.quotes.region?.id ?? "",
        categoria: board.quotes.categoryId,
        comparar: board.comparisonRegion?.id ?? "",
        frigorifico: board.slaughterhouse?.id ?? "",
        inicio: board.period.start,
        fim: board.period.end,
        serie: board.source?.id ?? "",
        arroba: board.arrobaSource?.id ?? "",
        bezerro: board.calfSource?.id ?? "",
      }}
    >
      <div data-filter-views="precos evolucao">
        <label htmlFor="dashboard-region" className="text-sm font-semibold">
          Região
        </label>
        <select
          id="dashboard-region"
          name="regiao"
          defaultValue={board.quotes.region?.id ?? ""}
          className={filterFieldClass}
        >
          {board.quotes.regions.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </div>
      <div data-filter-views="precos evolucao">
        <label htmlFor="dashboard-category" className="text-sm font-semibold">
          Categoria
        </label>
        <select
          id="dashboard-category"
          name="categoria"
          defaultValue={board.quotes.categoryId}
          className={filterFieldClass}
        >
          <option value="">Todas as categorias</option>
          {board.quotes.categories.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </div>
      <div data-filter-views="precos">
        <label htmlFor="dashboard-comparison" className="text-sm font-semibold">
          Comparar com outra região
        </label>
        <select
          id="dashboard-comparison"
          name="comparar"
          defaultValue={board.comparisonRegion?.id ?? ""}
          className={filterFieldClass}
        >
          <option value="">Sem comparação</option>
          {board.quotes.regions
            .filter((row) => row.id !== board.quotes.region?.id)
            .map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
        </select>
      </div>
      <div data-filter-views="evolucao">
        <label htmlFor="dashboard-company" className="text-sm font-semibold">
          Frigorífico do gráfico
        </label>
        <select
          id="dashboard-company"
          name="frigorifico"
          defaultValue={board.slaughterhouse?.id ?? ""}
          className={filterFieldClass}
        >
          {board.slaughterhouses.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </div>
      <div data-filter-views="evolucao contexto troca">
        <label htmlFor="dashboard-start" className="text-sm font-semibold">
          Início do período
        </label>
        <input
          id="dashboard-start"
          name="inicio"
          type="date"
          required
          min="0001-01-01"
          max={todayInBahia()}
          defaultValue={board.period.start}
          className={filterFieldClass}
        />
      </div>
      <div data-filter-views="evolucao contexto troca">
        <label htmlFor="dashboard-end" className="text-sm font-semibold">
          Fim do período
        </label>
        <input
          id="dashboard-end"
          name="fim"
          type="date"
          required
          min="0001-01-01"
          max={todayInBahia()}
          defaultValue={board.period.end}
          className={filterFieldClass}
        />
      </div>
      <div data-filter-views="contexto">
        <label htmlFor="dashboard-source" className="text-sm font-semibold">
          Série externa do gráfico
        </label>
        <select
          id="dashboard-source"
          name="serie"
          defaultValue={board.source?.id ?? ""}
          className={filterFieldClass}
        >
          <option value="">Selecione uma série</option>
          {board.sources.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </div>
      <div data-filter-views="troca">
        <label htmlFor="ratio-arroba" className="text-sm font-semibold">
          Referência da arroba para relação de troca
        </label>
        <select
          id="ratio-arroba"
          name="arroba"
          defaultValue={board.arrobaSource?.id ?? ""}
          className={filterFieldClass}
        >
          <option value="">Selecione uma série</option>
          {board.sources
            .filter((row) => row.metric === "ARROBA_REFERENCE")
            .map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
        </select>
      </div>
      <div data-filter-views="troca">
        <label htmlFor="ratio-calf" className="text-sm font-semibold">
          Referência do bezerro para relação de troca
        </label>
        <select
          id="ratio-calf"
          name="bezerro"
          defaultValue={board.calfSource?.id ?? ""}
          className={filterFieldClass}
        >
          <option value="">Selecione uma série</option>
          {board.sources
            .filter((row) => row.metric === "CALF_PRICE")
            .map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
        </select>
      </div>
    </DashboardFilterForm>
  );
}

export function Variation({
  variation,
  firstDate,
  lastDate,
  unit,
}: {
  variation: ReturnType<typeof priceVariation> | null;
  firstDate?: string;
  lastDate?: string;
  unit: string;
}) {
  const signed = (value: string) =>
    `${Number(value) > 0 ? "+" : ""}${formatExternalValue(value)}`;
  return (
    <div className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm">
      {variation && firstDate && lastDate ? (
        <>
          <p className="font-semibold">
            Variação no período: {signed(variation.absolute)} {unit}
            {variation.percent !== null
              ? ` (${signed(variation.percent)}%)`
              : " (percentual indisponível: base zero)"}
          </p>
          <details className="mt-1 text-muted">
            <summary className="cursor-pointer">Como é calculada</summary>
            Entre {formatReferenceDate(firstDate)} e{" "}
            {formatReferenceDate(lastDate)}. Percentual = (último − primeiro) ÷
            primeiro × 100, duas casas decimais.
          </details>
        </>
      ) : (
        <p>
          Dados insuficientes para calcular variação: são necessárias duas
          referências distintas.
        </p>
      )}
    </div>
  );
}

export function CurrentQuoteCards({
  data,
}: {
  data: Awaited<ReturnType<typeof getPublicQuotes>>;
}) {
  const query = new URLSearchParams({
    regiao: data.region?.id ?? "",
    categoria: data.categoryId,
  });
  const rows = data.items.map((row, index) => (
    <li
      key={index}
      className="grid gap-2 border-b border-border py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div>
        <p className="font-semibold">{row.slaughterhouse}</p>
        <p className="text-sm text-muted">{row.category}</p>
      </div>
      <p className="text-xl font-bold text-primary sm:text-right">
        {formatPrice(row.pricePerArroba)}
      </p>
      <p className="text-sm text-muted sm:col-span-2">
        Referência: {formatReferenceDate(row.referenceDate)} · Atualizado em{" "}
        {formatCollectedAt(row.updatedAt)} (Bahia)
      </p>
    </li>
  ));
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold">
          {data.region?.name ?? "Região não cadastrada"}
        </h3>
        <span className="text-sm text-muted">
          {data.total} {data.total === 1 ? "cotação" : "cotações"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Fonte: frigoríficos · Preços individuais em R$/@
      </p>
      {rows.length ? (
        <>
          <ul className="mt-2">{rows.slice(0, 5)}</ul>
          {rows.length > 5 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-primary">
                Ver mais {rows.length - 5} cotações nesta seleção
              </summary>
              <ul>{rows.slice(5)}</ul>
            </details>
          )}
        </>
      ) : (
        <p className="py-5 font-semibold">Dados insuficientes</p>
      )}
      <Link
        href={`/cotacoes?${query}`}
        className={`${linkClass} mt-3 inline-block text-sm`}
      >
        Consultar lista completa de {data.region?.name ?? "cotações"}
      </Link>
      {data.total > data.items.length && (
        <p className="mt-1 text-sm text-muted">
          Até 20 no painel; todos na lista completa.
        </p>
      )}
    </div>
  );
}

export function LocalTrend({ board }: { board: Board }) {
  const local = board.quoteTrend;
  return (
    <>
      <section aria-labelledby="local-trend-title">
        <h2 id="local-trend-title" className="text-xl font-bold">
          Evolução da arroba por frigorífico
        </h2>
        <details className="mt-2 text-sm text-muted">
          <summary className="cursor-pointer">
            Como esta evolução é formada
          </summary>
          Cada ponto é uma cotação vigente por data, categoria e frigorífico,
          sem média. Correções substituídas ficam privadas; alterações de data
          ou categoria removem a contribuição anterior.
        </details>
        {local ? (
          <div className="mt-3">
            <TimeSeriesChart
              title={`${local.slaughterhouse} · ${local.category}`}
              points={local.points}
              unit="R$/@"
              source={`Frigorífico · ${local.region}`}
            />
            <Variation
              variation={local.variation}
              firstDate={local.points[0]?.date}
              lastDate={local.points.at(-1)?.date}
              unit="R$/@"
            />
            {local.points.at(-1) && (
              <p className="mt-3 text-sm text-muted">
                Última atualização no recorte:{" "}
                {formatCollectedAt(local.points.at(-1)!.updatedAt)} (Bahia).
              </p>
            )}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-border bg-surface p-6 font-semibold">
            Dados insuficientes. Escolha uma categoria específica e um
            frigorífico ativo na região.
          </p>
        )}
      </section>
    </>
  );
}

export function ExternalTrend({ board }: { board: Board }) {
  const external = board.externalTrend;
  const lastExternal = external?.points.at(-1);
  return (
    <>
      <section aria-labelledby="external-trend-title">
        <h2 id="external-trend-title" className="text-xl font-bold">
          Contexto climático e econômico
        </h2>
        <details className="mt-2 text-sm text-muted">
          <summary className="cursor-pointer">
            Sobre o contexto e os períodos
          </summary>
          Dólar, chuva, milho, soja e produção contextualizam o mercado, sem
          indicar causalidade ou previsão. Para semanas, meses e trimestres, o
          filtro usa o fim da referência.
        </details>
        {external ? (
          <div className="mt-3">
            <TimeSeriesChart
              title={external.name}
              points={external.points}
              unit={external.unit}
              source={external.sourceName}
              variant="context"
              kind={
                external.metric === "RAINFALL" ||
                external.metric === "CATTLE_SLAUGHTER"
                  ? "bar"
                  : "line"
              }
            />
            <p className="mt-4 text-sm">
              {external.geography} · {frequencies[external.frequency]} ·{" "}
              <a
                href={external.sourceUrl}
                rel="noreferrer"
                className={linkClass}
              >
                Consultar fonte original
              </a>
            </p>
            {external.connector === "BCB_PTAX" && (
              <p className="mt-2 text-sm text-muted">
                Dados do BCB sob{" "}
                <a
                  className={linkClass}
                  href="https://opendatacommons.org/licenses/odbl/1-0/"
                >
                  licença ODbL
                </a>
                .
              </p>
            )}
            {lastExternal && (
              <p className="mt-3 text-sm text-muted">
                Última referência no recorte:{" "}
                {formatReferenceDate(lastExternal.date)} ·{" "}
                {lastExternal.origin === "API"
                  ? "Coleta automática"
                  : "Entrada manual"}{" "}
                em {formatCollectedAt(lastExternal.collectedAt)} (Bahia).{" "}
                {external.freshness === "expired"
                  ? "Validade encerrada."
                  : external.freshness === "stale"
                    ? "Dado defasado."
                    : "Dentro do prazo de atualização da série."}
              </p>
            )}
            <Variation
              variation={external.variation}
              firstDate={external.points[0]?.date}
              lastDate={lastExternal?.date}
              unit={external.unit}
            />
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-border bg-surface p-6 font-semibold">
            Dados insuficientes. Cadastre ou sincronize uma série externa.
          </p>
        )}
      </section>
    </>
  );
}

export function ReplacementRatio({ board }: { board: Board }) {
  return (
    <>
      <section
        aria-labelledby="ratio-title"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h2 id="ratio-title" className="text-xl font-bold">
          Relação de troca: arrobas por bezerro
        </h2>
        <p className="mt-3 text-sm text-muted">
          Preço do bezerro (R$/cabeça) ÷ referência da arroba (R$/@). Exige
          séries escolhidas com a mesma localidade, frequência e período, sem
          validade encerrada ou defasagem. Não presume peso do boi. Confira
          também as condições comerciais das duas fontes.
        </p>
        {board.ratio ? (
          <>
            <p className="mt-6 text-3xl font-bold text-primary">
              {formatExternalValue(board.ratio)} @/bezerro
            </p>
            <p className="mt-3 text-sm">
              Referência:{" "}
              {formatReferenceDate(board.calfTrend!.points.at(-1)!.periodStart)}{" "}
              a {formatReferenceDate(board.calfTrend!.points.at(-1)!.date)} ·{" "}
              {board.calfTrend!.geography}
            </p>
            <p className="mt-2 text-sm">
              Arroba:{" "}
              <a href={board.arrobaTrend!.sourceUrl} className={linkClass}>
                {board.arrobaTrend!.sourceName}
              </a>{" "}
              · Bezerro:{" "}
              <a href={board.calfTrend!.sourceUrl} className={linkClass}>
                {board.calfTrend!.sourceName}
              </a>
            </p>
            <p className="mt-2 text-sm text-muted">
              Coletas (Bahia): arroba{" "}
              {formatCollectedAt(board.arrobaTrend!.points.at(-1)!.collectedAt)}
              ; bezerro{" "}
              {formatCollectedAt(board.calfTrend!.points.at(-1)!.collectedAt)}.
            </p>
          </>
        ) : (
          <p className="mt-6 font-semibold">
            Dados insuficientes. Selecione duas referências comparáveis nos
            filtros.
          </p>
        )}
      </section>
    </>
  );
}
