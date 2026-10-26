import Link from "next/link";

import { requireRole } from "@/features/auth/session";
import { createRegionAction } from "@/features/slaughterhouses/actions";
import {
  Feedback,
  type ManagementSearch,
} from "@/features/slaughterhouses/feedback";
import { ManagerShell } from "@/features/slaughterhouses/manager-shell";
import { listRegions } from "@/features/slaughterhouses/service";
import { SubmitButton } from "@/features/slaughterhouses/submit-button";
import { getDatabase } from "@/lib/db";

export default async function RegionsPage({
  searchParams,
}: {
  searchParams: Promise<ManagementSearch>;
}) {
  const user = await requireRole("MANAGER");
  const regions = await listRegions(getDatabase(), user.id);
  const search = await searchParams;
  return (
    <ManagerShell user={user} title="Regiões">
      <p className="mt-4 text-muted">
        Cadastre as regiões usadas pelos frigoríficos. Os nomes ficam
        disponíveis ao criar ou editar um cadastro.
      </p>
      <Feedback search={search} />
      <section
        className="mt-8 max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8"
        aria-labelledby="new-region-title"
      >
        <h2 id="new-region-title" className="text-2xl font-bold">
          Cadastrar região
        </h2>
        <form action={createRegionAction} className="mt-6 space-y-6">
          <div>
            <label
              htmlFor="region-name"
              className="block text-sm font-semibold"
            >
              Nome da região
            </label>
            <input
              id="region-name"
              name="name"
              required
              maxLength={120}
              aria-describedby="region-name-hint"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base"
            />
            <p id="region-name-hint" className="mt-2 text-sm text-muted">
              Até 120 caracteres. Cada região deve ter um nome único.
            </p>
          </div>
          <SubmitButton>Cadastrar região</SubmitButton>
        </form>
      </section>
      <section className="mt-8 max-w-2xl" aria-labelledby="region-list-title">
        <h2 id="region-list-title" className="text-2xl font-bold">
          Regiões cadastradas
        </h2>
        {regions.length === 0 ? (
          <p className="mt-4 text-muted">Nenhuma região cadastrada.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface px-6">
            {regions.map((region) => (
              <li className="py-4" key={region.id}>
                {region.name}
              </li>
            ))}
          </ul>
        )}
      </section>
      <Link
        href="/gestor/frigorificos/novo"
        className="mt-8 inline-block font-semibold text-primary underline underline-offset-4"
      >
        Cadastrar frigorífico
      </Link>
    </ManagerShell>
  );
}
