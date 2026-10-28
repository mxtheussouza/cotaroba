import { PublicShell } from "@/components/public-shell";
import { SimulationForm } from "@/features/simulation/form";

export default function SimulationPage() {
  return (
    <PublicShell
      compact
      title="Simulador de receita e margem"
      description="Compare cenários por animal com os preços e custos que você informar. O resultado é uma estimativa, sem promessa de preço ou de rentabilidade."
    >
      <SimulationForm />
      <details className="mt-6 rounded-xl border border-border bg-secondary p-5 text-sm">
        <summary className="cursor-pointer font-semibold text-primary">
          Como calculamos e quais custos incluir
        </summary>
        <p className="mt-3 text-sm leading-relaxed">
          Arrobas = peso vivo em kg × rendimento (%) ÷ 100 ÷ 15. Receita =
          arrobas × preço da arroba. Margem = receita − custo total informado
          por animal. Uma arroba de carcaça corresponde a 15 kg neste simulador.
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          Informe todas as premissas. Tributos, descontos e despesas só entram
          no resultado se você os incluir no custo total; não há taxas ou
          rendimento presumidos. A margem não inclui custos que você deixar de
          informar. Os valores enviados não são gravados nem adicionados à URL.
        </p>
      </details>
    </PublicShell>
  );
}
