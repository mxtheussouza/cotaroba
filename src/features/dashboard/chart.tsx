"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";

import { formatExternalValue } from "@/features/external-data/components";
import { formatReferenceDate } from "@/features/quotes/format";

export type ChartPoint = { date: string; value: string; periodStart?: string };

export function TimeSeriesChart({
  title,
  points,
  unit,
  source,
  variant = "local",
  kind = "line",
}: {
  title: string;
  points: ChartPoint[];
  unit: string;
  source: string;
  variant?: "local" | "context";
  kind?: "line" | "bar";
}) {
  const id = useId();
  const figure = useRef<HTMLElement>(null);
  useEffect(() => {
    figure.current?.setAttribute("data-interactive", "");
  }, []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selected =
    points.find((point) => point.date === selectedDate) ?? points.at(-1);
  const selectedIndex = selected ? points.indexOf(selected) : 0;
  const describe = (point: ChartPoint) =>
    `${point.periodStart && point.periodStart !== point.date ? `${formatReferenceDate(point.periodStart)} a ` : ""}${formatReferenceDate(point.date)}: ${formatExternalValue(point.value)} ${unit}`;
  function explore(event: PointerEvent<SVGSVGElement>, width: number) {
    if (!points.length) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const cursor = event.currentTarget.createSVGPoint();
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    const { x } = cursor.matrixTransform(matrix.inverse());
    const nearest = points.reduce((best, point) =>
      Math.abs(position(point, width).x - x) <
      Math.abs(position(best, width).x - x)
        ? point
        : best,
    );
    setSelectedDate(nearest.date);
  }
  const values = points.map((point) => Number(point.value));
  const maximum = Math.max(...values, 0);
  const ceiling = maximum > 0 ? maximum * 1.1 : 1;
  const first = points.length ? Date.parse(`${points[0].date}T00:00:00Z`) : 0;
  const last = points.length
    ? Date.parse(`${points.at(-1)!.date}T00:00:00Z`)
    : 0;
  const position = (point: ChartPoint, width: number) => ({
    x:
      last === first
        ? width / 2
        : 72 +
          ((Date.parse(`${point.date}T00:00:00Z`) - first) / (last - first)) *
            (width - 112),
    y: 208 - (Number(point.value) / ceiling) * 172,
  });
  return (
    <figure
      ref={figure}
      className="chart min-w-0 rounded-xl border border-border bg-surface p-4"
    >
      <figcaption className="text-base font-bold">{title}</figcaption>
      <p className="mt-2 text-sm text-muted">
        Unidade: {unit} · Fonte: {source}
      </p>
      {points.length === 0 ? (
        <p className="mt-6 font-semibold">Dados insuficientes</p>
      ) : (
        <>
          <output
            id={`${id}-value`}
            className="mt-3 block rounded-lg bg-secondary px-3 py-2 text-sm font-semibold"
            aria-live="polite"
            aria-atomic="true"
          >
            {selected && describe(selected)}
          </output>
          {[360, 600, 900].map((width) => (
            <svg
              key={width}
              role="img"
              aria-label={`${title}. ${points.length} observações; valores disponíveis na tabela abaixo.`}
              viewBox={`0 0 ${width} 260`}
              onPointerMove={(event) => explore(event, width)}
              onPointerDown={(event) => explore(event, width)}
              className={
                width === 360
                  ? `mt-3 h-auto w-full sm:hidden ${variant === "local" ? "text-primary" : "text-muted"}`
                  : `mt-3 hidden h-[240px] w-full ${width === 600 ? "sm:block lg:hidden" : "lg:block"} ${variant === "local" ? "text-primary" : "text-muted"}`
              }
            >
              <text
                x="12"
                y="22"
                fontSize={width === 360 ? 18 : 17}
                fill="currentColor"
              >
                {unit}
              </text>
              {[0, 0.5, 1].map((fraction) => (
                <g key={fraction}>
                  <line
                    x1="72"
                    x2={width - 40}
                    y1={208 - fraction * 172}
                    y2={208 - fraction * 172}
                    stroke="currentColor"
                    strokeOpacity="0.18"
                  />
                  <text
                    x="65"
                    y={213 - fraction * 172}
                    textAnchor="end"
                    fontSize={width === 360 ? 18 : 17}
                    fill="currentColor"
                  >
                    {new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(ceiling * fraction)}
                  </text>
                </g>
              ))}
              {points.length > 1 && kind === "line" && (
                <polyline
                  points={points
                    .map((point) => {
                      const { x, y } = position(point, width);
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={variant === "context" ? "7 4" : undefined}
                />
              )}
              {points.map((point) => {
                const { x, y } = position(point, width);
                return (
                  <g key={point.date}>
                    <title>{describe(point)}</title>
                    {kind === "bar" ? (
                      <rect
                        x={x - Math.min(18, (width - 112) / points.length / 3)}
                        y={y}
                        width={Math.min(
                          36,
                          (((width - 112) / points.length) * 2) / 3,
                        )}
                        height={208 - y}
                        fill="currentColor"
                        opacity={point === selected ? 1 : 0.65}
                      />
                    ) : variant === "context" ? (
                      <rect
                        x={x - 4}
                        y={y - 4}
                        width="8"
                        height="8"
                        fill="currentColor"
                      />
                    ) : (
                      <circle cx={x} cy={y} r="4" fill="currentColor" />
                    )}
                    {point === selected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
              <text
                x="72"
                y="241"
                fontSize={width === 360 ? 18 : 17}
                fill="currentColor"
              >
                {formatReferenceDate(points[0].date)}
              </text>
              {points.length > 1 && (
                <text
                  x={width - 40}
                  y="241"
                  textAnchor="end"
                  fontSize={width === 360 ? 18 : 17}
                  fill="currentColor"
                >
                  {formatReferenceDate(points.at(-1)!.date)}
                </text>
              )}
            </svg>
          ))}
          {points.length > 1 && (
            <label className="chart-explorer mt-2 text-sm text-muted">
              Explorar observações
              <input
                type="range"
                min="0"
                max={points.length - 1}
                value={selectedIndex}
                aria-label={`Explorar observações de ${title}`}
                onChange={(event) =>
                  setSelectedDate(points[Number(event.target.value)].date)
                }
                aria-valuetext={
                  selected ? describe(selected) : "Sem observações"
                }
                aria-describedby={`${id}-value`}
                className="mt-1 block h-6 w-full accent-primary"
              />
            </label>
          )}
          <p className="mt-2 text-sm text-muted">
            {kind === "bar"
              ? "▮ Barras: total observado por período."
              : variant === "local"
                ? "● Linha contínua: cotação do frigorífico."
                : "■ Linha tracejada: referência externa."}{" "}
            Eixo começa em zero.{" "}
            {points.length === 1 &&
              "Uma única observação não define tendência."}
          </p>
          <details className="mt-2 text-sm text-muted">
            <summary className="cursor-pointer">Como ler e explorar</summary>
            Com JavaScript, passe o ponteiro ou toque no gráfico para consultar
            uma referência. No controle de observações, use as setas do teclado.
            Datas proporcionais; a linha apenas conecta registros, sem preencher
            datas sem dados. Tabela completa disponível abaixo.
          </details>
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
