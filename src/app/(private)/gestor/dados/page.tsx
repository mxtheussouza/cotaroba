import { requireRole } from "@/features/auth/session";
import { synchronizeAction } from "@/features/external-data/actions";
import {
  ExternalCards,
  ExternalFeedback,
  ExternalPagination,
  externalPage,
  formatCollectedAt,
  type ExternalSearch,
} from "@/features/external-data/components";
import { connectorDefinitions } from "@/features/external-data/connectors";
import { ManualSeriesForm } from "@/features/external-data/series-form";
import { listManagerExternalData } from "@/features/external-data/service";
import { ManagerShell } from "@/features/slaughterhouses/manager-shell";
import { SubmitButton } from "@/features/slaughterhouses/submit-button";
import { getDatabase } from "@/lib/db";

export default async function ExternalManagerPage({
  searchParams,
}: {
  searchParams: Promise<ExternalSearch>;
}) {
  const user = await requireRole("MANAGER");
  const search = await searchParams;
  const board = await listManagerExternalData(
    getDatabase(),
    user.id,
    externalPage(search),
  );
  return (
    <ManagerShell user={user} title="Dados externos">
      <p className="mt-4 max-w-3xl text-muted">
        Sincronize fontes públicas ou cadastre séries manuais. Cada série mantém
        sua fonte e seu histórico; uma fonte automática não sobrescreve uma
        série manual.
      </p>
      <ExternalFeedback search={search} />
      <ManualSeriesForm
        key="manual-series-form"
        errorCode={typeof search.erro === "string" ? search.erro : undefined}
      />
      <section className="mt-8" aria-labelledby="sources-title">
        <h2 id="sources-title" className="text-2xl font-bold">
          Fontes automáticas
        </h2>
        <details className="mt-2 text-sm text-muted">
          <summary className="cursor-pointer font-semibold text-primary">
            Sobre a sincronização
          </summary>
          A coleta é feita ao clicar em Sincronizar. Falhas preservam o
          histórico. O dólar consulta os últimos 14 dias; abates, os últimos
          quatro trimestres divulgados.
        </details>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {Object.entries(connectorDefinitions).map(
            ([connector, definition]) => {
              const sync = board.syncs.find(
                (item) => item.connector === connector,
              );
              return (
                <li
                  key={connector}
                  className="rounded-xl border border-border bg-surface p-6"
                >
                  <h3 className="text-xl font-bold">{definition.name}</h3>
                  <p className="mt-2 text-sm text-muted">
                    {sync
                      ? `Última tentativa: ${formatCollectedAt(sync.attemptedAt)} · ${sync.status === "SUCCESS" ? "Concluída" : sync.status === "RUNNING" ? "Em andamento; se interrompida, tente novamente após um minuto" : "Falhou; histórico preservado"}`
                      : "Nenhuma sincronização realizada."}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Último sucesso:{" "}
                    {sync?.succeededAt
                      ? formatCollectedAt(sync.succeededAt)
                      : "ainda não registrado"}
                  </p>
                  <form action={synchronizeAction} className="mt-4">
                    <input type="hidden" name="connector" value={connector} />
                    <SubmitButton>
                      Sincronizar{" "}
                      {connector === "BCB_PTAX" ? "dólar" : "abates"}
                    </SubmitButton>
                  </form>
                </li>
              );
            },
          )}
        </ul>
      </section>
      <section className="mt-10" aria-labelledby="series-title">
        <h2 id="series-title" className="text-2xl font-bold">
          Séries cadastradas
        </h2>
        <ExternalCards items={board.items} manager />
        <ExternalPagination
          path="/gestor/dados"
          page={board.page}
          total={board.total}
        />
      </section>
    </ManagerShell>
  );
}
