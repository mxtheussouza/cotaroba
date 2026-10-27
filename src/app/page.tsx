import Link from "next/link";

export default function HomePage() {
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
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground"
            >
              C
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight">Cotaroba</p>
              <p className="text-sm text-muted">
                Observatório pecuário da Bahia
              </p>
            </div>
          </div>
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
          Mercado pecuário · Bahia
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
          Informação regional para acompanhar o mercado pecuário.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
          Consulte os preços da arroba informados pelos frigoríficos, com
          região, categoria e data de referência para apoiar suas decisões.
        </p>

        <Link
          href="/painel"
          className="mt-8 mr-4 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Abrir painel
        </Link>
        <Link
          href="/cotacoes"
          className="mt-8 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Consultar cotações
        </Link>

        <section
          aria-labelledby="regional-indicators-title"
          className="mt-12 rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <h2
            id="regional-indicators-title"
            className="text-xl font-semibold sm:text-2xl"
          >
            Indicadores adicionais
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Consulte dólar, dados de produção e referências cadastradas pelo
            gestor, com fonte, unidade e período. Séries sem registros mostram
            “Dados insuficientes”.
          </p>
          <Link
            href="/dados"
            className="mt-4 inline-block font-semibold text-primary underline underline-offset-4"
          >
            Consultar dados externos
          </Link>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            A página de cotações mostra preços vigentes. O painel traz evolução
            por frigorífico e data; correções substituídas e dados pessoais dos
            responsáveis permanecem privados.
          </p>
          <Link
            href="/simulador"
            className="mt-4 inline-block font-semibold text-primary underline underline-offset-4"
          >
            Simular receita e margem
          </Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-[1200px] px-6 py-6 text-sm leading-relaxed text-muted">
          Cotaroba · Observatório pecuário da Bahia
        </p>
      </footer>
    </>
  );
}
