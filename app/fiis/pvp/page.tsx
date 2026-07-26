import Script from "next/script";
import { FeaturedRankingPreview } from "@/components/content/FeaturedRankingPreview";
import { SeoHubPage } from "@/components/content/SeoHubPage";
import { fiiPvpHub } from "@/lib/content/hub-pages";
import { getBaseUrl } from "@/lib/seo";
import { buildFeaturedRankings } from "@/lib/content/featured-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = fiiPvpHub.metadata;

export default async function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: fiiPvpHub.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webpageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: fiiPvpHub.title,
    description: fiiPvpHub.description,
    url: `${getBaseUrl()}${fiiPvpHub.path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Mapa do Ativo",
      url: getBaseUrl(),
    },
  };

  const featuredRankings = await buildFeaturedRankings(['fiis-menor-pvp', 'fiis-maior-patrimonio']);

  return (
    <>
      <Script
        id="hub-webpage-jsonld-fiiPvpHub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }}
      />
      <Script
        id="hub-faq-jsonld-fiiPvpHub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoHubPage {...fiiPvpHub} />
      <section className="container-page pb-10">
        <FeaturedRankingPreview tables={featuredRankings} />
      </section>
    </>
  );
}
