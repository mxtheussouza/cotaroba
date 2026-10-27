import { requireRole } from "@/features/auth/session";
import {
  createSeriesAction,
  synchronizeAction,
} from "@/features/external-data/actions";
import {
  ExternalCards,
  ExternalFeedback,
  ExternalPagination,
  externalPage,
  fieldClass,
  formatCollectedAt,
  type ExternalSearch,
} from "@/features/external-data/components";
import { connectorDefinitions } from "@/features/external-data/connectors";
import { frequencies, metrics } from "@/features/external-data/schema";
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
      <section className="mt-8" aria-labelledby="sources-title">
        <h2 id="sources-title" className="text-2xl font-bold">
          Fontes automáticas
        </h2>
        <p className="mt-2 text-sm text-muted">
          A coleta é feita ao clicar em Sincronizar. Falhas preservam o
          histórico. O dólar consulta os últimos 14 dias; abates, os últimos
          quatro trimestres divulgados.
        </p>
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
      <section
        className="mt-10 max-w-3xl rounded-xl border border-border bg-surface p-6 sm:p-8"
        aria-labelledby="manual-title"
      >
        <h2 id="manual-title" className="text-2xl font-bold">
          Cadastrar série manual
        </h2>
        <p className="mt-3 text-sm text-muted">
          Use uma fonte que permita a publicação. Informe a localidade e a
          frequência exatas; milho e soja usam saca de 60 kg. Nome, unidade e
          fonte ficam fixos para preservar o significado do histórico. Para
          outra fonte ou unidade, crie outra série.
        </p>
        <form
          action={createSeriesAction}
          className="mt-6 grid gap-6 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label htmlFor="series-name" className="text-sm font-semibold">
              Nome da série
            </label>
            <input
              id="series-name"
              name="name"
              required
              maxLength={160}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="metric" className="text-sm font-semibold">
              Informação e unidade
            </label>
            <select id="metric" name="metric" className={fieldClass}>
              {Object.entries(metrics).map(([key, metric]) => (
                <option key={key} value={key}>
                  {metric.label} ({metric.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="frequency" className="text-sm font-semibold">
              Frequência
            </label>
            <select id="frequency" name="frequency" className={fieldClass}>
              {Object.entries(frequencies).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="geography" className="text-sm font-semibold">
              Região ou localidade da fonte
            </label>
            <input
              id="geography"
              name="geography"
              required
              maxLength={160}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="source-name" className="text-sm font-semibold">
              Nome da fonte
            </label>
            <input
              id="source-name"
              name="sourceName"
              required
              maxLength={160}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="source-url" className="text-sm font-semibold">
              Link HTTPS da fonte
            </label>
            <input
              id="source-url"
              name="sourceUrl"
              type="url"
              required
              maxLength={1000}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="stale-days" className="text-sm font-semibold">
              Prazo de atualização (dias após a referência)
            </label>
            <input
              id="stale-days"
              name="staleAfterDays"
              type="number"
              required
              min={1}
              max={730}
              defaultValue={7}
              className={fieldClass}
            />
            <p className="mt-2 text-sm text-muted">
              Após esse prazo, a consulta sinaliza “Dado defasado”. Considere a
              frequência e o atraso de divulgação da fonte.
            </p>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>Cadastrar série</SubmitButton>
          </div>
        </form>
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
