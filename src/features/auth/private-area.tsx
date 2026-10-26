import Link from "next/link";

import type { SessionUser } from "./authorization";
import { LogoutButton } from "./logout-button";

export function PrivateArea({
  user,
  title,
}: {
  user: SessionUser;
  title: string;
}) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-6 border-b border-border pb-6">
        <Link href="/" className="text-xl font-bold text-primary">
          Cotaroba
        </Link>
        <LogoutButton />
      </header>
      <section className="mt-8 rounded-xl border border-border bg-surface p-6 [overflow-wrap:anywhere] sm:p-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-6 leading-relaxed">Olá, {user.name}.</p>
        <p className="mt-2 leading-relaxed text-muted">
          {user.role === "MANAGER"
            ? "Você está na área de gestão do Cotaroba."
            : `Seu acesso está vinculado a ${user.slaughterhouse?.name}.`}
        </p>
        <p className="mt-6 text-sm text-muted">
          Acesso autenticado ·{" "}
          {user.role === "MANAGER" ? "Gestor" : "Frigorífico"}
        </p>
      </section>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-semibold text-primary underline underline-offset-4"
      >
        Consultar portal público
      </Link>
    </main>
  );
}
