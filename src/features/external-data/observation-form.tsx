"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useFormStatus } from "react-dom";

import { ActionModal } from "@/components/action-modal";
import { SubmitButton } from "@/features/slaughterhouses/submit-button";

import { saveObservationAction } from "./actions";
import { ExternalFeedback, fieldClass } from "./components";
import {
  emptyObservation,
  useObservationDraft,
  type ObservationFieldName,
} from "./observation-draft";
import { frequencies, metrics, observationSchema } from "./schema";

const fields = [
  {
    name: "periodStart",
    id: "period-start",
    label: "Início do período",
    group: "Período",
    hint: "Informe uma data válida até hoje, no fuso da Bahia.",
  },
  {
    name: "periodEnd",
    id: "period-end",
    label: "Fim do período",
    group: "Período",
    hint: "Use uma data até hoje, igual ou posterior ao início.",
  },
  {
    name: "value",
    id: "external-value",
    label: "Valor",
    group: "Valor e validade",
    hint: "Sem milhar e com até quatro casas decimais. Zero permitido apenas para chuva e abates; abates devem ser inteiros.",
  },
  {
    name: "validUntil",
    id: "valid-until",
    label: "Válido até (opcional)",
    group: "Valor e validade",
    hint: "Se informada, a validade deve ser igual ou posterior ao fim do período.",
  },
] as const;

function ObservationModal({
  children,
  dialog,
  errorCode,
  notice,
}: {
  children: ReactNode;
  dialog: RefObject<HTMLDialogElement | null>;
  errorCode?: string;
  notice?: string;
}) {
  const { pending } = useFormStatus();
  const { setValues, pendingSubmissionRef } = useObservationDraft();
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pending) pendingSubmissionRef.current = true;
    else if (pendingSubmissionRef.current) {
      pendingSubmissionRef.current = false;
      if (notice === "salvo" || notice === "repetido") {
        dialog.current?.close();
        setValues(emptyObservation);
        dialog.current?.closest("details")?.querySelector("summary")?.focus();
      }
    }
    // ActionModal focuses its first field when opened. Announce a returned
    // server error after that focus step, including repeated error redirects.
    if (!pending && errorCode) {
      const frame = requestAnimationFrame(() => feedback.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [pending, notice, errorCode, dialog, setValues, pendingSubmissionRef]);
  return (
    <ActionModal
      title="Cadastrar registro ou correção"
      triggerLabel="Novo registro ou correção"
      dialogRef={dialog}
      busy={pending}
      defaultOpen={Boolean(errorCode)}
    >
      <div aria-busy={pending}>
        {errorCode && !pending && (
          <div ref={feedback} tabIndex={-1}>
            <ExternalFeedback search={{ erro: errorCode }} />
            <p className="mt-2 text-sm text-muted">
              Revise os dados e tente novamente. Confira também a frequência e a
              unidade da série.
            </p>
          </div>
        )}
        <fieldset disabled={pending} className="min-w-0 space-y-5">
          {children}
        </fieldset>
        <p role="status" className="mt-4 text-sm text-muted">
          {pending
            ? "Salvando registro. Aguarde a conclusão."
            : "Fechar esta janela mantém o rascunho. O registro só é gravado ao salvar."}
        </p>
      </div>
    </ActionModal>
  );
}

export function ObservationForm({
  seriesId,
  metric,
  frequency,
  today,
  errorCode,
  notice,
}: {
  seriesId: string;
  metric: keyof typeof metrics;
  frequency: keyof typeof frequencies;
  today: string;
  errorCode?: string;
  notice?: string;
}) {
  const { values, setValues } = useObservationDraft();
  const [errors, setErrors] = useState<
    Partial<Record<ObservationFieldName, string>>
  >({});
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (form.current) form.current.noValidate = true;
    const element = dialog.current;
    return () => element?.close();
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    const next: typeof errors = {};
    for (const field of fields) {
      const control = form.current?.elements.namedItem(field.name);
      if (
        !(control instanceof HTMLInputElement) ||
        !control.validity.valid ||
        !observationSchema.shape[field.name].safeParse(values[field.name])
          .success
      )
        next[field.name] = field.hint;
    }
    const parsed = observationSchema.safeParse(values);
    if (
      !parsed.success &&
      parsed.error.issues.some((issue) => !issue.path.length)
    ) {
      if (values.periodStart > values.periodEnd)
        next.periodEnd = fields[1].hint;
      if (values.validUntil && values.validUntil < values.periodEnd)
        next.validUntil = fields[3].hint;
    }
    setErrors(next);
    const first = fields.find((field) => next[field.name]);
    if (first) {
      event.preventDefault();
      form.current
        ?.querySelector<HTMLInputElement>(`[name="${first.name}"]`)
        ?.focus();
    }
  }
  return (
    <form
      ref={form}
      action={saveObservationAction.bind(null, seriesId)}
      onSubmit={submit}
      onReset={(event) => event.preventDefault()}
      aria-label="Cadastro de registro ou correção"
    >
      <ObservationModal dialog={dialog} errorCode={errorCode} notice={notice}>
        <p className="text-sm text-muted">
          Frequência: {frequencies[frequency]}. Para corrigir, informe o mesmo
          período e o valor correto; a versão anterior será preservada.
        </p>
        {(["Período", "Valor e validade"] as const).map((group) => (
          <fieldset key={group} className="grid min-w-0 gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-lg font-bold">{group}</legend>
            {group === "Período" && (
              <p className="text-sm text-muted sm:col-span-2">
                Use um dia para frequência diária, sete dias para semanal ou o
                mês/trimestre completo. O período deve estar encerrado.
              </p>
            )}
            {fields
              .filter((field) => field.group === group)
              .map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-semibold"
                  >
                    {field.label}
                    {field.name === "value" ? ` (${metrics[metric].unit})` : ""}
                  </label>
                  <input
                    id={field.id}
                    name={field.name}
                    type={field.name === "value" ? "text" : "date"}
                    inputMode={field.name === "value" ? "decimal" : undefined}
                    required={field.name !== "validUntil"}
                    min={field.name === "value" ? undefined : "0001-01-01"}
                    max={
                      field.name === "value"
                        ? undefined
                        : field.name === "validUntil"
                          ? "9999-12-31"
                          : today
                    }
                    maxLength={field.name === "value" ? 19 : undefined}
                    value={values[field.name]}
                    className={fieldClass}
                    aria-invalid={errors[field.name] ? true : undefined}
                    aria-describedby={`${field.id}-hint${errors[field.name] ? ` ${field.id}-error` : ""}`}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setValues((previous) => ({
                        ...previous,
                        [field.name]: value,
                      }));
                      setErrors((previous) => ({
                        ...previous,
                        [field.name]: undefined,
                      }));
                    }}
                  />
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
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
          </fieldset>
        ))}
        <SubmitButton>Salvar registro</SubmitButton>
      </ObservationModal>
    </form>
  );
}
