import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/features/auth/session";
import {
  ExternalFeedback,
  ExternalPagination,
  externalPage,
  formatCollectedAt,
  formatExternalValue,
  linkClass,
  type ExternalSearch,
} from "@/features/external-data/components";
import { ObservationForm } from "@/features/external-data/observation-form";
import { frequencies, metrics } from "@/features/external-data/schema";
import { getExternalHistory } from "@/features/external-data/service";
import { formatReferenceDate, todayInBahia } from "@/features/quotes/format";
import { ManagerShell } from "@/features/slaughterhouses/manager-shell";
import { getDatabase } from "@/lib/db";

export default async function ExternalHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<ExternalSearch>;
}) {
  const user = await requireRole("MANAGER");
  const search = await searchParams;
  const { id } = await params;
  const data = await getExternalHistory(
    getDatabase(),
    user.id,
    id,
    externalPage(search),
  );
  if (!data) notFound();
  const { series, rows } = data;
  return (
    <ManagerShell user={user} title={series.name}>
      <Link href="/gestor/dados" className={`${linkClass} mt-4 inline-block`}>
        Voltar aos dados externos
      </Link>
      <p className="mt-4 text-muted">
        {metrics[series.metric].label} · {series.geography} ·{" "}
        {frequencies[series.frequency]} · {metrics[series.metric].unit}
      </p>
      <p className="mt-2 text-sm">
        Fonte:{" "}
        <a href={series.sourceUrl} className={linkClass} rel="noreferrer">
          {series.sourceName}
        </a>{" "}
        · Prazo de atualização: {series.staleAfterDays} dias após a referência.
      </p>
      <ExternalFeedback
        search={series.connector ? search : { aviso: search.aviso }}
      />
      {!series.connector && (
        <ObservationForm
          seriesId={id}
          metric={series.metric}
          frequency={series.frequency}
          today={todayInBahia()}
          errorCode={typeof search.erro === "string" ? search.erro : undefined}
          notice={typeof search.aviso === "string" ? search.aviso : undefined}
        />
      )}
      <section className="mt-10" aria-labelledby="history-title">
        <h2 id="history-title" className="text-2xl font-bold">
          Histórico de registros
        </h2>
        {rows.length === 0 ? (
          <p className="mt-4 text-muted">Nenhum registro nesta página.</p>
        ) : (
          <ol className="mt-6 space-y-4">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-surface p-6 [overflow-wrap:anywhere]"
              >
                <p className="text-xl font-bold">
                  {formatExternalValue(row.value.toFixed(4))}{" "}
                  {metrics[series.metric].unit} · Versão {row.revision}
                </p>
                <p className="mt-2 text-sm">
                  Período:{" "}
                  {formatReferenceDate(
                    row.periodStart.toISOString().slice(0, 10),
                  )}{" "}
                  a{" "}
                  {formatReferenceDate(
                    row.periodEnd.toISOString().slice(0, 10),
                  )}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {row.origin === "API"
                    ? "Coleta automática"
                    : `Entrada manual por ${row.createdBy?.name ?? "gestor"}`}{" "}
                  · {formatCollectedAt(row.collectedAt)} (Bahia)
                </p>
                {row.validUntil && (
                  <p className="mt-2 text-sm">
                    Validade informada:{" "}
                    {formatReferenceDate(
                      row.validUntil.toISOString().slice(0, 10),
                    )}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        <ExternalPagination
          path={`/gestor/dados/${id}`}
          page={data.page}
          total={data.total}
        />
      </section>
    </ManagerShell>
  );
}
