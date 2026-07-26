import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Sobre o Mapa do Ativo",
  description: "Conheça o Mapa do Ativo: dados para analisar ações e FIIs, comparar alternativas e organizar premissas de carteira."
};

export default function AboutPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Sobre"
        title="Mapa do Ativo: do ativo ao patrimônio"
        description="Uma plataforma independente para consultar, comparar e organizar informações de ações brasileiras e FIIs com clareza."
      />

      <div className="grid gap-5">
        <Card>
          <h2 className="text-xl font-bold">O que é o Mapa do Ativo</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O Mapa do Ativo reúne cotação, gráficos, oscilações, dividendos,
            indicadores e dados fundamentalistas em uma experiência limpa e objetiva.
            A ideia é ajudar o investidor a sair da consulta isolada de um ticker para
            uma visão mais organizada de comparação, carteira e evolução patrimonial.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Para quem foi criado</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            A plataforma foi pensada para investidores iniciantes, estudantes e usuários
            que pesquisam ações ou FIIs e querem entender os principais números sem abrir
            várias abas ou navegar por páginas excessivamente técnicas.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Como a plataforma se organiza</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            A estrutura combina diretórios, páginas de ativos, rankings, comparador,
            glossário, metodologia e ferramentas interativas. Essa arquitetura permite
            analisar um ativo, comparar alternativas e montar uma leitura inicial da
            carteira em um só ambiente.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Contato</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Para sugestões, correções, parcerias ou contato institucional, envie uma
            mensagem para <a className="font-semibold text-[var(--color-primary)]" href="mailto:contato@mapadoativo.com.br">contato@mapadoativo.com.br</a>.
          </p>
        </Card>
      </div>
    </section>
  );
}
