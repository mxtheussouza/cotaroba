import password from "@inquirer/password";
import { ZodError } from "zod";

import {
  resetCredentialPassword,
  CredentialAccountNotFoundError,
} from "@/features/auth/reset-password";
import { getDatabase } from "@/lib/db";

let database: ReturnType<typeof getDatabase> | undefined;

try {
  const [email] = process.argv.slice(2);
  if (!email || !process.stdin.isTTY)
    throw new Error("Interactive terminal required");
  const secret = await password({
    message: "Nova senha (12 a 128 caracteres):",
    mask: "*",
  });
  database = getDatabase();
  await resetCredentialPassword(database, { email, password: secret });
  console.log("Senha atualizada e sessões anteriores encerradas.");
} catch (error) {
  if (error instanceof CredentialAccountNotFoundError)
    console.error(error.message);
  else if (error instanceof ZodError)
    console.error(error.issues[0]?.message ?? "Dados inválidos.");
  else if (!process.stdin.isTTY || process.argv.length < 3)
    console.error(
      "Use um terminal interativo: npm run auth:reset-password -- email",
    );
  else
    console.error(
      "Não foi possível atualizar a senha. Confira o banco e as migrations.",
    );
  process.exitCode = 1;
} finally {
  await database?.$disconnect();
}
