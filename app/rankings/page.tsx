import type { Metadata } from "next";
import Link from "next/link";
import { RankingSelector } from "@/components/rankings/RankingSelector";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { rankingDefinitions } from "@/lib/rankings/ranking-definitions";
import { buildRankingGroups } from "@/lib/rankings/ranking-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Rankings de ações e FIIs com filtros",
  description:
    "Compare ações brasileiras e FIIs por dividend yield, P/L, P/VP, ROE, ROIC, valor de mercado, patrimônio e volume com filtros práticos por setor e segmento.",
};

const trustCards = [
  {
    title: "Filtros claros",
    description: "Cada ranking organiza ativos por indicador, setor, segmento, histórico e liquidez para facilitar uma leitura mais objetiva.",
  },
  {
    title: "Casos atípicos ficam separados",
    description: "Eventos extraordinários, amortizações e variações fora do padrão não aparecem como renda recorrente por padrão.",
  },
  {
    title: "Páginas com intenção prática",
    description: "Os rankings têm páginas próprias, metodologia, FAQ e links para glossário e ativos relacionados.",
  },
];

export default async function RankingsPage() {
  const groups = await buildRankingGroups(rankingDefinitions);
  const stockPages = rankingDefinitions.filter((ranking) => ranking.kind === "stock");
  const fiiPages = rankingDefinitions.filter((ranking) => ranking.kind === "fii");

  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Rankings"
        title="Rankings de ações e FIIs com filtros práticos"
        description="Compare ativos brasileiros por indicadores relevantes, com filtros de setor, segmento e histórico. A proposta é facilitar a leitura sem excesso de ruído."
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {trustCards.map((card) => (
          <Card key={card.title} className="bg-gradient-to-br from-white to-blue-50/40">
            <h2 className="text-lg font-bold">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{card.description}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Páginas de ranking
            </p>
            <h2 className="mt-2 text-2xl font-bold">Rankings prontos para consultas específicas</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              O glossário explica os conceitos. Estas páginas ajudam em consultas práticas, como “ações com maior dividend yield” ou “FIIs com menor P/VP”.
            </p>
          </div>
          <Link
            href="/glossario"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
          >
            Ver glossário
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">
            <h3 className="font-bold">Ações</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {stockPages.map((ranking) => (
                <Link
                  key={ranking.slug}
                  href={`/rankings/${ranking.slug}`}
                  className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
                >
                  {ranking.shortTitle}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">
            <h3 className="font-bold">FIIs</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {fiiPages.map((ranking) => (
                <Link
                  key={ranking.slug}
                  href={`/rankings/${ranking.slug}`}
                  className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
                >
                  {ranking.shortTitle}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <RankingSelector stocks={groups.stocks} fiis={groups.fiis} />
    </section>
  );
}
