import Link from "next/link";

import { requireRole } from "@/features/auth/session";
import { createSlaughterhouseAction } from "@/features/slaughterhouses/actions";
import {
  Feedback,
  type ManagementSearch,
} from "@/features/slaughterhouses/feedback";
import { SlaughterhouseFields } from "@/features/slaughterhouses/forms";
import { ManagerShell } from "@/features/slaughterhouses/manager-shell";
import { listRegions } from "@/features/slaughterhouses/service";
import { SubmitButton } from "@/features/slaughterhouses/submit-button";
import { getDatabase } from "@/lib/db";

export default async function NewSlaughterhousePage({
  searchParams,
}: {
  searchParams: Promise<ManagementSearch>;
}) {
  const user = await requireRole("MANAGER");
  const regions = await listRegions(getDatabase(), user.id);
  return (
    <ManagerShell user={user} title="Cadastrar frigorífico">
      <Feedback search={await searchParams} />
      <section className="mt-8 max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8">
        {regions.length === 0 && (
          <p className="mb-6 text-muted">
            Cadastre uma região antes de cadastrar o frigorífico.{" "}
            <Link
              href="/gestor/regioes"
              className="font-semibold text-primary underline"
            >
              Cadastrar região
            </Link>
          </p>
        )}
        <form action={createSlaughterhouseAction} className="space-y-6">
          <SlaughterhouseFields regions={regions} />
          <SubmitButton disabled={regions.length === 0}>
            Salvar frigorífico
          </SubmitButton>
        </form>
      </section>
      <Link
        href="/gestor"
        className="mt-6 inline-block font-semibold text-primary underline"
      >
        Voltar aos frigoríficos
      </Link>
    </ManagerShell>
  );
}
