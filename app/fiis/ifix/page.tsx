import { FeaturedRankingPreview } from "@/components/content/FeaturedRankingPreview";
import { HubJsonLd } from "@/components/content/HubJsonLd";
import { SeoHubPage } from "@/components/content/SeoHubPage";
import { fiiIfixHub } from "@/lib/content/hub-pages";
import { buildFeaturedRankings } from "@/lib/content/featured-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = fiiIfixHub.metadata;

export default async function Page() {
  const featuredRankings = await buildFeaturedRankings(['fiis-maior-patrimonio', 'fiis-mais-negociados', 'fiis-maior-dividend-yield']);

  return (
    <>
      <HubJsonLd page={fiiIfixHub} id="fii-ifix" />
      <SeoHubPage {...fiiIfixHub} />
      <section className="container-page pb-10">
        <FeaturedRankingPreview tables={featuredRankings} />
      </section>
    </>
  );
}
