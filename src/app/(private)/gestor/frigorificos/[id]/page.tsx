import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/features/auth/session";
import {
  createAccessAction,
  resetAccessPasswordAction,
  updateAccessAction,
  updateSlaughterhouseAction,
} from "@/features/slaughterhouses/actions";
import {
  Feedback,
  type ManagementSearch,
} from "@/features/slaughterhouses/feedback";
import {
  AccessForm,
  PasswordField,
  SlaughterhouseFields,
} from "@/features/slaughterhouses/forms";
import { ManagerShell } from "@/features/slaughterhouses/manager-shell";
import { idSchema } from "@/features/slaughterhouses/schema";
import {
  getSlaughterhouse,
  listRegions,
  ManagementError,
} from "@/features/slaughterhouses/service";
import { SubmitButton } from "@/features/slaughterhouses/submit-button";
import { getDatabase } from "@/lib/db";

export default async function SlaughterhouseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ManagementSearch>;
}) {
  const user = await requireRole("MANAGER");
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const database = getDatabase();
  let record;
  try {
    record = await getSlaughterhouse(database, user.id, id);
  } catch (error) {
    if (error instanceof ManagementError) notFound();
    throw error;
  }
  const regions = await listRegions(database, user.id);
  return (
    <ManagerShell user={user} title={record.name}>
      <Feedback search={await searchParams} />
      <section
        className="mt-8 max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8"
        aria-labelledby="company-data-title"
      >
        <h2 id="company-data-title" className="text-2xl font-bold">
          Dados do frigorífico
        </h2>
        <form
          action={updateSlaughterhouseAction.bind(null, id)}
          className="mt-6 space-y-6"
        >
          <SlaughterhouseFields regions={regions} record={record} />
          <p className="text-sm text-muted">
            Salvar encerra as sessões dos acessos vinculados. Alterar a região
            preserva a região dos registros históricos.
          </p>
          <SubmitButton>Salvar frigorífico</SubmitButton>
        </form>
      </section>
      <section className="mt-10" aria-labelledby="accesses-title">
        <h2 id="accesses-title" className="text-2xl font-bold">
          Acessos do frigorífico
        </h2>
        <p className="mt-2 text-muted">
          Cada responsável entra com seu próprio e-mail e senha, sempre
          vinculado a este frigorífico.
        </p>
        {!record.isActive && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-border bg-secondary p-4"
          >
            Frigorífico inativo: todos os seus acessos estão impedidos de
            entrar, mesmo que estejam marcados como ativos.
          </p>
        )}
        {record.users.length === 0 && (
          <p className="mt-6 text-muted">Nenhum acesso cadastrado.</p>
        )}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          {record.users.map((access) => (
            <article
              key={access.id}
              className="rounded-xl border border-border bg-surface p-6"
              aria-label={`Acesso de ${access.name}`}
            >
              <h3 className="text-xl font-bold">{access.name}</h3>
              <p className="mt-2 mb-6 text-sm text-muted">
                {access.isActive ? "Acesso ativo" : "Acesso inativo"}
              </p>
              <AccessForm
                prefix={access.id}
                access={access}
                action={updateAccessAction.bind(null, id, access.id)}
              />
              <details className="mt-8 border-t border-border pt-6">
                <summary className="cursor-pointer font-semibold text-primary">
                  Redefinir senha de {access.name}
                </summary>
                <form
                  action={resetAccessPasswordAction.bind(null, id, access.id)}
                  className="mt-4 space-y-4"
                >
                  <PasswordField id={`${access.id}-password`} />
                  <p className="text-sm text-muted">
                    A troca encerra todas as sessões deste acesso.
                  </p>
                  <SubmitButton>Redefinir senha</SubmitButton>
                </form>
              </details>
            </article>
          ))}
        </div>
      </section>
      {record.isActive && (
        <section
          className="mt-10 max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8"
          aria-labelledby="new-access-title"
        >
          <h2 id="new-access-title" className="mb-6 text-2xl font-bold">
            Criar acesso
          </h2>
          <AccessForm
            prefix="new-access"
            action={createAccessAction.bind(null, id)}
          />
        </section>
      )}
      <Link
        href="/gestor"
        className="mt-8 inline-block font-semibold text-primary underline"
      >
        Voltar aos frigoríficos
      </Link>
    </ManagerShell>
  );
}
