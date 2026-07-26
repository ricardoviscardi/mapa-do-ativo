import type { Metadata } from "next";
import Link from "next/link";
import { AssetDirectoryClient } from "@/components/directories/AssetDirectoryClient";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildAssetDirectory } from "@/lib/directories/asset-directory-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ações brasileiras: diretório com filtros por setor e indicadores",
  description:
    "Consulte ações brasileiras por ticker, setor, filtros práticos, dividend yield, P/L, P/VP, valor de mercado e volume.",
  alternates: {
    canonical: "/acoes"
  }
};

export default async function StocksPage() {
  const items = await buildAssetDirectory("stock");

  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Ações"
        title="Diretório de ações brasileiras"
        description="Pesquise ações por ticker ou nome, filtre por setor e compare indicadores antes de abrir a página completa do ativo."
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Dividendos", href: "/acoes/dividendos", text: "Entenda DY, payout, recorrência e riscos de eventos atípicos." },
          { label: "Melhores ações", href: "/acoes/melhores-acoes", text: "Veja como combinar filtros de preço, retorno e contexto." },
          { label: "Ibovespa", href: "/acoes/ibovespa", text: "Use o índice como referência para comparar ações relevantes." },
          { label: "Indicadores", href: "/acoes/indicadores", text: "Veja P/L, P/VP, ROE, ROIC e como combinar métricas." },
          { label: "Valor de mercado", href: "/acoes/valor-de-mercado", text: "Compare porte, liquidez e concentração das empresas." },
          { label: "Setores", href: "/acoes/setores", text: "Compare empresas do mesmo setor com mais contexto." },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full bg-gradient-to-br from-white to-blue-50/40 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]">
              <p className="font-bold text-[var(--color-primary)]">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.text}</p>
            </Card>
          </Link>
        ))}
      </div>

      <AssetDirectoryClient kind="stock" items={items} />
    </section>
  );
}
