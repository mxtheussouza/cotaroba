import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <h1 className="text-3xl font-bold">Acesso não permitido</h1>
      <p className="mt-6 leading-relaxed text-muted">
        Seu perfil não tem permissão para acessar esta área.
      </p>
      <Link
        href="/acesso"
        className="mt-8 inline-block font-semibold text-primary underline underline-offset-4"
      >
        Voltar à minha área
      </Link>
    </main>
  );
}
