import type { Metadata } from "next";
import { IncomeSimulator } from "@/components/tools/IncomeSimulator";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Simulador de proventos e dividendos | Mapa do Ativo",
  description: "Simule aportes, rendimento estimado, reinvestimento de proventos e evolução patrimonial em ações e FIIs.",
  alternates: { canonical: "/ferramentas/simulador-de-proventos" },
};

export default function IncomeSimulatorPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Ferramentas"
        title="Simulador de proventos"
        description="Projete cenários de aportes, reinvestimento e renda estimada. Ajuste as premissas e veja como pequenas mudanças alteram o resultado no longo prazo."
      />
      <IncomeSimulator />
    </section>
  );
}
