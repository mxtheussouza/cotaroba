import { requireRole } from "@/features/auth/session";
import { createCategoryAction } from "@/features/slaughterhouses/actions";
import {
  Feedback,
  type ManagementSearch,
} from "@/features/slaughterhouses/feedback";
import { ManagerShell } from "@/features/slaughterhouses/manager-shell";
import { listCategoriesForManager } from "@/features/slaughterhouses/service";
import { SubmitButton } from "@/features/slaughterhouses/submit-button";
import { getDatabase } from "@/lib/db";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<ManagementSearch>;
}) {
  const user = await requireRole("MANAGER");
  const categories = await listCategoriesForManager(getDatabase(), user.id);
  return (
    <ManagerShell user={user} title="Categorias">
      <p className="mt-4 text-muted">
        Cadastre as categorias comerciais usadas nas cotações dos frigoríficos.
      </p>
      <Feedback search={await searchParams} />
      <section
        className="mt-8 max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8"
        aria-labelledby="new-category-title"
      >
        <h2 id="new-category-title" className="text-2xl font-bold">
          Cadastrar categoria
        </h2>
        <form action={createCategoryAction} className="mt-6 space-y-6">
          <div>
            <label
              htmlFor="category-name"
              className="block text-sm font-semibold"
            >
              Nome da categoria
            </label>
            <input
              id="category-name"
              name="name"
              required
              maxLength={120}
              aria-describedby="category-hint"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base"
            />
            <p id="category-hint" className="mt-2 text-sm text-muted">
              Até 120 caracteres. Cada categoria deve ter um nome único.
            </p>
          </div>
          <SubmitButton>Cadastrar categoria</SubmitButton>
        </form>
      </section>
      <section className="mt-8 max-w-2xl" aria-labelledby="categories-title">
        <h2 id="categories-title" className="text-2xl font-bold">
          Categorias cadastradas
        </h2>
        {categories.length === 0 ? (
          <p className="mt-4 text-muted">Nenhuma categoria cadastrada.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface px-6">
            {categories.map((category) => (
              <li key={category.id} className="py-4">
                {category.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </ManagerShell>
  );
}
