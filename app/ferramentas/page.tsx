import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { ToolsShowcase } from "@/components/tools/ToolsShowcase";

export const metadata: Metadata = {
  title: "Ferramentas para ações e FIIs | Mapa do Ativo",
  description: "Use ferramentas educacionais para comparar ativos, simular proventos, calcular preço de referência e analisar uma carteira de ações e FIIs.",
  alternates: { canonical: "/ferramentas" },
};

export default function ToolsPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Ferramentas"
        title="Ferramentas para ir do ativo à carteira"
        description="Simule cenários, compare ativos e organize premissas de carteira. As ferramentas são educacionais e usam os dados como ponto de partida."
      />

      <ToolsShowcase />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Simulação</p>
          <h2 className="mt-2 text-xl font-bold">Premissas ajustáveis</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Você define retorno desejado, prazo, aportes e crescimento esperado.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Comparação</p>
          <h2 className="mt-2 text-xl font-bold">Ativos lado a lado</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Compare preço, DY, múltiplos, setor e volume antes de aprofundar.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">Carteira</p>
          <h2 className="mt-2 text-xl font-bold">Raio-X visual</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Veja alocação entre ações, FIIs, setores e segmentos de forma simples.</p>
        </Card>
      </div>
    </section>
  );
}
