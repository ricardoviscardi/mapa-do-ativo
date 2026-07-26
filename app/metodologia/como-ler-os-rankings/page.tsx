import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Como ler os rankings | Mapa do Ativo",
  description: "Entenda como usar rankings, indicadores e filtros do Mapa do Ativo para comparar ações e FIIs com mais contexto.",
  alternates: { canonical: "/metodologia/como-ler-os-rankings" },
};

const steps = [
  {
    title: "1. Compare ativos parecidos",
    text: "Indicadores como Dividend Yield, P/L, P/VP, ROE, patrimônio e volume fazem mais sentido quando usados entre ativos do mesmo universo.",
  },
  {
    title: "2. Use setor e segmento como contexto",
    text: "Empresas e fundos podem ter dinâmicas muito diferentes. Filtros por setor e segmento ajudam a evitar comparações fora de contexto.",
  },
  {
    title: "3. Cuidado com eventos fora do padrão",
    text: "Proventos extraordinários, amortizações e movimentos pontuais podem distorcer indicadores. Por padrão, os rankings evitam transformar esses casos em destaque recorrente.",
  },
  {
    title: "4. Use como ponto de partida",
    text: "As páginas ajudam a organizar a análise, mas não substituem estudo individual, objetivo financeiro ou avaliação de risco.",
  },
];

export default function HowToReadRankingsPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Metodologia"
        title="Como ler os rankings"
        description="Veja como usar os rankings do Mapa do Ativo para comparar ações e FIIs de forma simples, objetiva e contextualizada."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {steps.map((step) => (
          <Card key={step.title}>
            <h2 className="text-2xl font-bold">{step.title}</h2>
            <p className="mt-3 leading-7 text-[var(--color-muted)]">{step.text}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-bold">Filtros disponíveis</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["Lista principal", "Mostra uma seleção mais enxuta para leitura rápida."],
            ["Lista ampliada", "Abre mais possibilidades para comparação."],
            ["Casos atípicos", "Inclui eventos que merecem leitura separada antes de comparar como recorrentes."],
          ].map(([label, text]) => (
            <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">
              <p className="font-bold text-[var(--color-primary)]">{label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-bold">O que observar antes de comparar</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
          <li className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">Dividend Yield alto deve ser lido junto com recorrência, preço da cota ou ação e histórico de pagamentos.</li>
          <li className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">P/L, P/VP, ROE e ROIC fazem mais sentido quando comparados entre empresas parecidas.</li>
          <li className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">Em FIIs, segmento, patrimônio, liquidez, vacância e tipo de rendimento ajudam a dar contexto ao número principal.</li>
        </ul>
      </Card>
    </section>
  );
}
