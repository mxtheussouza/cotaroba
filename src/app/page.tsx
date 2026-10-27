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
          <div className="mt-6 rounded-xl bg-secondary p-6">
            <p className="font-semibold">Dados insuficientes</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Outros indicadores estarão disponíveis em etapas futuras. As
              cotações por frigorífico já podem ser consultadas acima.
            </p>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            A página de cotações mostra os preços vigentes informados pelos
            frigoríficos. O histórico de versões e os dados dos responsáveis
            permanecem na área privada.
          </p>
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
