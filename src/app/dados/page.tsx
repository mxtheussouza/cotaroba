import Link from "next/link";

import {
  ExternalCards,
  ExternalPagination,
  externalPage,
  linkClass,
  type ExternalSearch,
} from "@/features/external-data/components";
import { listPublicExternalData } from "@/features/external-data/service";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExternalDataPage({
  searchParams,
}: {
  searchParams: Promise<ExternalSearch>;
}) {
  const board = await listPublicExternalData(
    getDatabase(),
    externalPage(await searchParams),
  );
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only rounded-xl bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-border bg-surface">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-4 px-6 py-6"
        >
          <Link href="/" className="text-xl font-bold">
            Cotaroba
          </Link>
          <Link href="/cotacoes" className={linkClass}>
            Cotações
          </Link>
          <Link href="/login" className={linkClass}>
            Entrar
          </Link>
        </nav>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12 [overflow-wrap:anywhere]"
      >
        <h1 className="text-3xl font-bold sm:text-4xl">Dados externos</h1>
        <p className="mt-4 max-w-3xl text-muted">
          Consulte a última referência armazenada de cada série. Dólar, chuva e
          dados de produção ajudam a contextualizar o mercado; não são previsões
          de preço nem informações em tempo real.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-muted">
          As datas indicam o período observado e a coleta. A sinalização de
          defasagem considera o fim do período de referência e o prazo de
          atualização da série. Falhas de coleta preservam os registros
          anteriores.
        </p>
        <section className="mt-10" aria-labelledby="data-title">
          <h2 id="data-title" className="text-2xl font-bold">
            Referências disponíveis
          </h2>
          <ExternalCards items={board.items} />
          <ExternalPagination
            path="/dados"
            page={board.page}
            total={board.total}
          />
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
