import password from "@inquirer/password";
import { ZodError } from "zod";

import {
  createInitialManager,
  InitialManagerExistsError,
} from "@/features/auth/bootstrap";
import { getDatabase } from "@/lib/db";

let database: ReturnType<typeof getDatabase> | undefined;

try {
  const [email, name] = process.argv.slice(2);
  if (!email || !name || !process.stdin.isTTY) {
    throw new Error(
      'Use em terminal interativo: npm run auth:create-manager -- email "Nome do gestor". A senha será solicitada sem eco.',
    );
  }
  const secret = await password({
    message: "Senha do primeiro gestor (12 a 128 caracteres):",
    mask: "*",
  });
  database = getDatabase();
  await createInitialManager(database, { email, name, password: secret });
  console.log(
    "Primeiro gestor criado. Entre em /login com o e-mail e a senha informados.",
  );
} catch (error) {
  if (error instanceof InitialManagerExistsError) console.error(error.message);
  else if (error instanceof ZodError)
    console.error(error.issues[0]?.message ?? "Dados inválidos.");
  else if (!process.stdin.isTTY || process.argv.length < 4)
    console.error(
      'Use um terminal interativo: npm run auth:create-manager -- email "Nome do gestor".',
    );
  else
    console.error(
      "Não foi possível criar o gestor. Confira o banco, as migrations e o e-mail informado.",
    );
  process.exitCode = 1;
} finally {
  await database?.$disconnect();
}
