import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { glossaryItems } from "@/lib/glossary-data";

export const metadata: Metadata = {
  title: "Glossário de Indicadores Fundamentalistas",
  description:
    "Entenda P/L, P/VP, Dividend Yield, ROE, ROIC, payout, liquidez, vacância, IFIX, Ibovespa e outros conceitos usados para analisar ações e FIIs.",
  alternates: {
    canonical: "/glossario",
  },
};

const categories = [
  {
    title: "Ações",
    description: "Indicadores de preço, lucro, rentabilidade, dívida e valor de mercado.",
    terms: ["pl", "lpa", "roe", "roa", "roic", "margem-liquida", "ev-ebitda", "divida-liquida-ebitda", "divida-liquida", "valor-de-mercado"],
  },
  {
    title: "Dividendos e renda",
    description: "Conceitos que ajudam a separar renda recorrente de eventos atípicos.",
    terms: ["dividend-yield", "payout", "provento-extraordinario", "amortizacao"],
  },
  {
    title: "FIIs",
    description: "Métricas de patrimônio, cota, segmento, vacância e rendimentos.",
    terms: ["pvp", "valor-patrimonial-por-cota", "patrimonio-liquido", "vacancia", "segmento-de-fii", "ifix"],
  },
  {
    title: "Mercado e liquidez",
    description: "Indicadores e referências para entender negociação e comparação de mercado.",
    terms: ["liquidez-diaria", "volume-negociado", "ibovespa", "cagr", "vpa"],
  },
];

function itemBySlug(slug: string) {
  return glossaryItems.find((item) => item.slug === slug);
}

export default function GlossaryPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Glossário"
        title="Entenda os indicadores antes de comparar ativos"
        description="O glossário explica os conceitos. Os rankings aplicam esses conceitos na prática. Assim evitamos páginas duplicadas e damos mais contexto para quem está começando."
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-blue-50/40">
          <h2 className="text-lg font-bold">Explicação simples</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Cada termo tem fórmula, exemplo prático, interpretação, cuidados e perguntas frequentes.
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-blue-50/40">
          <h2 className="text-lg font-bold">Ligado aos rankings</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Indicadores como DY, P/L, P/VP e ROE apontam para rankings relacionados, sem duplicar conteúdo.
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-blue-50/40">
          <h2 className="text-lg font-bold">Cuidados claros</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            O conteúdo destaca armadilhas como proventos extraordinários, amortizações, dados atípicos e comparações ruins.
          </p>
        </Card>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => (
          <Card key={category.title}>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text)]">{category.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{category.description}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {category.terms.map((slug) => {
                const item = itemBySlug(slug);
                if (!item) return null;

                return (
                  <Link
                    key={item.slug}
                    href={`/glossario/${item.slug}`}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-white hover:shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">{item.term}</p>
                    <h3 className="mt-2 font-bold text-[var(--color-text)]">{item.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-muted)]">{item.explanation}</p>
                  </Link>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">Aviso importante</h2>
        <p className="mt-3 leading-7 text-[var(--color-muted)]">
          Indicadores ajudam a organizar a análise, mas não devem ser usados isoladamente. Empresas do mesmo setor podem ser comparadas com mais segurança do que empresas de setores diferentes. As informações do Mapa do Ativo têm finalidade educacional e não são recomendação de investimento.
        </p>
      </Card>
    </section>
  );
}
