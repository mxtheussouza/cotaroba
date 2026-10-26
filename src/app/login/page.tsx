import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Entrar | Cotaroba",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/acesso");
  return (
    <main className="mx-auto w-full max-w-md px-6 py-12 sm:py-16">
      <Link href="/" className="text-xl font-bold text-primary">
        Cotaroba
      </Link>
      <section className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Entrar</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Acesso de gestores e frigoríficos. Use as credenciais fornecidas pelo
          responsável.
        </p>
        <LoginForm />
      </section>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-semibold text-primary underline underline-offset-4"
      >
        Voltar ao portal público
      </Link>
    </main>
  );
}
