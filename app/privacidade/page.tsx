import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { CookiePreferencesButton } from "@/components/privacy/CookiePreferencesButton";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Mapa do Ativo trata dados, cookies e informações de uso do site."
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      description="Transparência sobre os dados tratados durante o uso do Mapa do Ativo. Última atualização: 29 de julho de 2026."
      sections={[
        {
          title: "1. Responsável e contato",
          content: (
            <>
              O Mapa do Ativo é responsável pelo tratamento descrito nesta política. Solicitações sobre
              privacidade, acesso, correção ou eliminação de dados podem ser enviadas para{" "}
              <a className="font-semibold text-[var(--color-primary)] underline" href="mailto:contato@mapadoativo.com.br">
                contato@mapadoativo.com.br
              </a>
              .
            </>
          )
        },
        {
          title: "2. Dados fornecidos pelo visitante",
          content:
            "O uso das páginas públicas não exige cadastro. Quando o visitante entra em contato, podemos tratar os dados informados na própria mensagem, como nome, e-mail e conteúdo da solicitação, apenas para responder e manter o atendimento necessário."
        },
        {
          title: "3. Dados técnicos essenciais",
          content:
            "A infraestrutura pode processar informações técnicas necessárias para segurança, disponibilidade e entrega do site, como endereço IP, data e hora da requisição, navegador, dispositivo e registros de erro. Esses dados não são usados pelo Mapa do Ativo para criar perfis financeiros individuais."
        },
        {
          title: "4. Google Analytics e cookies analíticos",
          content:
            "Com consentimento, o site carrega o Google Analytics 4 para produzir estatísticas agregadas, como páginas acessadas, origem aproximada do tráfego, tipo de dispositivo e interações gerais. Recursos de personalização publicitária e Google Signals permanecem desativados nesta implementação. Sem consentimento, a tag analítica não é carregada pelo site."
        },
        {
          title: "5. Escolha e alteração do consentimento",
          content: (
            <div className="space-y-3">
              <p>
                A decisão de aceitar ou recusar cookies analíticos é armazenada localmente no navegador.
                Você pode rever essa escolha a qualquer momento. Ao recusar depois de uma aceitação, o site
                interrompe novos eventos analíticos e tenta remover cookies do Google Analytics criados neste domínio.
              </p>
              <CookiePreferencesButton className="focus-ring rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-background-alt)]" />
            </div>
          )
        },
        {
          title: "6. Compartilhamento e operadores",
          content:
            "Os dados podem ser processados por fornecedores necessários à operação do site, especialmente Vercel, Supabase e, quando autorizado, Google Analytics. Cada fornecedor trata informações conforme seus próprios termos, medidas de segurança e localização de infraestrutura."
        },
        {
          title: "7. Segurança e retenção",
          content:
            "Adotamos medidas razoáveis para restringir acessos e reduzir riscos. Os dados são mantidos pelo período necessário às finalidades descritas, ao funcionamento técnico, ao atendimento de solicitações e ao cumprimento de obrigações aplicáveis. Nenhum sistema conectado à internet é totalmente imune a incidentes."
        },
        {
          title: "8. Direitos do titular",
          content:
            "O titular pode solicitar confirmação de tratamento, acesso, correção, informações sobre compartilhamento, oposição, revogação do consentimento e eliminação quando aplicável. A solicitação poderá exigir informações mínimas para confirmar a identidade e evitar acesso indevido."
        },
        {
          title: "9. Atualizações desta política",
          content:
            "Esta política poderá ser atualizada para refletir mudanças no site, nos fornecedores ou nas práticas de privacidade. A data da revisão mais recente será exibida no início desta página."
        }
      ]}
    />
  );
}
