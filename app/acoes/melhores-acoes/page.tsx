import { FeaturedRankingPreview } from "@/components/content/FeaturedRankingPreview";
import { HubJsonLd } from "@/components/content/HubJsonLd";
import { SeoHubPage } from "@/components/content/SeoHubPage";
import { stockBestHub } from "@/lib/content/hub-pages";
import { buildFeaturedRankings } from "@/lib/content/featured-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = stockBestHub.metadata;

export default async function Page() {
  const featuredRankings = await buildFeaturedRankings(['maiores-roe', 'maiores-roic', 'menores-pl', 'maiores-dividend-yield']);

  return (
    <>
      <HubJsonLd page={stockBestHub} id="stock-best" />
      <SeoHubPage {...stockBestHub} />
      <section className="container-page pb-10">
        <FeaturedRankingPreview tables={featuredRankings} />
      </section>
    </>
  );
}
