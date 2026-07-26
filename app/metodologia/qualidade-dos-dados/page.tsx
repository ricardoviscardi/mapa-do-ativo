import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Qualidade dos dados",
  description:
    "Entenda os filtros de qualidade usados pelo Mapa do Ativo para cotações, históricos, indicadores, dividendos e rankings.",
  alternates: { canonical: "/metodologia/qualidade-dos-dados" },
};

const rules = [
  {
    title: "Cotação e preço",
    text: "Preços zerados, negativos ou claramente incompatíveis são descartados. Quando a cotação do dia não é confiável, o sistema pode usar o último fechamento válido ou marcar o campo como indisponível.",
  },
  {
    title: "Histórico de preços",
    text: "Séries com pouca variação, pontos repetidos em excesso ou quedas incompatíveis são tratadas com cautela. O gráfico só deve aparecer quando houver amostra visual útil.",
  },
  {
    title: "Indicadores",
    text: "Múltiplos muito fora de faixa, valores sem base de cálculo ou indicadores que não fazem sentido para o tipo de ativo podem ser ocultados da leitura pública.",
  },
  {
    title: "Dividendos e rendimentos",
    text: "Dividend Yield é saneado para reduzir distorções causadas por eventos extraordinários, amortizações, agrupamentos, quedas bruscas de preço ou dados incompatíveis com a série do ativo.",
  },
];

export default function DataQualityPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Metodologia"
        title="Qualidade dos dados no Mapa do Ativo"
        description="A plataforma prioriza consistência visual, prudência nos rankings e transparência quando uma métrica não está pronta para leitura pública."
      />

      <div className="grid gap-5">
        <Card>
          <h2 className="text-xl font-bold">Por que alguns campos somem?</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Alguns dados existem na base, mas deixam de ser exibidos quando não passam nos filtros de confiança. Isso evita que
            um usuário interprete como definitivo um número que pode estar incompleto, fora de escala ou sem amostra suficiente.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((rule) => (
            <Card key={rule.title}>
              <h2 className="text-xl font-bold">{rule.title}</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">{rule.text}</p>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="text-xl font-bold">Leitura recomendada</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Use o Mapa do Ativo como uma camada inicial de organização: veja cotação, histórico, dividendos, fundamentos,
            comparador e rankings. Para decisões financeiras, valide o contexto do ativo e leia documentos oficiais quando necessário.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)]" href="/metodologia/dados-em-atualizacao">
              Dados em atualização
            </Link>
            <Link className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)]" href="/metodologia/criterios-dos-rankings">
              Critérios dos rankings
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
