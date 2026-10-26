import "server-only";

import type { createAuth } from "./auth";
import { loginErrorCodeForStatus, type LoginErrorCode } from "./login-errors";
import { loginSchema } from "./schema";

function redirectToLogin(code: LoginErrorCode) {
  return new Response(null, {
    status: 303,
    headers: { location: `/login?erro=${code}`, "cache-control": "no-store" },
  });
}

async function readLoginForm(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/x-www-form-urlencoded"
  ) {
    throw new Error("Unsupported form encoding");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing form body");
  const decoder = new TextDecoder();
  let bytes = 0;
  let encoded = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8_192) {
        await reader.cancel();
        throw new Error("Form body too large");
      }
      encoded += decoder.decode(value, { stream: true });
    }
    return new URLSearchParams(encoded + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

// Native forms and the enhanced client both pass through the provider's HTTP handler,
// preserving origin checks and the same persistent, atomic login rate limit.
export async function handleAuthForm(
  request: Request,
  auth: ReturnType<typeof createAuth>,
) {
  const isLogin = new URL(request.url).pathname === "/api/auth/login";
  let body: Record<string, unknown> = {};

  if (isLogin) {
    try {
      const form = await readLoginForm(request);
      const parsed = loginSchema.safeParse({
        email: form.get("email"),
        password: form.get("password"),
      });
      if (!parsed.success) return redirectToLogin("dados");
      body = { ...parsed.data, rememberMe: false };
    } catch {
      return redirectToLogin("dados");
    }
  }

  try {
    const url = new URL(
      isLogin ? "/api/auth/sign-in/email" : "/api/auth/sign-out",
      request.url,
    );
    const headers = new Headers(request.headers);
    headers.set("content-type", "application/json");
    headers.delete("content-length");

    const response = await auth.handler(
      new Request(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }),
    );
    if (!response.ok) {
      if (isLogin)
        return redirectToLogin(loginErrorCodeForStatus(response.status));
      return Response.json(
        { message: "Não foi possível sair. Tente novamente." },
        { status: response.status },
      );
    }

    const resultHeaders = new Headers({
      location: isLogin ? "/acesso" : "/login",
      "cache-control": "no-store",
    });
    for (const cookie of response.headers.getSetCookie())
      resultHeaders.append("set-cookie", cookie);
    return new Response(null, { status: 303, headers: resultHeaders });
  } catch {
    if (isLogin) return redirectToLogin("indisponivel");
    return Response.json(
      { message: "Não foi possível sair. Tente novamente." },
      { status: 503 },
    );
  }
}
