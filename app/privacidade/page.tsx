import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade do Mapa do Ativo."
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      description="Esta página deve ser revisada antes da publicação final."
      sections={[
        { title: "Coleta de dados", content: "O Mapa do Ativo deve coletar apenas dados necessários para funcionamento, análise de tráfego e melhoria da experiência." },
        { title: "Cookies e analytics", content: "Quando ferramentas como Google Analytics forem ativadas, o usuário deverá ser informado conforme a legislação aplicável." },
        { title: "Contato", content: "Inclua aqui um canal de contato oficial para solicitações relacionadas à privacidade." }
      ]}
    />
  );
}
