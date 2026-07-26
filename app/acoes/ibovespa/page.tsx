import { FeaturedRankingPreview } from "@/components/content/FeaturedRankingPreview";
import { HubJsonLd } from "@/components/content/HubJsonLd";
import { SeoHubPage } from "@/components/content/SeoHubPage";
import { stockIbovespaHub } from "@/lib/content/hub-pages";
import { buildFeaturedRankings } from "@/lib/content/featured-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = stockIbovespaHub.metadata;

export default async function Page() {
  const featuredRankings = await buildFeaturedRankings(['maiores-valor-de-mercado', 'acoes-mais-negociadas']);

  return (
    <>
      <HubJsonLd page={stockIbovespaHub} id="stock-ibovespa" />
      <SeoHubPage {...stockIbovespaHub} />
      <section className="container-page pb-10">
        <FeaturedRankingPreview tables={featuredRankings} />
      </section>
    </>
  );
}
