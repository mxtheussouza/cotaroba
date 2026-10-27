import { civilDate } from "@/features/external-data/schema";
import { todayInBahia } from "@/features/quotes/format";

export type DashboardSearch = Record<string, string | string[] | undefined>;
export const dashboardViews = [
  { id: "precos", label: "Preços" },
  { id: "evolucao", label: "Evolução" },
  { id: "contexto", label: "Contexto" },
  { id: "troca", label: "Relação de troca" },
] as const;
export type DashboardView = (typeof dashboardViews)[number]["id"];
export function dashboardView(value: string | null | undefined): DashboardView {
  return dashboardViews.find((view) => view.id === value)?.id ?? "precos";
}
export function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function dashboardPeriod(search: DashboardSearch, now = new Date()) {
  const today = todayInBahia(now);
  const defaultStart = new Date(`${today}T00:00:00Z`);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 89);
  const fallback = {
    start: defaultStart.toISOString().slice(0, 10),
    end: today,
  };
  const start = single(search.inicio);
  const end = single(search.fim);
  if (!start && !end) return { ...fallback, error: null };
  if (!civilDate.safeParse(start).success || !civilDate.safeParse(end).success)
    return { ...fallback, error: "Informe datas válidas para o período." };
  const days =
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
    86_400_000;
  if (days < 0 || days > 365 || end! > today)
    return {
      ...fallback,
      error:
        "Selecione até 366 dias, com início anterior ou igual ao fim e sem datas futuras.",
    };
  return { start: start!, end: end!, error: null };
}
