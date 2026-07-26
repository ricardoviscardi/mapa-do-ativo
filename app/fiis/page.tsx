import type { Metadata } from "next";
import Link from "next/link";
import { AssetDirectoryClient } from "@/components/directories/AssetDirectoryClient";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildAssetDirectory } from "@/lib/directories/asset-directory-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FIIs brasileiros: diretório com filtros por segmento, DY e P/VP",
  description:
    "Consulte fundos imobiliários por ticker, segmento, filtros práticos, dividend yield, P/VP, patrimônio, liquidez e preço da cota.",
  alternates: {
    canonical: "/fiis"
  }
};

export default async function FIIsPage() {
  const items = await buildAssetDirectory("fii");

  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="FIIs"
        title="Diretório de fundos imobiliários"
        description="Pesquise FIIs por ticker ou nome, filtre por segmento e compare DY, P/VP, patrimônio e liquidez antes de abrir o fundo."
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Rendimentos", href: "/fiis/rendimentos", text: "Entenda renda recorrente, amortização e eventos atípicos." },
          { label: "Melhores FIIs", href: "/fiis/melhores-fiis", text: "Combine DY, P/VP, patrimônio, liquidez e segmento." },
          { label: "IFIX", href: "/fiis/ifix", text: "Entenda o índice de FIIs como referência de mercado." },
          { label: "Dividend Yield", href: "/fiis/dividend-yield", text: "Veja como interpretar DY em FIIs sem cair em distorções." },
          { label: "P/VP", href: "/fiis/pvp", text: "Compare preço da cota e patrimônio por cota." },
          { label: "Segmentos", href: "/fiis/segmentos", text: "Compare papel, logística, shopping, lajes e híbridos." },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full bg-gradient-to-br from-white to-blue-50/40 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]">
              <p className="font-bold text-[var(--color-primary)]">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.text}</p>
            </Card>
          </Link>
        ))}
      </div>

      <AssetDirectoryClient kind="fii" items={items} />
    </section>
  );
}
