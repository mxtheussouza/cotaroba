"use client";

import { useEffect, useState, type ReactNode } from "react";

export function DashboardFilterForm({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const restore = () => setPending(false);
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  return (
    <form
      action="/painel"
      method="get"
      onSubmit={() => setPending(true)}
      className="mt-8 grid gap-5 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Filtros do painel"
    >
      {children}
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Aplicando…" : "Aplicar filtros"}
        </button>
      </div>
    </form>
  );
}
