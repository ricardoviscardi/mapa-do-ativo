import { FeaturedRankingPreview } from "@/components/content/FeaturedRankingPreview";
import { HubJsonLd } from "@/components/content/HubJsonLd";
import { SeoHubPage } from "@/components/content/SeoHubPage";
import { fiiBestHub } from "@/lib/content/hub-pages";
import { buildFeaturedRankings } from "@/lib/content/featured-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = fiiBestHub.metadata;

export default async function Page() {
  const featuredRankings = await buildFeaturedRankings(['fiis-maior-dividend-yield', 'fiis-menor-pvp', 'fiis-maior-patrimonio', 'fiis-mais-negociados']);

  return (
    <>
      <HubJsonLd page={fiiBestHub} id="fii-best" />
      <SeoHubPage {...fiiBestHub} />
      <section className="container-page pb-10">
        <FeaturedRankingPreview tables={featuredRankings} />
      </section>
    </>
  );
}
