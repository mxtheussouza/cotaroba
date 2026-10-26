import { z } from "zod";

export const categorySchema = z.strictObject({
  name: z
    .string()
    .transform((value) => value.trim().replace(/\s+/gu, " ").normalize("NFC"))
    .pipe(
      z
        .string()
        .min(1, "Informe o nome da categoria.")
        .max(120, "O nome deve ter até 120 caracteres."),
    ),
});

export const quoteIdSchema = z.uuid("Identificador inválido.");

const priceSchema = z
  .string()
  .trim()
  .regex(
    /^\d{1,10}(?:[,.]\d{1,2})?$/,
    "Informe um valor positivo, sem milhar e com até duas casas decimais.",
  )
  .refine((value) => /[1-9]/.test(value), "O preço deve ser maior que zero.")
  .transform((value) => value.replace(",", "."));

const referenceDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      value.startsWith("0000") === false &&
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Informe uma data válida.");

export const quoteSchema = z.strictObject({
  categoryId: quoteIdSchema,
  pricePerArroba: priceSchema,
  referenceDate: referenceDateSchema,
});
