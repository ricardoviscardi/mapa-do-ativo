import type { Metadata } from "next";
import { PortfolioXRayClient } from "@/components/tools/PortfolioXRayClient";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildAssetDirectory } from "@/lib/directories/asset-directory-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Raio-X de carteira de ações e FIIs | Mapa do Ativo",
  description: "Monte uma carteira hipotética e veja distribuição entre ações, FIIs, setores, segmentos, DY médio e concentração.",
  alternates: { canonical: "/ferramentas/raio-x-carteira" },
};

export default async function PortfolioXRayPage() {
  const [stocks, fiis] = await Promise.all([
    buildAssetDirectory("stock"),
    buildAssetDirectory("fii"),
  ]);

  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Ferramentas"
        title="Raio-X de carteira"
        description="Digite tickers e pesos aproximados para visualizar alocação entre ações, FIIs, setores, segmentos e rendimento médio estimado. Nenhum dado pessoal é necessário."
      />
      <PortfolioXRayClient stocks={stocks} fiis={fiis} />
    </section>
  );
}
