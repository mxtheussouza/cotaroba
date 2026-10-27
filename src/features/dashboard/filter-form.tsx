"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";

import { dashboardPeriod } from "./filters";

export function DashboardFilterForm({
  children,
  values,
  today,
}: {
  children: ReactNode;
  values: Record<string, string>;
  today: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (pending) return;
    // Normalize server-selected dates/options without remounting controls.
    for (const [name, value] of Object.entries(values)) {
      const control = form.current?.elements.namedItem(name);
      if (
        control instanceof HTMLInputElement ||
        control instanceof HTMLSelectElement
      )
        control.value = value;
    }
  }, [values, pending]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearTimeout(timer.current);
    setValidationMessage(null);
    const query = new URLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget))
      if (typeof value === "string") query.set(name, value);
    query.set(
      "visao",
      form.current?.closest("[data-view]")?.getAttribute("data-view") ??
        "precos",
    );
    const push = event.currentTarget.dataset.navigation === "push";
    delete event.currentTarget.dataset.navigation;
    startTransition(() => {
      if (push) router.push(`/painel?${query}`, { scroll: false });
      else router.replace(`/painel?${query}`, { scroll: false });
    });
  }
  function autoSubmit() {
    if (!form.current) return;
    const data = new FormData(form.current);
    const period = dashboardPeriod(
      {
        inicio: String(data.get("inicio") ?? ""),
        fim: String(data.get("fim") ?? ""),
      },
      new Date(`${today}T15:00:00Z`),
    );
    if (!form.current.checkValidity() || period.error) {
      setValidationMessage(
        period.error ?? "Informe datas válidas para o período.",
      );
      return;
    }
    form.current.requestSubmit();
  }
  function period(days: number) {
    const start = new Date(`${today}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - days + 1);
    const from = form.current?.elements.namedItem("inicio");
    const to = form.current?.elements.namedItem("fim");
    if (from instanceof HTMLInputElement && to instanceof HTMLInputElement) {
      from.value = start.toISOString().slice(0, 10);
      to.value = today;
      form.current?.requestSubmit();
    }
  }
  return (
    <form
      ref={form}
      action="/painel"
      method="get"
      onSubmit={submit}
      onChange={(event) => {
        clearTimeout(timer.current);
        if (event.target instanceof HTMLSelectElement) {
          if (event.target.name === "regiao") {
            const company = form.current?.elements.namedItem("frigorifico");
            if (company instanceof HTMLSelectElement) company.value = "";
          }
          autoSubmit();
        } else {
          timer.current = setTimeout(autoSubmit, 500);
        }
      }}
      className="mt-4 rounded-xl border border-border bg-surface p-4"
      aria-label="Filtros do painel"
      aria-busy={pending}
    >
      <input
        type="hidden"
        name="visao"
        value={search.get("visao") ?? "precos"}
      />
      <div className="dashboard-fields grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div
          data-filter-views="evolucao contexto troca"
          className="flex flex-wrap items-center gap-2 text-sm"
        >
          <span className="text-muted">Período:</span>
          {[30, 90, 365].map((days) => {
            const start = new Date(`${today}T00:00:00Z`);
            start.setUTCDate(start.getUTCDate() - days + 1);
            const query = new URLSearchParams({
              ...values,
              visao: search.get("visao") ?? "precos",
              inicio: start.toISOString().slice(0, 10),
              fim: today,
            });
            return (
              <a
                key={days}
                href={`/painel?${query}`}
                onClick={(event) => {
                  if (
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  period(days);
                }}
                className="rounded-lg border border-border px-3 py-2 font-semibold text-primary hover:bg-secondary"
              >
                {days} dias
              </a>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <p role="status" className="text-muted">
            {pending ? "Atualizando consulta…" : "Filtros da consulta"}
          </p>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
      <noscript>
        <p className="mt-3 text-sm text-muted">
          Escolha os filtros e use Aplicar filtros para atualizar. As abas
          funcionam como links.
        </p>
      </noscript>
      {validationMessage && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {validationMessage} A consulta anterior foi mantida.
        </p>
      )}
    </form>
  );
}
