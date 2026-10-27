"use client";

import Link from "next/link";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12">
      <h1 className="text-2xl font-bold">Não foi possível carregar o painel</h1>
      <p role="alert" className="mt-4 text-muted">
        Tente novamente em instantes ou volte à página inicial.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
      >
        Tentar novamente
      </button>
      <Link
        href="/"
        className="ml-6 inline-block font-semibold text-primary underline"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
