"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { ActionModal } from "@/components/action-modal";

import { simulateAction } from "./actions";
import {
  initialSimulationState,
  simulationSchema,
  type SimulationValues,
} from "./schema";

function number(value: string, minimumFractionDigits = 2) {
  const [integer, fraction = ""] = value.split(".");
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction.padEnd(minimumFractionDigits, "0")}`;
}

const fields = [
  {
    name: "liveWeight",
    label: "Peso vivo por animal (kg)",
    hint: "Maior que zero e até 2.000 kg; até três casas decimais.",
    step: 0,
  },
  {
    name: "yieldPercent",
    label: "Rendimento de carcaça (%)",
    hint: "Informe o percentual esperado, maior que zero e até 100%.",
    step: 0,
  },
  {
    name: "arrobaPrice",
    label: "Preço da arroba (R$/@)",
    hint: "Preço principal positivo, até R$ 1.000.000. Até duas casas, sem milhar.",
    step: 1,
  },
  {
    name: "totalCost",
    label: "Custo total por animal (R$)",
    hint: "Inclua compra, alimentação, frete, tributos e demais despesas. De zero a R$ 10.000.000; até duas casas, sem milhar.",
    step: 1,
  },
  {
    name: "alternativePrice",
    label: "Preço alternativo da arroba (R$/@, opcional)",
    hint: "Compare outra cotação positiva até R$ 1.000.000, mantendo peso, rendimento e custos. Até duas casas, sem milhar.",
    step: 1,
  },
] as const;
type FieldName = keyof SimulationValues;

export function SimulationForm() {
  const [state, action, pending] = useActionState(
    simulateAction,
    initialSimulationState,
    "/simulador",
  );
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const resultSection = useRef<HTMLElement>(null);
  const errorSummary = useRef<HTMLParagraphElement>(null);
  const focusTarget = useRef<FieldName | null>(null);
  const result = state.result;

  useEffect(() => {
    if (state.result) {
      dialog.current?.close();
      resultSection.current?.focus();
    } else if (state.error) errorSummary.current?.focus();
  }, [state]);
  useEffect(() => {
    if (focusTarget.current)
      form.current
        ?.querySelector<HTMLInputElement>(`[name="${focusTarget.current}"]`)
        ?.focus();
    focusTarget.current = null;
  }, [errors, step]);

  function validate(names: FieldName[]) {
    if (!form.current) return false;
    const data = new FormData(form.current);
    const next: Partial<Record<FieldName, string>> = {};
    for (const name of names) {
      const parsed = simulationSchema.shape[name].safeParse(data.get(name));
      if (!parsed.success) next[name] = parsed.error.issues[0].message;
    }
    setErrors(next);
    const first = fields.find((field) => next[field.name]);
    if (first) {
      focusTarget.current = first.name;
      setStep(first.step);
    }
    return !first;
  }
  function advance() {
    if (
      validate(
        fields.filter((field) => field.step === 0).map((field) => field.name),
      )
    ) {
      focusTarget.current = "arrobaPrice";
      setStep(1);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    if (step === 0) {
      event.preventDefault();
      advance();
    } else if (!validate(fields.map((field) => field.name)))
      event.preventDefault();
  }
  return (
    <>
      <section
        className="mt-6 rounded-xl border border-border bg-surface p-5"
        aria-labelledby="simulation-start"
      >
        <h2 id="simulation-start" className="text-xl font-bold">
          {result ? "Rever seu cenário" : "Estime o resultado por animal"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Informe o animal, os preços e o custo total. Nenhuma premissa
          comercial é preenchida automaticamente e os dados não são gravados.
        </p>
        <ActionModal
          title="Premissas da simulação"
          triggerLabel={result ? "Editar premissas" : "Simular cenário"}
          dialogRef={dialog}
          busy={pending}
          defaultOpen={Boolean(state.error)}
        >
          <form
            ref={form}
            action={action}
            noValidate
            onSubmit={submit}
            aria-label="Premissas da simulação"
            aria-busy={pending}
          >
            <ol
              data-wizard-navigation
              className="mb-5 flex-wrap gap-3 text-sm"
              aria-label="Etapas da simulação"
            >
              {["Animal", "Preços e custos"].map((title, index) => (
                <li
                  key={title}
                  aria-current={step === index ? "step" : undefined}
                  className={
                    step === index ? "font-bold text-primary" : "text-muted"
                  }
                >
                  {index + 1}. {title}
                </li>
              ))}
            </ol>
            {state.error && (
              <p
                ref={errorSummary}
                tabIndex={-1}
                role="alert"
                className="mb-4 rounded-xl border border-danger p-3 text-sm text-danger"
              >
                {state.error}
              </p>
            )}
            <fieldset disabled={pending} className="min-w-0">
              {["Animal", "Preços e custos"].map((title, index) => (
                <fieldset
                  key={title}
                  data-wizard-step
                  data-current={step === index ? "true" : "false"}
                  className="min-w-0 space-y-4"
                >
                  <legend className="mb-4 text-lg font-bold">{title}</legend>
                  {fields
                    .filter((field) => field.step === index)
                    .map((field) => (
                      <div key={field.name}>
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
                          defaultValue={state.values[field.name].replace(
                            ".",
                            ",",
                          )}
                          aria-invalid={errors[field.name] ? true : undefined}
                          aria-describedby={`hint-${field.name}${errors[field.name] ? ` error-${field.name}` : ""}`}
                          className="mt-2 w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-3 text-base"
                          onChange={() => {
                            if (errors[field.name])
                              setErrors((previous) => ({
                                ...previous,
                                [field.name]: undefined,
                              }));
                          }}
                        />
                        <p
                          id={`hint-${field.name}`}
                          className="mt-2 text-sm text-muted"
                        >
                          {field.hint}
                        </p>
                        {errors[field.name] && (
                          <p
                            id={`error-${field.name}`}
                            role="alert"
                            className="mt-1 text-sm text-danger"
                          >
                            {errors[field.name]}
                          </p>
                        )}
                      </div>
                    ))}
                  {index === 0 ? (
                    <div data-wizard-navigation className="mt-5 justify-end">
                      <button
                        type="button"
                        onClick={advance}
                        className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
                      >
                        Continuar
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <button
                        data-wizard-navigation
                        type="button"
                        onClick={() => {
                          focusTarget.current = "liveWeight";
                          setStep(0);
                        }}
                        className="rounded-xl border border-border px-5 py-3 font-semibold text-primary hover:bg-secondary"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={pending}
                        className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                      >
                        {pending ? "Calculando…" : "Calcular cenário"}
                      </button>
                    </div>
                  )}
                </fieldset>
              ))}
            </fieldset>
            <p role="status" className="mt-4 text-sm text-muted">
              {pending
                ? "Calculando cenário. Aguarde a conclusão."
                : "Os valores são mantidos ao voltar ou fechar esta janela."}
            </p>
            <noscript>
              <p className="mt-3 text-sm text-muted">
                Preencha as duas seções e use Calcular cenário. Os cálculos e as
                validações continuam disponíveis sem JavaScript.
              </p>
            </noscript>
          </form>
        </ActionModal>
      </section>
      {result && (
        <section
          ref={resultSection}
          tabIndex={-1}
          aria-labelledby="simulation-result"
          aria-live="polite"
          className="mt-10"
        >
          <h2 id="simulation-result" className="text-2xl font-bold">
            Resultado estimado por animal
          </h2>
          <p role="status" className="mt-2 text-sm text-muted">
            Simulação calculada. Este é o último cenário enviado; editar
            premissas só altera o resultado ao calcular novamente.
          </p>
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
          <details className="mt-4 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-primary">
              Precisão e preço de equilíbrio
            </summary>
            Cálculos usam precisão decimal; valores monetários exibidos são
            arredondados para centavos. Não se reutiliza o número de arrobas já
            arredondado no cálculo da receita. O preço de equilíbrio é custo ÷
            arrobas estimadas.
          </details>
        </section>
      )}
    </>
  );
}
