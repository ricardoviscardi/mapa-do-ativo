import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Como interpretar dados em atualização",
  description:
    "Entenda como ler campos em atualização, dados ausentes e séries filtradas no Mapa do Ativo sem confundir ausência de fonte com erro de análise.",
  alternates: { canonical: "/metodologia/dados-em-atualizacao" },
};

const cases = [
  {
    title: "Volume em atualização",
    text: "Aparece quando a fonte não retorna volume confiável para o ativo naquele momento. O ativo continua válido para consulta, mas o volume não deve ser usado como critério principal até nova atualização.",
  },
  {
    title: "Indicador não disponível",
    text: "Significa que o dado não passou pelo filtro de qualidade ou não foi retornado pela fonte integrada. É diferente de zero: zero é um número; não disponível é ausência de amostra confiável.",
  },
  {
    title: "Histórico consistente",
    text: "O gráfico prioriza séries com variação suficiente e remove pontos claramente incompatíveis, como zeros, valores negativos ou repetições artificiais que poderiam distorcer a leitura visual.",
  },
  {
    title: "Segmento em atualização",
    text: "Em FIIs, o segmento pode depender da fonte de dados. Quando não há classificação confiável, o Mapa do Ativo prefere sinalizar atualização em vez de mostrar um rótulo genérico como se fosse definitivo.",
  },
];

export default function DataUpdatingPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Metodologia"
        title="Como interpretar dados em atualização"
        description="Campos em atualização não significam necessariamente erro. Eles indicam que o dado não estava confiável o suficiente para ser exibido como informação definitiva."
      />

      <div className="grid gap-5">
        <Card>
          <h2 className="text-xl font-bold">Regra principal</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O Mapa do Ativo prefere mostrar menos dados a exibir números que pareçam exatos, mas estejam incompletos,
            zerados, atrasados ou incompatíveis com a série do ativo. Essa escolha protege a leitura do usuário e reduz
            o risco de conclusões distorcidas.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {cases.map((item) => (
            <Card key={item.title}>
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mt-3 leading-7 text-[var(--color-muted)]">{item.text}</p>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="text-xl font-bold">Como usar na prática</h2>
          <div className="mt-3 grid gap-3 text-sm leading-6 text-[var(--color-muted)] md:grid-cols-3">
            <p>Compare ativos do mesmo setor ou segmento antes de tirar conclusões.</p>
            <p>Use rankings como ponto de partida, não como recomendação automática.</p>
            <p>Quando um dado estiver em atualização, confirme o contexto antes de usar a métrica como critério decisivo.</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Páginas relacionadas</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)]" href="/metodologia/como-ler-os-rankings">
              Como ler os rankings
            </Link>
            <Link className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)]" href="/metodologia/qualidade-dos-dados">
              Qualidade dos dados
            </Link>
            <Link className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)]" href="/rankings">
              Ver rankings
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
