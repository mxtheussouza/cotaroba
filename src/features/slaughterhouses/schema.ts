import { z } from "zod";

import { initialManagerSchema } from "@/features/auth/schema";

export const idSchema = z.uuid("Identificador inválido.");

export const regionSchema = z.strictObject({
  name: z
    .string()
    .transform((value) => value.trim().replace(/\s+/gu, " ").normalize("NFC"))
    .pipe(
      z
        .string()
        .min(1, "Informe o nome da região.")
        .max(120, "O nome da região deve ter até 120 caracteres."),
    ),
});

export const slaughterhouseSchema = z.strictObject({
  name: initialManagerSchema.shape.name,
  regionId: idSchema,
});

export const updateSlaughterhouseSchema = slaughterhouseSchema.extend({
  isActive: z.boolean(),
});

export const accessSchema = z.strictObject({
  name: initialManagerSchema.shape.name,
  email: initialManagerSchema.shape.email,
  password: initialManagerSchema.shape.password,
});

export const updateAccessSchema = accessSchema.omit({ password: true }).extend({
  isActive: z.boolean(),
});

export const accessPasswordSchema = accessSchema.pick({ password: true });
