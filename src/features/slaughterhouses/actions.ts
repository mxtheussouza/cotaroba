"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AccessDeniedError } from "@/features/auth/authorization";
import { parseAuthConfig } from "@/features/auth/schema";
import { requireRole } from "@/features/auth/session";
import { getDatabase } from "@/lib/db";

import { idSchema } from "./schema";
import { consumeManagementRateLimit } from "./rate-limit";
import {
  createAccess,
  createCategory,
  createRegion,
  createSlaughterhouse,
  ManagementError,
  resetAccessPassword,
  updateAccess,
  updateSlaughterhouse,
} from "./service";

const statusSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

async function managerId() {
  const user = await requireRole("MANAGER");
  // Next.js checks action Origin/Host as well. Enforce the configured origin explicitly.
  if ((await headers()).get("origin") !== parseAuthConfig(process.env).baseURL)
    throw new AccessDeniedError(403);
  return user.id;
}

async function submit(
  operation: (actorId: string) => Promise<string>,
  fallback: string,
  message: string,
  validationCode: "dados" | "nome-regiao" | "nome-categoria" = "dados",
) {
  const actorId = await managerId();
  let destination: string;
  try {
    if (!(await consumeManagementRateLimit(getDatabase(), actorId)))
      throw new ManagementError("limite");
    destination = await operation(actorId);
  } catch (error) {
    if (error instanceof AccessDeniedError)
      redirect(error.status === 401 ? "/login" : "/acesso-negado");
    const code =
      error instanceof z.ZodError
        ? validationCode
        : error instanceof ManagementError
          ? error.code
          : "indisponivel";
    // Fixed codes only: never serialize submitted credentials or database exceptions.
    redirect(`${fallback}?erro=${code}`);
  }
  revalidatePath("/gestor", "layout");
  revalidatePath("/frigorifico");
  redirect(`${destination}?aviso=${message}`);
}

function detailPath(id: string) {
  return idSchema.safeParse(id).success
    ? `/gestor/frigorificos/${id}`
    : "/gestor";
}

export async function createRegionAction(form: FormData) {
  await submit(
    async (actorId) => {
      await createRegion(getDatabase(), actorId, { name: form.get("name") });
      return "/gestor/regioes";
    },
    "/gestor/regioes",
    "regiao-criada",
    "nome-regiao",
  );
}

export async function createCategoryAction(form: FormData) {
  await submit(
    async (actorId) => {
      await createCategory(getDatabase(), actorId, { name: form.get("name") });
      return "/gestor/categorias";
    },
    "/gestor/categorias",
    "categoria-criada",
    "nome-categoria",
  );
}

export async function createSlaughterhouseAction(form: FormData) {
  await submit(
    async (actorId) => {
      const record = await createSlaughterhouse(getDatabase(), actorId, {
        name: form.get("name"),
        regionId: form.get("regionId"),
      });
      return detailPath(record.id);
    },
    "/gestor/frigorificos/novo",
    "frigorifico-criado",
  );
}

export async function updateSlaughterhouseAction(id: string, form: FormData) {
  await submit(
    async (actorId) => {
      await updateSlaughterhouse(getDatabase(), actorId, id, {
        name: form.get("name"),
        regionId: form.get("regionId"),
        isActive: statusSchema.parse(form.get("isActive")),
      });
      return detailPath(id);
    },
    detailPath(id),
    "frigorifico-atualizado",
  );
}

export async function createAccessAction(id: string, form: FormData) {
  await submit(
    async (actorId) => {
      await createAccess(getDatabase(), actorId, id, {
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      });
      return detailPath(id);
    },
    detailPath(id),
    "acesso-criado",
  );
}

export async function updateAccessAction(
  id: string,
  userId: string,
  form: FormData,
) {
  await submit(
    async (actorId) => {
      await updateAccess(getDatabase(), actorId, id, userId, {
        name: form.get("name"),
        email: form.get("email"),
        isActive: statusSchema.parse(form.get("isActive")),
      });
      return detailPath(id);
    },
    detailPath(id),
    "acesso-atualizado",
  );
}

export async function resetAccessPasswordAction(
  id: string,
  userId: string,
  form: FormData,
) {
  await submit(
    async (actorId) => {
      await resetAccessPassword(getDatabase(), actorId, id, userId, {
        password: form.get("password"),
      });
      return detailPath(id);
    },
    detailPath(id),
    "senha-alterada",
  );
}
