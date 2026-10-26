"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "./client";
import { loginSchema } from "./schema";
import { getLoginErrorMessage, loginErrorCodeForStatus } from "./login-errors";

export function LoginForm({ initialError = "" }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: data.get("email"),
      password: data.get("password"),
    });
    if (!parsed.success) {
      setError("Informe um e-mail válido e sua senha.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.email({
        ...parsed.data,
        rememberMe: false,
      });
      if (result.error) {
        setError(
          getLoginErrorMessage(loginErrorCodeForStatus(result.error.status)),
        );
        return;
      }
      router.replace("/acesso");
      router.refresh();
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      method="post"
      action="/api/auth/login"
      onSubmit={handleSubmit}
      className="mt-8 space-y-6"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="username"
          aria-describedby={error ? "login-error" : undefined}
          className="mt-2 w-full rounded-xl border border-border bg-surface p-3"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          maxLength={128}
          autoComplete="current-password"
          aria-describedby={error ? "login-error" : undefined}
          className="mt-2 w-full rounded-xl border border-border bg-surface p-3"
        />
      </div>
      {error && (
        <p id="login-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-sm leading-relaxed text-muted">
        Se precisar de ajuda com seu acesso, procure o gestor responsável.
      </p>
    </form>
  );
}
