import Link from "next/link";

import { formatReferenceDate } from "@/features/quotes/format";

import { frequencies, metrics } from "./schema";
import type { listPublicExternalData } from "./service";

export type ExternalSearch = Record<string, string | string[] | undefined>;
export function externalPage(search: ExternalSearch) {
  return Number(typeof search.pagina === "string" ? search.pagina : 1);
}
export const fieldClass =
  "mt-2 w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-3 text-base";
export const linkClass =
  "font-semibold text-primary underline underline-offset-4";

export function formatExternalValue(value: string) {
  const [integer, fraction] = value.split(".");
  const decimals = fraction?.replace(/0+$/, "");
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${decimals ? `,${decimals}` : ""}`;
}
export function formatCollectedAt(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bahia",
  }).format(new Date(value));
}

export function ExternalFeedback({ search }: { search: ExternalSearch }) {
  const errors: Record<string, string> = {
    dados:
      "Confira os campos e preencha novamente. Use até quatro casas decimais, sem milhar. O período deve estar encerrado e corresponder à frequência da série; preços devem ser positivos e abates devem ser inteiros.",
    duplicada:
      "Já existe uma série com este nome. Escolha outro nome ou utilize a série existente.",
    serie:
      "Selecione uma série manual existente. Séries automáticas são atualizadas pela sincronização.",
    limite:
      "Aguarde um minuto antes de tentar novamente. Cada fonte aceita uma sincronização por minuto.",
    fonte:
      "A fonte está indisponível. Os dados já armazenados foram preservados. Tente novamente mais tarde.",
    formato: "A fonte retornou dados inesperados. O histórico foi preservado.",
    "sem-dados":
      "A fonte não retornou dados publicáveis. O histórico foi preservado.",
    indisponivel:
      "Não foi possível concluir a operação. Tente novamente em instantes.",
  };
  const notices: Record<string, string> = {
    serie: "Série criada. Cadastre o primeiro registro abaixo.",
    salvo: "Registro salvo. As versões anteriores foram preservadas.",
    repetido:
      "Este registro já é a versão atual. Nenhuma duplicação foi criada.",
    sincronizado: "Sincronização concluída. Novos registros foram armazenados.",
    "sem-alteracao": "Sincronização concluída. Não houve alteração nos dados.",
  };
  const error =
    typeof search.erro === "string" && Object.hasOwn(errors, search.erro)
      ? errors[search.erro]
      : null;
  const notice =
    typeof search.aviso === "string" && Object.hasOwn(notices, search.aviso)
      ? notices[search.aviso]
      : null;
  return (
    <>
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-danger bg-surface p-4 text-danger"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-border bg-secondary p-4"
        >
          {notice}
        </p>
      )}
    </>
  );
}

export function ExternalCards({
  items,
  manager = false,
}: {
  items: Awaited<ReturnType<typeof listPublicExternalData>>["items"];
  manager?: boolean;
}) {
  return items.length === 0 ? (
    <p className="mt-6 rounded-xl border border-border bg-surface p-6">
      Dados insuficientes. Nenhuma série cadastrada.
    </p>
  ) : (
    <ul className="mt-6 grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="min-w-0 rounded-xl border border-border bg-surface p-6 [overflow-wrap:anywhere]"
        >
          <h3 className="text-xl font-bold">{item.name}</h3>
          <p className="mt-2 text-sm text-muted">
            {metrics[item.metric].label} · {item.geography} ·{" "}
            {frequencies[item.frequency]}
          </p>
          {item.observation ? (
            <>
              <p className="mt-4 text-2xl font-bold text-primary">
                {formatExternalValue(item.observation.value)}{" "}
                <span className="text-base font-semibold">{item.unit}</span>
              </p>
              <p className="mt-3 text-sm">
                Referência: {formatReferenceDate(item.observation.periodStart)}
                {item.observation.periodEnd !== item.observation.periodStart
                  ? ` a ${formatReferenceDate(item.observation.periodEnd)}`
                  : ""}
              </p>
              <p className="mt-2 text-sm text-muted">
                {item.observation.origin === "API"
                  ? "Coleta automática"
                  : "Entrada manual"}{" "}
                · {formatCollectedAt(item.observation.collectedAt)} (Bahia)
              </p>
              {item.observation.validUntil && (
                <p className="mt-2 text-sm">
                  Validade informada:{" "}
                  {formatReferenceDate(item.observation.validUntil)}
                </p>
              )}
              <p className="mt-2 text-sm font-semibold">
                {item.freshness === "expired"
                  ? "Validade encerrada"
                  : item.freshness === "stale"
                    ? "Dado defasado"
                    : "Dentro do prazo de atualização"}
              </p>
            </>
          ) : (
            <p className="mt-4 font-semibold">Dados insuficientes</p>
          )}
          <p className="mt-4 text-sm">
            Fonte:{" "}
            <a href={item.sourceUrl} className={linkClass} rel="noreferrer">
              {item.sourceName}
            </a>
          </p>
          {item.connector === "BCB_PTAX" && (
            <p className="mt-2 text-sm text-muted">
              Dados disponibilizados pelo BCB sob{" "}
              <a
                href="https://opendatacommons.org/licenses/odbl/1-0/"
                className={linkClass}
              >
                licença ODbL
              </a>
              .
            </p>
          )}
          {manager && (
            <Link
              href={`/gestor/dados/${item.id}`}
              className={`${linkClass} mt-4 inline-block`}
            >
              {item.connector
                ? "Ver histórico"
                : "Cadastrar registro e ver histórico"}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ExternalPagination({
  path,
  page,
  total,
}: {
  path: string;
  page: number;
  total: number;
}) {
  return total > 20 || page > 1 ? (
    <nav
      aria-label="Paginação dos dados"
      className="mt-6 flex flex-wrap gap-6 text-sm"
    >
      {page > 1 && (
        <Link className={linkClass} href={`${path}?pagina=${page - 1}`}>
          Anterior
        </Link>
      )}
      <span>Página {page}</span>
      {page * 20 < total && (
        <Link className={linkClass} href={`${path}?pagina=${page + 1}`}>
          Próxima
        </Link>
      )}
    </nav>
  ) : null;
}
