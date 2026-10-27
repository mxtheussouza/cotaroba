import Link from "next/link";

import { formatPrice, formatReferenceDate } from "@/features/quotes/format";
import {
  getPublicQuotes,
  PUBLIC_QUOTES_PAGE_SIZE,
} from "@/features/public-quotes/service";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function pageUrl(regionId: string, categoryId: string, page: number) {
  const query = new URLSearchParams({ regiao: regionId, pagina: String(page) });
  if (categoryId) query.set("categoria", categoryId);
  return `/cotacoes?${query}`;
}

export default async function PublicQuotesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const board = await getPublicQuotes(getDatabase(), {
    regionId: single(search.regiao),
    categoryId: single(search.categoria),
    page: Number(single(search.pagina) ?? 1),
  });
  const updatedAt = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Bahia",
    }).format(new Date(value));

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only rounded-xl bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Cotaroba
          </Link>
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary"
          >
            Entrar
          </Link>
        </div>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12 sm:py-16"
      >
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          Consulta pública · Bahia
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Cotações por frigorífico
        </h1>
        <p className="mt-4 max-w-3xl text-muted">
          Consulte o preço da arroba informado por cada frigorífico. As datas
          indicam a referência e a última atualização de cada cotação; os
          valores não são em tempo real.
        </p>

        <form
          action="/cotacoes"
          method="get"
          className="mt-8 grid gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label htmlFor="region" className="block text-sm font-semibold">
              Região
            </label>
            <select
              id="region"
              name="regiao"
              defaultValue={board.region?.id ?? ""}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base"
            >
              {board.regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-semibold">
              Categoria
            </label>
            <select
              id="category"
              name="categoria"
              defaultValue={board.categoryId}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base"
            >
              <option value="">Todas as categorias</option>
              {board.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Consultar
          </button>
        </form>

        <section className="mt-10" aria-labelledby="results-title">
          <h2 id="results-title" className="text-2xl font-bold">
            {board.region
              ? `Preços em ${board.region.name}`
              : "Preços por região"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Última cotação vigente por frigorífico e categoria na região
            selecionada. Unidade: R$/@. Não há cálculo de média.
          </p>
          {board.items.length === 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-surface p-6">
              <p className="font-semibold">Dados insuficientes</p>
              <p className="mt-2 text-sm text-muted">
                {board.total === 0
                  ? "Não há cotações vigentes para esta seleção."
                  : "Não há cotações nesta página. Volte à página anterior."}
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {board.items.map((quote) => (
                <li
                  key={`${quote.slaughterhouse}:${quote.category}`}
                  className="rounded-xl border border-border bg-surface p-6 [overflow-wrap:anywhere]"
                >
                  <h3 className="text-xl font-bold">{quote.slaughterhouse}</h3>
                  <p className="mt-1 text-sm text-muted">{quote.category}</p>
                  <p className="mt-4 text-2xl font-bold text-primary">
                    {formatPrice(quote.pricePerArroba)}
                  </p>
                  <p className="mt-3 text-sm">
                    Referência: {formatReferenceDate(quote.referenceDate)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Informado pelo frigorífico · Atualizado em{" "}
                    {updatedAt(quote.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {board.total > PUBLIC_QUOTES_PAGE_SIZE && board.region && (
            <nav
              aria-label="Paginação das cotações"
              className="mt-6 flex flex-wrap gap-6 text-sm"
            >
              {board.page > 1 && (
                <Link
                  href={pageUrl(
                    board.region.id,
                    board.categoryId,
                    board.page - 1,
                  )}
                  className="font-semibold text-primary underline"
                >
                  Anterior
                </Link>
              )}
              <span>Página {board.page}</span>
              {board.page * PUBLIC_QUOTES_PAGE_SIZE < board.total && (
                <Link
                  href={pageUrl(
                    board.region.id,
                    board.categoryId,
                    board.page + 1,
                  )}
                  className="font-semibold text-primary underline"
                >
                  Próxima
                </Link>
              )}
            </nav>
          )}
        </section>
      </main>
      <footer className="border-t border-border">
        <p className="mx-auto max-w-[1200px] px-6 py-6 text-sm text-muted">
          Cotaroba · Observatório pecuário da Bahia
        </p>
      </footer>
    </>
  );
}
