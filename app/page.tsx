import type { Metadata } from "next";
import Link from "next/link";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { HeroSearch } from "@/components/home/HeroSearch";
import { PopularFIIs } from "@/components/home/PopularFIIs";
import { PopularStocks } from "@/components/home/PopularStocks";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ToolsShowcase } from "@/components/tools/ToolsShowcase";

export const metadata: Metadata = {
  title: "Mapa do Ativo: dados para analisar e acompanhar patrimônio",
  description:
    "Pesquise ações brasileiras e FIIs, compare indicadores, simule cenários e organize sua carteira com clareza.",
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  return (
    <>
      <HeroSearch />

      <section className="container-page py-12">
        <PopularStocks />
      </section>

      <section className="container-page py-4">
        <PopularFIIs />
      </section>


      <section className="container-page py-8">
        <SectionHeader
          eyebrow="Ferramentas"
          title="Ferramentas para analisar e acompanhar sua carteira"
          description="Preço-teto, simulação de proventos, comparação lado a lado e raio-x de carteira para transformar dados em contexto."
        />
        <ToolsShowcase />
      </section>

      <section className="container-page py-8">
        <SectionHeader
          eyebrow="Por que usar"
          title="Dados para analisar. Ferramentas para acompanhar."
          description="Do ativo individual à visão de carteira: consulte, compare, simule e acompanhe os principais indicadores em uma experiência limpa."
        />
        <BenefitsSection />
      </section>

      <section className="container-page py-8">
        <Card>
          <h2 className="text-2xl font-bold">Mapa do Ativo — do ativo ao patrimônio</h2>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            O Mapa do Ativo reúne cotação, gráficos, dividendos, indicadores-chave, dados fundamentalistas e ferramentas interativas para apoiar uma leitura mais organizada de ações, FIIs e carteiras. A proposta é transformar dados dispersos em uma visão clara, sem excesso visual e sem recomendação de investimento.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/sobre" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
              Sobre o projeto
            </Link>
            <Link href="/contato" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
              Contato
            </Link>
          </div>
        </Card>
      </section>
    </>
  );
}
