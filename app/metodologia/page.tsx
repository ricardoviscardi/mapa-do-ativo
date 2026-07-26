import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Metodologia",
  description:
    "Entenda como o Mapa do Ativo organiza cotações, indicadores e dados fundamentalistas para consulta educacional."
};

export default function MethodologyPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Metodologia"
        title="Como o Mapa do Ativo organiza as informações"
        description="Nossa proposta é transformar dados financeiros em uma experiência simples, objetiva e fácil de consultar."
      />

      <div className="grid gap-5">
        <Card>
          <h2 className="text-xl font-bold">Organização dos dados</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O Mapa do Ativo consolida informações de mercado, histórico de preços,
            proventos, indicadores e dados fundamentalistas em uma estrutura padronizada.
            O objetivo é facilitar a leitura e reduzir ruído na comparação entre ativos.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Indicadores e cálculos</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Indicadores como Dividend Yield, P/VP, valor patrimonial, margem,
            rentabilidade e valor de mercado podem ser exibidos diretamente ou calculados
            a partir das informações organizadas no projeto.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Histórico e atualização</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O histórico de preços e proventos é organizado para permitir consulta por
            períodos e visualização evolutiva dos ativos. As informações acompanham a
            rotina de atualização do mercado.
          </p>
        </Card>


        <Card>
          <h2 className="text-xl font-bold">Dados em atualização</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Quando uma fonte não retorna volume, segmento, indicador ou série confiável,
            a plataforma sinaliza o campo em atualização em vez de exibir um número que
            possa parecer definitivo.
          </p>
          <Link
            href="/metodologia/dados-em-atualizacao"
            className="mt-4 inline-flex min-h-10 items-center rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
          >
            Entender dados em atualização
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Qualidade dos dados</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O Mapa do Ativo usa filtros de consistência para cotações, históricos,
            dividendos e indicadores, priorizando uma leitura pública prudente.
          </p>
          <Link
            href="/metodologia/qualidade-dos-dados"
            className="mt-4 inline-flex min-h-10 items-center rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
          >
            Ver critérios de qualidade
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Como ler os rankings</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Os rankings usam filtros práticos para ordenar ativos e separar casos atípicos,
            como proventos extraordinários e amortizações, sem transformar eventos pontuais
            em leitura de renda recorrente.
          </p>
          <Link
            href="/metodologia/como-ler-os-rankings"
            className="mt-4 inline-flex min-h-10 items-center rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
          >
            Como ler os rankings
          </Link>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Aviso importante</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            As informações exibidas têm finalidade educacional e informativa. Elas não
            constituem recomendação de compra, venda ou manutenção de ativos, nem
            substituem a análise individual do investidor.
          </p>
        </Card>
      </div>
    </section>
  );
}
