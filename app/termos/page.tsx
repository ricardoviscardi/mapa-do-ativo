import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso do Mapa do Ativo."
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      description="Esta página deve ser revisada antes da publicação final."
      sections={[
        { title: "Finalidade informativa", content: "As informações exibidas no Mapa do Ativo têm finalidade educacional e informativa." },
        { title: "Não recomendação", content: "O conteúdo do site não constitui recomendação de compra, venda ou manutenção de ativos." },
        { title: "Possíveis divergências", content: "Dados financeiros podem apresentar atrasos, diferenças entre fontes ou indisponibilidade temporária." }
      ]}
    />
  );
}
