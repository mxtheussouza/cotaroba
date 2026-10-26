import "server-only";

import { hashPassword } from "better-auth/crypto";

import type { PrismaClient } from "@/generated/prisma/client";

import { initialManagerSchema } from "./schema";

export class CredentialAccountNotFoundError extends Error {
  constructor() {
    super("Não foi encontrado um acesso de e-mail e senha para este e-mail.");
  }
}

// Local operator recovery only; never exposed as an HTTP route or Server Action.
export async function resetCredentialPassword(
  database: PrismaClient,
  input: unknown,
) {
  const data = initialManagerSchema
    .pick({ email: true, password: true })
    .parse(input);
  const hash = await hashPassword(data.password);

  await database.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        accounts: { where: { providerId: "credential" }, select: { id: true } },
      },
    });
    const account = user?.accounts[0];
    if (!user || !account) throw new CredentialAccountNotFoundError();
    await transaction.account.update({
      where: { id: account.id },
      data: { password: hash },
    });
    await transaction.session.deleteMany({ where: { userId: user.id } });
  });
}
