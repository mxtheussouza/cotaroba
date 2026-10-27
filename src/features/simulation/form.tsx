"use client";

import { useActionState } from "react";

import { simulateAction } from "./actions";
import { initialSimulationState } from "./schema";

function number(value: string, minimumFractionDigits = 2) {
  const [integer, fraction = ""] = value.split(".");
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction.padEnd(minimumFractionDigits, "0")}`;
}

export function SimulationForm() {
  const [state, action, pending] = useActionState(
    simulateAction,
    initialSimulationState,
    "/simulador",
  );
  const fields = [
    {
      name: "liveWeight",
      label: "Peso vivo por animal (kg)",
      hint: "Maior que zero e até 2.000 kg; até três casas decimais.",
    },
    {
      name: "yieldPercent",
      label: "Rendimento de carcaça (%)",
      hint: "Informe o percentual esperado, maior que zero e até 100%.",
    },
    {
      name: "arrobaPrice",
      label: "Preço da arroba (R$/@)",
      hint: "Preço do cenário principal. Sem separador de milhar.",
    },
    {
      name: "totalCost",
      label: "Custo total por animal (R$)",
      hint: "Inclua compra, alimentação, frete, tributos e demais custos aplicáveis. Zero é permitido.",
    },
    {
      name: "alternativePrice",
      label: "Preço alternativo da arroba (R$/@, opcional)",
      hint: "Preencha para comparar outra cotação, mantendo peso, rendimento e custos.",
    },
  ] as const;
  const result = state.result;
  return (
    <>
      <form
        action={action}
        className="mt-8 grid gap-6 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2 sm:p-8"
        aria-label="Premissas da simulação"
      >
        {fields.map((field) => (
          <div
            key={field.name}
            className={field.name === "alternativePrice" ? "sm:col-span-2" : ""}
          >
            <label
              htmlFor={`simulation-${field.name}`}
              className="block text-sm font-semibold"
            >
              {field.label}
            </label>
            <input
              key={`${field.name}:${state.values[field.name]}`}
              id={`simulation-${field.name}`}
              name={field.name}
              type="text"
              inputMode="decimal"
              required={field.name !== "alternativePrice"}
              maxLength={18}
              defaultValue={state.values[field.name].replace(".", ",")}
              aria-describedby={`hint-${field.name}`}
              className="mt-2 w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-3 text-base"
            />
            <p id={`hint-${field.name}`} className="mt-2 text-sm text-muted">
              {field.hint}
            </p>
          </div>
        ))}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "Calculando…" : "Calcular cenário"}
          </button>
        </div>
      </form>
      {state.error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-danger bg-surface p-4 text-danger"
        >
          {state.error}
        </p>
      )}
      {result && (
        <section
          aria-labelledby="simulation-result"
          aria-live="polite"
          className="mt-10"
        >
          <h2 id="simulation-result" className="text-2xl font-bold">
            Resultado estimado por animal
          </h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Carcaça estimada", `${number(result.carcassWeight, 3)} kg`],
              ["Arrobas estimadas", `${number(result.arrobas, 4)} @`],
              ["Receita estimada", `R$ ${number(result.revenue)}`],
              ["Custo informado", `R$ ${number(result.cost)}`],
              ["Margem estimada", `R$ ${number(result.margin)}`],
              ["Preço de equilíbrio", `R$ ${number(result.breakEvenPrice)}/@`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-3 text-2xl font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm font-semibold">
            {Number(result.margin) < 0
              ? "O cenário apresenta margem negativa."
              : Number(result.margin) === 0
                ? "O cenário está no ponto de equilíbrio."
                : "O cenário apresenta margem positiva."}
          </p>
          {result.alternative && (
            <div className="mt-6 rounded-xl border border-border bg-secondary p-6">
              <h3 className="text-xl font-bold">Cenário alternativo</h3>
              <p className="mt-3">
                Preço: R$ {number(result.alternative.price)}/@ · Receita: R${" "}
                {number(result.alternative.revenue)} · Margem: R${" "}
                {number(result.alternative.margin)}
              </p>
              <p className="mt-2 text-sm">
                Diferença de receita frente ao cenário principal: R${" "}
                {number(result.alternative.revenueDifference)} por animal.
              </p>
            </div>
          )}
          <p className="mt-4 text-sm text-muted">
            Cálculos usam precisão decimal; valores monetários exibidos são
            arredondados para centavos. Não se reutiliza o número de arrobas já
            arredondado no cálculo da receita. O preço de equilíbrio é custo ÷
            arrobas estimadas.
          </p>
        </section>
      )}
    </>
  );
}
