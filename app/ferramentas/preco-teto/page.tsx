import type { Metadata } from "next";
import { PriceCeilingCalculator } from "@/components/tools/PriceCeilingCalculator";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildAssetDirectory } from "@/lib/directories/asset-directory-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Calculadora de preço-teto por dividendos | Mapa do Ativo",
  description: "Simule um preço de referência com base em dividendos, retorno desejado e premissas de crescimento usando Bazin ou Gordon.",
  alternates: { canonical: "/ferramentas/preco-teto" },
};

export default async function PriceCeilingPage() {
  const [stocks, fiis] = await Promise.all([
    buildAssetDirectory("stock"),
    buildAssetDirectory("fii"),
  ]);

  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Ferramentas"
        title="Calculadora de preço-teto por premissas"
        description="Calcule um preço de referência usando dividendos anuais, retorno desejado e crescimento esperado. O resultado é uma simulação educacional, não uma recomendação de compra."
      />
      <PriceCeilingCalculator assets={[...stocks, ...fiis]} />
    </section>
  );
}
