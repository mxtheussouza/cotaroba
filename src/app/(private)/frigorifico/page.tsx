import { PrivateArea } from "@/features/auth/private-area";
import { requireRole } from "@/features/auth/session";
import Link from "next/link";
import { createQuoteAction } from "@/features/quotes/actions";
import {
  QuoteFeedback,
  QuoteForm,
  type QuoteSearch,
} from "@/features/quotes/components";
import { formatPrice, formatReferenceDate } from "@/features/quotes/format";
import { getQuoteWorkspace, QUOTES_PAGE_SIZE } from "@/features/quotes/service";
import { getDatabase } from "@/lib/db";

export default async function SlaughterhousePage({
  searchParams,
}: {
  searchParams: Promise<QuoteSearch>;
}) {
  const user = await requireRole("SLAUGHTERHOUSE");
  const search = await searchParams;
  const workspace = await getQuoteWorkspace(
    getDatabase(),
    user.id,
    Number(search.pagina ?? 1),
  );
  return (
    <PrivateArea user={user} title="Área do frigorífico">
      <QuoteFeedback search={search} />
      <section
        className="mt-8 max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8"
        aria-labelledby="new-quote-title"
      >
        <h2 id="new-quote-title" className="text-2xl font-bold">
          Cadastrar cotação
        </h2>
        <p className="mt-4 text-sm text-muted">
          Região: {workspace.slaughterhouse.region}. O cadastro usa a região
          atual do seu frigorífico.
        </p>
        {workspace.categories.length === 0 && (
          <p className="mt-4 text-muted">
            Nenhuma categoria disponível. Solicite ao gestor o cadastro das
            categorias antes de informar preços.
          </p>
        )}
        <QuoteForm
          action={createQuoteAction}
          categories={workspace.categories}
        />
      </section>
      <section
        className="mt-10 [overflow-wrap:anywhere]"
        aria-labelledby="quotes-title"
      >
        <h2 id="quotes-title" className="text-2xl font-bold">
          Minhas cotações
        </h2>
        <p className="mt-2 text-muted">
          Versão mais recente de cada cadastro, visível somente aos acessos do
          seu frigorífico.
        </p>
        {workspace.items.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border bg-surface p-6">
            {workspace.total === 0
              ? "Nenhuma cotação cadastrada."
              : "Nenhuma cotação nesta página."}
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {workspace.items.map((quote) => (
              <li
                key={quote.id}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <h3 className="text-xl font-bold">{quote.category}</h3>
                <p className="mt-4 text-2xl font-bold text-primary">
                  {formatPrice(quote.pricePerArroba)}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Referência: {formatReferenceDate(quote.referenceDate)} ·
                  Região: {quote.region}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Fonte: {workspace.slaughterhouse.name} · Versão{" "}
                  {quote.version}
                </p>
                <Link
                  href={`/frigorifico/cotacoes/${quote.seriesId}`}
                  className="mt-4 inline-block font-semibold text-primary underline underline-offset-4"
                  aria-label={`Atualizar e ver histórico de ${quote.category}, referência ${formatReferenceDate(quote.referenceDate)}`}
                >
                  Atualizar e ver histórico
                </Link>
              </li>
            ))}
          </ul>
        )}
        {workspace.total > QUOTES_PAGE_SIZE && (
          <nav
            aria-label="Paginação de cotações"
            className="mt-6 flex flex-wrap gap-6 text-sm"
          >
            {workspace.page > 1 && (
              <Link
                className="font-semibold text-primary underline"
                href={`/frigorifico?pagina=${workspace.page - 1}`}
              >
                Anterior
              </Link>
            )}
            <span>Página {workspace.page}</span>
            {workspace.page * QUOTES_PAGE_SIZE < workspace.total && (
              <Link
                className="font-semibold text-primary underline"
                href={`/frigorifico?pagina=${workspace.page + 1}`}
              >
                Próxima
              </Link>
            )}
          </nav>
        )}
      </section>
    </PrivateArea>
  );
}
