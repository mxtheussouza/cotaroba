"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useFormStatus } from "react-dom";

import { ActionModal } from "@/components/action-modal";
import { SubmitButton } from "@/features/slaughterhouses/submit-button";

import { createSeriesAction } from "./actions";
import { ExternalFeedback, fieldClass } from "./components";
import { frequencies, metrics, seriesSchema } from "./schema";
import { useSeriesDraft, type SeriesFieldName } from "./series-draft";

type FieldName = SeriesFieldName;
const steps = ["Série e localidade", "Fonte e atualização"];
const fields = [
  {
    name: "name",
    id: "series-name",
    label: "Nome da série",
    step: 0,
    hint: "Nome único, com até 160 caracteres.",
  },
  {
    name: "metric",
    id: "metric",
    label: "Informação e unidade",
    step: 0,
    hint: "Escolha a informação; a unidade acompanha a opção selecionada.",
  },
  {
    name: "frequency",
    id: "frequency",
    label: "Frequência",
    step: 0,
    hint: "Informe a frequência exata das referências da fonte.",
  },
  {
    name: "geography",
    id: "geography",
    label: "Região ou localidade da fonte",
    step: 0,
    hint: "Localidade da fonte, com até 160 caracteres; não é associada automaticamente à região comercial.",
  },
  {
    name: "sourceName",
    id: "source-name",
    label: "Nome da fonte",
    step: 1,
    hint: "Identifique uma fonte que permita a publicação, com até 160 caracteres.",
  },
  {
    name: "sourceUrl",
    id: "source-url",
    label: "Link HTTPS da fonte",
    step: 1,
    hint: "Endereço HTTPS, sem usuário/senha na URL e com até 1.000 caracteres.",
  },
  {
    name: "staleAfterDays",
    id: "stale-days",
    label: "Prazo de atualização (dias após a referência)",
    step: 1,
    hint: "Informe de 1 a 730 dias inteiros. Considere a frequência e o atraso de divulgação da fonte.",
  },
] as const;

function SeriesModal({
  children,
  dialog,
  errorCode,
  submitted,
}: {
  children: ReactNode;
  dialog: RefObject<HTMLDialogElement | null>;
  errorCode?: string;
  submitted: boolean;
}) {
  const { pending } = useFormStatus();
  const feedback = useRef<HTMLDivElement>(null);
  const creationError = errorCode === "duplicada" || errorCode === "dados";
  const showError = Boolean(errorCode && (submitted || creationError));
  useEffect(() => {
    if (!pending && showError) feedback.current?.focus();
  }, [pending, showError, errorCode]);
  return (
    <ActionModal
      title="Cadastrar série manual"
      triggerLabel="Nova série manual"
      dialogRef={dialog}
      busy={pending}
      defaultOpen={creationError}
    >
      <div aria-busy={pending}>
        {showError && !pending && (
          <div ref={feedback} tabIndex={-1}>
            <ExternalFeedback search={{ erro: errorCode }} />
            <p className="mt-2 text-sm text-muted">
              Revise os campos; use Voltar para ajustar o nome da série.
            </p>
          </div>
        )}
        <fieldset disabled={pending} className="min-w-0">
          {children}
        </fieldset>
        <p role="status" className="mt-4 text-sm text-muted">
          {pending
            ? "Cadastrando série. Aguarde a conclusão."
            : "Os campos são mantidos ao voltar ou fechar esta janela. O cadastro só é feito ao enviar."}
        </p>
        <noscript>
          <p className="mt-3 text-sm text-muted">
            Preencha as duas seções e use Cadastrar série. Os dados continuam
            validados pelo servidor.
          </p>
        </noscript>
      </div>
    </ActionModal>
  );
}

export function ManualSeriesForm({ errorCode }: { errorCode?: string }) {
  const { values, setValues, step, setStep } = useSeriesDraft();
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const focusTarget = useRef<FieldName | null>(null);
  useEffect(() => {
    const element = dialog.current;
    if (form.current) form.current.noValidate = true;
    const closed = () => setSubmitted(false);
    element?.addEventListener("close", closed);
    return () => {
      element?.removeEventListener("close", closed);
      element?.close();
    };
  }, []);
  useEffect(() => {
    if (focusTarget.current)
      form.current
        ?.querySelector<HTMLElement>(`[name="${focusTarget.current}"]`)
        ?.focus();
    focusTarget.current = null;
  }, [errors, step]);
  function validate(names: FieldName[]) {
    if (!form.current) return false;
    const data = new FormData(form.current);
    const next: Partial<Record<FieldName, string>> = {};
    for (const name of names) {
      const control = form.current.elements.namedItem(name);
      const nativeValid =
        (control instanceof HTMLInputElement ||
          control instanceof HTMLSelectElement) &&
        control.validity.valid;
      // The URL refinement assumes a parseable URL; reject missing/malformed
      // fields with native constraints before applying the unchanged schema.
      if (
        !nativeValid ||
        !seriesSchema.shape[name].safeParse(data.get(name)).success
      ) {
        const field = fields.find((row) => row.name === name)!;
        next[name] = field.hint;
      }
    }
    setErrors(next);
    const first = fields.find((row) => next[row.name]);
    if (first) {
      focusTarget.current = first.name;
      setStep(first.step);
    }
    return !first;
  }
  function advance() {
    if (
      validate(fields.filter((row) => row.step === 0).map((row) => row.name))
    ) {
      focusTarget.current = "sourceName";
      setStep(1);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    if (step === 0) {
      event.preventDefault();
      advance();
    } else if (!validate(fields.map((row) => row.name))) event.preventDefault();
    else setSubmitted(true);
  }
  return (
    <form
      ref={form}
      action={createSeriesAction}
      onReset={(event) => event.preventDefault()}
      onSubmit={submit}
      aria-label="Cadastro de série manual"
    >
      <SeriesModal dialog={dialog} errorCode={errorCode} submitted={submitted}>
        <ol
          data-wizard-navigation
          className="mb-5 flex-wrap gap-3 text-sm"
          aria-label="Etapas do cadastro da série"
        >
          {steps.map((title, index) => (
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
        {steps.map((title, index) => (
          <fieldset
            key={title}
            data-wizard-step
            data-current={step === index ? "true" : "false"}
            className="min-w-0 space-y-4"
          >
            <legend className="mb-4 text-lg font-bold">{title}</legend>
            {fields
              .filter((row) => row.step === index)
              .map((field) => {
                const common = {
                  id: field.id,
                  name: field.name,
                  required: true,
                  value: values[field.name],
                  className: fieldClass,
                  "aria-invalid": errors[field.name]
                    ? (true as const)
                    : undefined,
                  "aria-describedby": `${field.id}-hint${errors[field.name] ? ` ${field.id}-error` : ""}`,
                  onChange: (
                    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                  ) => {
                    const value = event.currentTarget.value;
                    setValues((previous) => ({
                      ...previous,
                      [field.name]: value,
                    }));
                    if (errors[field.name])
                      setErrors((previous) => ({
                        ...previous,
                        [field.name]: undefined,
                      }));
                  },
                };
                return (
                  <div key={field.name}>
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-semibold"
                    >
                      {field.label}
                    </label>
                    {field.name === "metric" ? (
                      <select {...common}>
                        {Object.entries(metrics).map(([key, metric]) => (
                          <option key={key} value={key}>
                            {metric.label} ({metric.unit})
                          </option>
                        ))}
                      </select>
                    ) : field.name === "frequency" ? (
                      <select {...common}>
                        {Object.entries(frequencies).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : field.name === "staleAfterDays" ? (
                      <input {...common} type="number" min={1} max={730} />
                    ) : (
                      <input
                        {...common}
                        type={field.name === "sourceUrl" ? "url" : "text"}
                        maxLength={field.name === "sourceUrl" ? 1000 : 160}
                      />
                    )}
                    <p
                      id={`${field.id}-hint`}
                      className="mt-2 text-sm text-muted"
                    >
                      {field.hint}
                    </p>
                    {errors[field.name] && (
                      <p
                        id={`${field.id}-error`}
                        role="alert"
                        className="mt-1 text-sm text-danger"
                      >
                        Confira este campo: {errors[field.name]}
                      </p>
                    )}
                  </div>
                );
              })}
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
              <>
                <p className="rounded-xl bg-secondary p-3 text-sm">
                  Nome, unidade e fonte ficam fixos para preservar o histórico.
                  Para outra fonte ou unidade, crie outra série.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <button
                    data-wizard-navigation
                    type="button"
                    onClick={() => {
                      focusTarget.current = "name";
                      setStep(0);
                    }}
                    className="rounded-xl border border-border px-5 py-3 font-semibold text-primary hover:bg-secondary"
                  >
                    Voltar
                  </button>
                  <SubmitButton>Cadastrar série</SubmitButton>
                </div>
              </>
            )}
          </fieldset>
        ))}
      </SeriesModal>
    </form>
  );
}
