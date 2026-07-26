import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato com o Mapa do Ativo para sugestões, correções e parcerias."
};

export default function ContactPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Contato"
        title="Fale com o Mapa do Ativo"
        description="Use este canal para sugestões, correções, contato institucional e oportunidades de parceria."
      />

      <Card>
        <h2 className="text-xl font-bold">E-mail</h2>
        <p className="mt-3 leading-7 text-[var(--color-muted)]">
          Envie uma mensagem para <a className="font-semibold text-[var(--color-primary)]" href="mailto:contato@mapadoativo.com.br">contato@mapadoativo.com.br</a>.
        </p>
        <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
          O Mapa do Ativo é uma plataforma educacional e informativa. As informações
          exibidas não constituem recomendação individualizada de compra, venda ou
          manutenção de ativos.
        </p>
      </Card>
    </section>
  );
}
