import type { Metadata } from "next";
import { ComparatorClient } from "@/components/comparator/ComparatorClient";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildAssetDirectory } from "@/lib/directories/asset-directory-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Comparador de ações e FIIs: indicadores lado a lado",
  description: "Compare ações brasileiras e FIIs por preço, dividend yield, P/L, P/VP, setor, volume e histórico.",
  alternates: { canonical: "/comparador" },
};

export default async function ComparatorPage() {
  const [stocks, fiis] = await Promise.all([
    buildAssetDirectory("stock"),
    buildAssetDirectory("fii"),
  ]);

  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Comparador"
        title="Compare ações e FIIs lado a lado"
        description="Uma tela objetiva para comparar indicadores, contexto e histórico antes de aprofundar a análise em cada ativo."
      />
      <ComparatorClient stocks={stocks} fiis={fiis} />
    </section>
  );
}
