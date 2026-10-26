import Link from "next/link";
import { notFound } from "next/navigation";

import { PrivateArea } from "@/features/auth/private-area";
import { requireRole } from "@/features/auth/session";
import { reviseQuoteAction } from "@/features/quotes/actions";
import {
  QuoteFeedback,
  QuoteForm,
  type QuoteSearch,
} from "@/features/quotes/components";
import { formatPrice, formatReferenceDate } from "@/features/quotes/format";
import { quoteIdSchema } from "@/features/quotes/schema";
import {
  getQuoteHistory,
  QuoteError,
  QUOTES_PAGE_SIZE,
} from "@/features/quotes/service";
import { getDatabase } from "@/lib/db";

export default async function QuoteHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<QuoteSearch>;
}) {
  const user = await requireRole("SLAUGHTERHOUSE");
  const { id } = await params;
  if (!quoteIdSchema.safeParse(id).success) notFound();
  const search = await searchParams;
  let history;
  try {
    history = await getQuoteHistory(
      getDatabase(),
      user.id,
      id,
      Number(search.pagina ?? 1),
    );
  } catch (error) {
    if (error instanceof QuoteError) notFound();
    throw error;
  }
  const { current } = history;
  const recordedAt = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: "America/Bahia",
    }).format(new Date(value));
  return (
    <PrivateArea user={user} title="Histórico da cotação">
      <QuoteFeedback search={search} />
      <section
        className="mt-8 max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8"
        aria-labelledby="edit-quote-title"
      >
        <h2 id="edit-quote-title" className="text-2xl font-bold">
          Atualizar cotação
        </h2>
        <p className="mt-4 text-muted">
          Versão atual: {current.version}. Cada alteração preserva a anterior no
          histórico.
        </p>
        <p className="mt-2 text-sm text-muted">
          Região desta cotação: {current.region}. A região original é preservada
          nas atualizações.
        </p>
        <QuoteForm
          action={reviseQuoteAction.bind(null, id, current.id)}
          categories={history.categories}
          current={current}
        />
      </section>
      <section
        className="mt-10 [overflow-wrap:anywhere]"
        aria-labelledby="versions-title"
      >
        <h2 id="versions-title" className="text-2xl font-bold">
          Versões registradas
        </h2>
        <p className="mt-2 text-muted">
          Da mais recente para a mais antiga. Horários da Bahia.
        </p>
        <ol className="mt-6 space-y-4">
          {history.versions.map((quote) => (
            <li
              key={quote.id}
              className="rounded-xl border border-border bg-surface p-6"
              aria-label={`Versão ${quote.version}`}
            >
              <h3 className="text-lg font-bold">
                Versão {quote.version} · {quote.category}
              </h3>
              <p className="mt-3 text-2xl font-bold text-primary">
                {formatPrice(quote.pricePerArroba)}
              </p>
              <p className="mt-2 text-sm">
                Referência: {formatReferenceDate(quote.referenceDate)} · Região:{" "}
                {quote.region}
              </p>
              <p className="mt-2 text-sm text-muted">
                Registrada por {quote.createdBy} em{" "}
                <time dateTime={quote.createdAt}>
                  {recordedAt(quote.createdAt)}
                </time>
                .
              </p>
            </li>
          ))}
        </ol>
        {history.total > QUOTES_PAGE_SIZE && (
          <nav
            aria-label="Paginação do histórico"
            className="mt-6 flex flex-wrap gap-6 text-sm"
          >
            {history.page > 1 && (
              <Link
                href={`/frigorifico/cotacoes/${id}?pagina=${history.page - 1}`}
                className="font-semibold text-primary underline"
              >
                Anterior
              </Link>
            )}
            <span>Página {history.page}</span>
            {history.page * QUOTES_PAGE_SIZE < history.total && (
              <Link
                href={`/frigorifico/cotacoes/${id}?pagina=${history.page + 1}`}
                className="font-semibold text-primary underline"
              >
                Próxima
              </Link>
            )}
          </nav>
        )}
      </section>
      <Link
        href="/frigorifico"
        className="mt-8 inline-block font-semibold text-primary underline underline-offset-4"
      >
        Voltar às minhas cotações
      </Link>
    </PrivateArea>
  );
}
