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

export function DashboardFilters({ board }: { board: Board }) {
  return (
    <DashboardFilterForm>
      <div>
        <label htmlFor="dashboard-region" className="text-sm font-semibold">
          Região
        </label>
        <select
          id="dashboard-region"
          name="regiao"
          defaultValue={board.quotes.region?.id ?? ""}
          className={fieldClass}
        >
          {board.quotes.regions.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dashboard-category" className="text-sm font-semibold">
          Categoria
        </label>
        <select
          id="dashboard-category"
          name="categoria"
          defaultValue={board.quotes.categoryId}
          className={fieldClass}
        >
          <option value="">Todas as categorias</option>
          {board.quotes.categories.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dashboard-comparison" className="text-sm font-semibold">
          Comparar com outra região
        </label>
        <select
          id="dashboard-comparison"
          name="comparar"
          defaultValue={board.comparisonRegion?.id ?? ""}
          className={fieldClass}
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
      <div>
        <label htmlFor="dashboard-company" className="text-sm font-semibold">
          Frigorífico do gráfico
        </label>
        <select
          id="dashboard-company"
          name="frigorifico"
          defaultValue={board.slaughterhouse?.id ?? ""}
          className={fieldClass}
        >
          {board.slaughterhouses.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-muted">
          Ao mudar de região, aplique os filtros para carregar os frigoríficos
          dela.
        </p>
      </div>
      <div>
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
          className={fieldClass}
        />
      </div>
      <div>
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
          className={fieldClass}
        />
      </div>
      <div className="lg:col-span-3">
        <label htmlFor="dashboard-source" className="text-sm font-semibold">
          Série externa do gráfico
        </label>
        <select
          id="dashboard-source"
          name="serie"
          defaultValue={board.source?.id ?? ""}
          className={fieldClass}
        >
          <option value="">Selecione uma série</option>
          {board.sources.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ratio-arroba" className="text-sm font-semibold">
          Referência da arroba para relação de troca
        </label>
        <select
          id="ratio-arroba"
          name="arroba"
          defaultValue={board.arrobaSource?.id ?? ""}
          className={fieldClass}
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
      <div>
        <label htmlFor="ratio-calf" className="text-sm font-semibold">
          Referência do bezerro para relação de troca
        </label>
        <select
          id="ratio-calf"
          name="bezerro"
          defaultValue={board.calfSource?.id ?? ""}
          className={fieldClass}
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
    <div className="mt-4 rounded-xl bg-secondary p-4 text-sm">
      {variation && firstDate && lastDate ? (
        <>
          <p className="font-semibold">
            Variação no período: {signed(variation.absolute)} {unit}
            {variation.percent !== null
              ? ` (${signed(variation.percent)}%)`
              : " (percentual indisponível: base zero)"}
          </p>
          <p className="mt-2 text-muted">
            Entre {formatReferenceDate(firstDate)} e{" "}
            {formatReferenceDate(lastDate)}. Percentual = (último valor −
            primeiro valor) ÷ primeiro valor × 100, com duas casas decimais.
          </p>
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
  return (
    <div>
      <h3 className="text-xl font-bold">
        {data.region?.name ?? "Região não cadastrada"}
      </h3>
      {data.items.length ? (
        <ul className="mt-4 space-y-3">
          {data.items.map((row, index) => (
            <li
              key={index}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <p className="font-bold">{row.slaughterhouse}</p>
              <p className="mt-1 text-sm text-muted">{row.category}</p>
              <p className="mt-3 text-xl font-bold text-primary">
                {formatPrice(row.pricePerArroba)}
              </p>
              <p className="mt-2 text-sm">
                Referência: {formatReferenceDate(row.referenceDate)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Fonte: frigorífico · Atualizado em{" "}
                {formatCollectedAt(row.updatedAt)} (Bahia)
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-border bg-surface p-6 font-semibold">
          Dados insuficientes
        </p>
      )}
      <p className="mt-4 text-sm text-muted">
        {data.total} cotações vigentes nesta seleção. Até 20 exibidas no painel.
      </p>
      <Link
        href={`/cotacoes?${query}`}
        className={`${linkClass} mt-2 inline-block`}
      >
        Consultar lista completa de {data.region?.name ?? "cotações"}
      </Link>
    </div>
  );
}

export function DashboardCharts({ board }: { board: Board }) {
  const local = board.quoteTrend;
  const external = board.externalTrend;
  const lastExternal = external?.points.at(-1);
  return (
    <>
      <section aria-labelledby="local-trend-title" className="mt-10">
        <h2 id="local-trend-title" className="text-2xl font-bold">
          Evolução da arroba por frigorífico
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-muted">
          Selecione uma categoria específica e um frigorífico. Cada data mostra
          a cotação vigente mais recentemente informada para aquele dia.
          Correções substituídas ficam privadas; se uma atualização alterar a
          data ou a categoria da cotação, ela deixa de contribuir para a
          referência anterior. Não há média entre frigoríficos.
        </p>
        {local ? (
          <div className="mt-6">
            <TimeSeriesChart
              title={`${local.slaughterhouse} · ${local.category}`}
              points={local.points}
              unit="R$/@"
              source={`${local.slaughterhouse} · ${local.region}`}
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
      <section aria-labelledby="external-trend-title" className="mt-10">
        <h2 id="external-trend-title" className="text-2xl font-bold">
          Contexto climático e econômico
        </h2>
        <p className="mt-3 text-sm text-muted">
          Dólar, chuva, milho, soja e produção contextualizam o mercado. Os
          gráficos não indicam causalidade nem previsão de preço. Para séries
          semanais, mensais e trimestrais, o filtro usa a data final da
          referência.
        </p>
        {external ? (
          <div className="mt-6">
            <TimeSeriesChart
              title={external.name}
              points={external.points}
              unit={external.unit}
              source={external.sourceName}
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
      <section
        aria-labelledby="ratio-title"
        className="mt-10 rounded-xl border border-border bg-surface p-6 sm:p-8"
      >
        <h2 id="ratio-title" className="text-2xl font-bold">
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
