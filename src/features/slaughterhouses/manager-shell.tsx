import Link from "next/link";
import type { ReactNode } from "react";

import type { SessionUser } from "@/features/auth/authorization";
import { LogoutButton } from "@/features/auth/logout-button";

export function ManagerShell({
  user,
  title,
  children,
}: {
  user: SessionUser;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 [overflow-wrap:anywhere] sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <Link href="/" className="text-xl font-bold text-primary">
          Cotaroba
        </Link>
        <LogoutButton />
      </header>
      <nav
        aria-label="Área de gestão"
        className="mt-6 flex flex-wrap gap-6 text-sm font-semibold text-primary"
      >
        <Link href="/gestor" className="underline underline-offset-4">
          Frigoríficos
        </Link>
        <Link href="/gestor/regioes" className="underline underline-offset-4">
          Regiões
        </Link>
        <Link
          href="/gestor/categorias"
          className="underline underline-offset-4"
        >
          Categorias
        </Link>
        <Link href="/gestor/dados" className="underline underline-offset-4">
          Dados externos
        </Link>
        <Link href="/" className="underline underline-offset-4">
          Portal público
        </Link>
      </nav>
      <div className="mt-8">
        <p className="text-sm text-muted">Gestor · {user.name}</p>
        <h1 className="mt-2 text-3xl font-bold">{title}</h1>
      </div>
      {children}
    </main>
  );
}
