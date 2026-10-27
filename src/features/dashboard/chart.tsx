import { formatExternalValue } from "@/features/external-data/components";
import { formatReferenceDate } from "@/features/quotes/format";

export type ChartPoint = { date: string; value: string; periodStart?: string };

export function TimeSeriesChart({
  title,
  points,
  unit,
  source,
}: {
  title: string;
  points: ChartPoint[];
  unit: string;
  source: string;
}) {
  const values = points.map((point) => Number(point.value));
  const maximum = Math.max(...values, 0);
  const ceiling = maximum > 0 ? maximum * 1.1 : 1;
  const first = points.length ? Date.parse(`${points[0].date}T00:00:00Z`) : 0;
  const last = points.length
    ? Date.parse(`${points.at(-1)!.date}T00:00:00Z`)
    : 0;
  const position = (point: ChartPoint) => ({
    x:
      last === first
        ? 300
        : 72 +
          ((Date.parse(`${point.date}T00:00:00Z`) - first) / (last - first)) *
            488,
    y: 208 - (Number(point.value) / ceiling) * 172,
  });
  return (
    <figure className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <figcaption className="text-xl font-bold">{title}</figcaption>
      <p className="mt-2 text-sm text-muted">
        Unidade: {unit} · Fonte: {source}
      </p>
      {points.length === 0 ? (
        <p className="mt-6 font-semibold">Dados insuficientes</p>
      ) : (
        <>
          <svg
            role="img"
            aria-label={`${title}. ${points.length} observações; valores disponíveis na tabela abaixo.`}
            viewBox="0 0 600 260"
            className="mt-4 h-auto w-full text-primary"
          >
            <text x="12" y="22" fontSize="17" fill="currentColor">
              {unit}
            </text>
            {[0, 0.5, 1].map((fraction) => (
              <g key={fraction}>
                <line
                  x1="72"
                  x2="560"
                  y1={208 - fraction * 172}
                  y2={208 - fraction * 172}
                  stroke="currentColor"
                  strokeOpacity="0.18"
                />
                <text
                  x="65"
                  y={213 - fraction * 172}
                  textAnchor="end"
                  fontSize="17"
                  fill="currentColor"
                >
                  {new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(ceiling * fraction)}
                </text>
              </g>
            ))}
            {points.length > 1 && (
              <polyline
                points={points
                  .map((point) => {
                    const { x, y } = position(point);
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
            )}
            {points.map((point) => {
              const { x, y } = position(point);
              return (
                <circle
                  key={point.date}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="currentColor"
                >
                  <title>
                    {formatReferenceDate(point.date)}:{" "}
                    {formatExternalValue(point.value)} {unit}
                  </title>
                </circle>
              );
            })}
            <text x="72" y="241" fontSize="17" fill="currentColor">
              {formatReferenceDate(points[0].date)}
            </text>
            {points.length > 1 && (
              <text
                x="560"
                y="241"
                textAnchor="end"
                fontSize="17"
                fill="currentColor"
              >
                {formatReferenceDate(points.at(-1)!.date)}
              </text>
            )}
          </svg>
          <p className="mt-2 text-sm text-muted">
            Eixo vertical começa em zero. Pontos representam observações; a
            linha apenas os conecta, sem preencher datas sem dados.{" "}
            {points.length === 1 &&
              "Uma única observação não define tendência."}
          </p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-primary">
              Ver valores do gráfico
            </summary>
            <table className="mt-4 w-full table-fixed text-left">
              <caption className="sr-only">Valores de {title}</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-2">
                    Referência
                  </th>
                  <th scope="col" className="py-2">
                    Valor ({unit})
                  </th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.date} className="border-b border-border">
                    <th scope="row" className="py-2 pr-2 font-normal">
                      {point.periodStart && point.periodStart !== point.date
                        ? `${formatReferenceDate(point.periodStart)} a `
                        : ""}
                      {formatReferenceDate(point.date)}
                    </th>
                    <td className="py-2">{formatExternalValue(point.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  );
}
