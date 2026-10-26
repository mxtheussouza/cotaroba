import "server-only";

import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";

import type { PrismaClient } from "@/generated/prisma/client";
import { getDatabase } from "@/lib/db";

import { parseAuthConfig } from "./schema";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function createAuth(
  database: PrismaClient,
  config: ReturnType<typeof parseAuthConfig>,
) {
  return betterAuth({
    appName: "Cotaroba",
    baseURL: config.baseURL,
    secret: config.secret,
    telemetry: { enabled: false },
    database: prismaAdapter(database, { provider: "postgresql" }),
    trustedOrigins: [config.baseURL],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        role: {
          type: ["MANAGER", "SLAUGHTERHOUSE"],
          input: false,
          returned: false,
        },
        isActive: {
          type: "boolean",
          defaultValue: true,
          input: false,
          returned: false,
        },
        slaughterhouseId: {
          type: "string",
          required: false,
          input: false,
          returned: false,
        },
      },
    },
    session: {
      expiresIn: SESSION_MAX_AGE_SECONDS,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    advanced: {
      database: { generateId: "uuid" },
      cookiePrefix: "cotaroba",
      useSecureCookies: config.baseURL.startsWith("https://"),
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: { "/sign-in/email": { window: 60, max: 5 } },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await database.user.findUnique({
              where: { id: session.userId },
              select: {
                isActive: true,
                role: true,
                slaughterhouse: { select: { isActive: true } },
              },
            });
            if (
              !user?.isActive ||
              (user.role === "SLAUGHTERHOUSE" && !user.slaughterhouse?.isActive)
            ) {
              throw new APIError("UNAUTHORIZED", {
                message: "E-mail ou senha inválidos.",
              });
            }
            // Bound even sessions created with rememberMe=false (the provider uses one day there).
            return {
              data: {
                ...session,
                expiresAt: new Date(
                  Math.min(
                    session.expiresAt.getTime(),
                    Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
                  ),
                ),
              },
            };
          },
        },
      },
    },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  auth ??= createAuth(getDatabase(), parseAuthConfig(process.env));
  return auth;
}

// Keep the HTTP surface limited to the login/logout implemented in this stage.
export async function handleAuthRequest(
  request: Request,
  instance?: ReturnType<typeof createAuth>,
) {
  const pathname = new URL(request.url).pathname;
  if (
    request.method !== "POST" ||
    !["/api/auth/sign-in/email", "/api/auth/sign-out"].includes(pathname)
  ) {
    return Response.json({ message: "Não encontrado." }, { status: 404 });
  }

  return (instance ?? getAuth()).handler(request);
}
