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
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-6 py-6">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground"
          >
            C
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight">Cotaroba</p>
            <p className="text-sm text-muted">Observatório pecuário da Bahia</p>
          </div>
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
          Um espaço público de consulta a indicadores consolidados da pecuária
          baiana, com fonte e data de referência para apoiar suas decisões.
        </p>

        <section
          aria-labelledby="regional-indicators-title"
          className="mt-12 rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <h2
            id="regional-indicators-title"
            className="text-xl font-semibold sm:text-2xl"
          >
            Indicadores regionais
          </h2>
          <div className="mt-6 rounded-xl bg-secondary p-6">
            <p className="font-semibold">Dados insuficientes</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Ainda não há indicadores disponíveis para consulta. Os dados serão
              publicados após consolidação e validação da base regional.
            </p>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            A consulta pública apresentará apenas indicadores regionais
            consolidados, preservando a identidade e as cotações individuais dos
            frigoríficos.
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
