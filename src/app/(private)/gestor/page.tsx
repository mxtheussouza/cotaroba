import Link from "next/link";

import { requireRole } from "@/features/auth/session";
import {
  Feedback,
  type ManagementSearch,
} from "@/features/slaughterhouses/feedback";
import { ManagerShell } from "@/features/slaughterhouses/manager-shell";
import {
  listSlaughterhouses,
  PAGE_SIZE,
} from "@/features/slaughterhouses/service";
import { getDatabase } from "@/lib/db";

export default async function ManagerPage({
  searchParams,
}: {
  searchParams: Promise<ManagementSearch>;
}) {
  const user = await requireRole("MANAGER");
  const search = await searchParams;
  const result = await listSlaughterhouses(
    getDatabase(),
    user.id,
    Number(search.pagina ?? 1),
  );
  return (
    <ManagerShell user={user} title="Área do gestor">
      <Feedback search={search} />
      <section className="mt-8" aria-labelledby="companies-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="companies-title" className="text-2xl font-bold">
              Frigoríficos
            </h2>
            <p className="mt-2 text-sm text-muted">
              {result.total} {result.total === 1 ? "cadastro" : "cadastros"}.
              Consulte os cadastros e administre seus acessos.
            </p>
          </div>
          <Link
            href="/gestor/frigorificos/novo"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Cadastrar frigorífico
          </Link>
        </div>
        {result.items.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border bg-surface p-6">
            {result.total === 0
              ? "Nenhum frigorífico cadastrado."
              : "Nenhum cadastro nesta página."}
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {result.items.map((company) => (
              <li
                key={company.id}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <h3 className="text-lg font-bold">{company.name}</h3>
                <p className="mt-2 text-sm text-muted">
                  Região: {company.region.name}
                </p>
                <p className="mt-2 text-sm">
                  {company.isActive ? "Ativo" : "Inativo"} ·{" "}
                  {company._count.users}{" "}
                  {company._count.users === 1 ? "acesso" : "acessos"}
                </p>
                <Link
                  href={`/gestor/frigorificos/${company.id}`}
                  className="mt-4 inline-block font-semibold text-primary underline underline-offset-4"
                  aria-label={`Administrar ${company.name}`}
                >
                  Administrar
                </Link>
              </li>
            ))}
          </ul>
        )}
        {result.total > PAGE_SIZE && (
          <nav
            aria-label="Paginação"
            className="mt-6 flex flex-wrap items-center gap-6 text-sm"
          >
            {result.page > 1 && (
              <Link
                href={`/gestor?pagina=${result.page - 1}`}
                className="font-semibold text-primary underline"
              >
                Anterior
              </Link>
            )}
            <span>Página {result.page}</span>
            {result.page * PAGE_SIZE < result.total && (
              <Link
                href={`/gestor?pagina=${result.page + 1}`}
                className="font-semibold text-primary underline"
              >
                Próxima
              </Link>
            )}
          </nav>
        )}
      </section>
    </ManagerShell>
  );
}
