import { SubmitButton } from "@/features/slaughterhouses/submit-button";

import { todayInBahia } from "./format";

export type QuoteSearch = Record<string, string | string[] | undefined>;
const errors: Record<string, string> = {
  dados:
    "Confira a categoria, a data e o preço. Informe um valor maior que zero, sem milhar e com até duas casas decimais. Preencha novamente o formulário.",
  categoria: "Selecione uma categoria cadastrada pelo gestor.",
  "nao-encontrada": "Cotação não encontrada. Volte à lista e tente novamente.",
  atualizada:
    "Esta cotação recebeu outra atualização. Recarregue a página e confira a versão atual antes de salvar.",
  limite: "Muitos envios em pouco tempo. Aguarde um minuto e tente novamente.",
  indisponivel:
    "Não foi possível salvar a cotação. Tente novamente em instantes.",
};

export function QuoteFeedback({ search }: { search: QuoteSearch }) {
  const error =
    typeof search.erro === "string" && Object.hasOwn(errors, search.erro)
      ? errors[search.erro]
      : undefined;
  const notice =
    search.aviso === "criada"
      ? "Cotação cadastrada. O registro é privado do seu frigorífico."
      : search.aviso === "atualizada"
        ? "Cotação atualizada. A versão anterior foi preservada no histórico."
        : undefined;
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

export function QuoteForm({
  action,
  categories,
  current,
}: {
  action: (form: FormData) => Promise<void>;
  categories: Array<{ id: string; name: string }>;
  current?: {
    categoryId: string;
    referenceDate: string;
    pricePerArroba: string;
  };
}) {
  const fieldClass =
    "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base";
  return (
    <form action={action} className="mt-6 space-y-6">
      <div>
        <label htmlFor="quote-category" className="block text-sm font-semibold">
          Categoria
        </label>
        <select
          id="quote-category"
          name="categoryId"
          required
          defaultValue={current?.categoryId ?? ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Selecione uma categoria
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="quote-price" className="block text-sm font-semibold">
          Preço da arroba (R$/@)
        </label>
        <input
          id="quote-price"
          name="pricePerArroba"
          type="text"
          inputMode="decimal"
          required
          maxLength={13}
          defaultValue={current?.pricePerArroba.replace(".", ",")}
          placeholder="301,27"
          aria-describedby="quote-price-hint"
          className={fieldClass}
        />
        <p id="quote-price-hint" className="mt-2 text-sm text-muted">
          Valor maior que zero, sem separador de milhar e com até duas casas
          decimais.
        </p>
      </div>
      <div>
        <label htmlFor="quote-date" className="block text-sm font-semibold">
          Data de referência
        </label>
        <input
          id="quote-date"
          name="referenceDate"
          type="date"
          required
          min="0001-01-01"
          max="9999-12-31"
          defaultValue={current?.referenceDate ?? todayInBahia()}
          className={fieldClass}
        />
      </div>
      <SubmitButton disabled={categories.length === 0}>
        {current ? "Salvar nova versão" : "Salvar cotação"}
      </SubmitButton>
    </form>
  );
}
