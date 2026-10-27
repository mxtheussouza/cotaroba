import Link from "next/link";
import type { ReactNode } from "react";

export function PublicShell({
  title,
  description,
  children,
  compact = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only rounded-xl bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary"
          >
            Cotaroba
          </Link>
          <nav
            aria-label="Navegação principal"
            className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-primary"
          >
            <Link href="/painel" className="underline underline-offset-4">
              Painel
            </Link>
            <Link href="/cotacoes" className="underline underline-offset-4">
              Cotações
            </Link>
            <Link href="/dados" className="underline underline-offset-4">
              Dados externos
            </Link>
            <Link href="/simulador" className="underline underline-offset-4">
              Simulador
            </Link>
            <Link href="/login" className="underline underline-offset-4">
              Entrar
            </Link>
          </nav>
        </div>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className={`mx-auto w-full max-w-[1200px] flex-1 px-4 [overflow-wrap:anywhere] sm:px-6 ${compact ? "py-5 sm:py-6" : "py-10 sm:py-12"}`}
      >
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          Mercado pecuário · Bahia
        </p>
        <h1
          className={`${compact ? "mt-2 text-2xl sm:text-3xl" : "mt-4 text-3xl sm:text-4xl"} font-bold tracking-tight`}
        >
          {title}
        </h1>
        <p
          className={`${compact ? "mt-2 text-sm" : "mt-4"} max-w-3xl leading-relaxed text-muted`}
        >
          {description}
        </p>
        {children}
      </main>
      <footer className="border-t border-border">
        <p className="mx-auto max-w-[1200px] px-6 py-6 text-sm text-muted">
          Cotaroba · Observatório pecuário da Bahia
        </p>
      </footer>
    </>
  );
}
