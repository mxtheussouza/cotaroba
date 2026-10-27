"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AccessDeniedError } from "@/features/auth/authorization";
import { parseAuthConfig } from "@/features/auth/schema";
import { requireRole } from "@/features/auth/session";
import { consumeManagementRateLimit } from "@/features/slaughterhouses/rate-limit";
import { getDatabase } from "@/lib/db";

import {
  createManualSeries,
  ExternalDataError,
  saveManualObservation,
  synchronizeSource,
} from "./service";

async function submit(
  form: FormData,
  mode: "series" | "observation" | "sync",
  id?: string,
) {
  const actor = await requireRole("MANAGER");
  if ((await headers()).get("origin") !== parseAuthConfig(process.env).baseURL)
    redirect("/acesso-negado");
  let path =
    id && z.uuid().safeParse(id).success
      ? `/gestor/dados/${id}`
      : "/gestor/dados";
  let notice = "salvo";
  try {
    const db = getDatabase();
    if (!(await consumeManagementRateLimit(db, actor.id)))
      throw new ExternalDataError("limite");
    const fields = (names: string[]) =>
      Object.fromEntries(names.map((name) => [name, form.get(name)]));
    if (mode === "series") {
      const result = await createManualSeries(
        db,
        actor.id,
        fields([
          "name",
          "metric",
          "frequency",
          "geography",
          "sourceName",
          "sourceUrl",
          "staleAfterDays",
        ]),
      );
      path = `/gestor/dados/${result.id}`;
      notice = "serie";
    } else if (mode === "observation") {
      const result = await saveManualObservation(
        db,
        actor.id,
        id!,
        fields(["periodStart", "periodEnd", "value", "validUntil"]),
      );
      notice = result.inserted ? "salvo" : "repetido";
    } else {
      const result = await synchronizeSource(
        db,
        actor.id,
        form.get("connector"),
      );
      notice = result.inserted ? "sincronizado" : "sem-alteracao";
    }
  } catch (error) {
    if (error instanceof AccessDeniedError)
      redirect(error.status === 401 ? "/login" : "/acesso-negado");
    const code =
      error instanceof z.ZodError
        ? "dados"
        : error instanceof ExternalDataError
          ? error.code
          : "indisponivel";
    redirect(`${path}?erro=${code}`);
  }
  revalidatePath("/dados");
  revalidatePath("/gestor/dados", "layout");
  redirect(`${path}?aviso=${notice}`);
}

export async function createSeriesAction(form: FormData) {
  await submit(form, "series");
}
export async function saveObservationAction(id: string, form: FormData) {
  await submit(form, "observation", id);
}
export async function synchronizeAction(form: FormData) {
  await submit(form, "sync");
}
