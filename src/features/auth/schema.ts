import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email("Informe um e-mail válido.")
      .max(254, "O e-mail deve ter até 254 caracteres."),
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .max(128, "A senha deve ter até 128 caracteres."),
});

export const initialManagerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(160, "O nome deve ter até 160 caracteres."),
  email: emailSchema,
  password: z
    .string()
    .min(12, "A senha deve ter pelo menos 12 caracteres.")
    .max(128, "A senha deve ter até 128 caracteres."),
});

export function parseAuthConfig(
  environment: Record<string, string | undefined>,
) {
  const result = z
    .object({
      BETTER_AUTH_URL: z.url(),
      BETTER_AUTH_SECRET: z.string().min(32),
    })
    .safeParse(environment);

  if (!result.success) {
    throw new Error(
      "Configure BETTER_AUTH_URL e BETTER_AUTH_SECRET (mínimo de 32 caracteres).",
    );
  }

  const url = new URL(result.data.BETTER_AUTH_URL);
  const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "BETTER_AUTH_URL deve ser uma origem HTTPS (HTTP permitido somente em loopback).",
    );
  }

  return { baseURL: url.origin, secret: result.data.BETTER_AUTH_SECRET };
}
