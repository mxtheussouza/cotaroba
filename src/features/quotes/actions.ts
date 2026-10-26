"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AccessDeniedError } from "@/features/auth/authorization";
import { parseAuthConfig } from "@/features/auth/schema";
import { requireRole } from "@/features/auth/session";
import { getDatabase } from "@/lib/db";

import { quoteIdSchema } from "./schema";
import { consumeQuoteRateLimit } from "./rate-limit";
import { createQuote, QuoteError, reviseQuote } from "./service";

function historyPath(id: string) {
  return quoteIdSchema.safeParse(id).success
    ? `/frigorifico/cotacoes/${id}`
    : "/frigorifico";
}

async function submit(
  form: FormData,
  fallback: string,
  previousQuoteId?: string,
) {
  const user = await requireRole("SLAUGHTERHOUSE");
  if ((await headers()).get("origin") !== parseAuthConfig(process.env).baseURL)
    redirect("/acesso-negado");
  let seriesId: string;
  try {
    const database = getDatabase();
    if (!(await consumeQuoteRateLimit(database, user.id)))
      throw new QuoteError("limite");
    const data = {
      categoryId: form.get("categoryId"),
      pricePerArroba: form.get("pricePerArroba"),
      referenceDate: form.get("referenceDate"),
    };
    const result = previousQuoteId
      ? await reviseQuote(database, user.id, previousQuoteId, data)
      : await createQuote(database, user.id, data);
    seriesId = result.seriesId;
  } catch (error) {
    if (error instanceof AccessDeniedError)
      redirect(error.status === 401 ? "/login" : "/acesso-negado");
    const code =
      error instanceof z.ZodError
        ? "dados"
        : error instanceof QuoteError
          ? error.code
          : "indisponivel";
    redirect(`${fallback}?erro=${code}`);
  }
  revalidatePath("/frigorifico", "layout");
  redirect(
    `${historyPath(seriesId)}?aviso=${previousQuoteId ? "atualizada" : "criada"}`,
  );
}

export async function createQuoteAction(form: FormData) {
  await submit(form, "/frigorifico");
}
export async function reviseQuoteAction(
  seriesId: string,
  previousQuoteId: string,
  form: FormData,
) {
  await submit(form, historyPath(seriesId), previousQuoteId);
}
