import Script from "next/script";
import { FeaturedRankingPreview } from "@/components/content/FeaturedRankingPreview";
import { SeoHubPage } from "@/components/content/SeoHubPage";
import { fiiDividendYieldHub } from "@/lib/content/hub-pages";
import { getBaseUrl } from "@/lib/seo";
import { buildFeaturedRankings } from "@/lib/content/featured-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = fiiDividendYieldHub.metadata;

export default async function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: fiiDividendYieldHub.faq.map((item) => ({
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
    name: fiiDividendYieldHub.title,
    description: fiiDividendYieldHub.description,
    url: `${getBaseUrl()}${fiiDividendYieldHub.path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Mapa do Ativo",
      url: getBaseUrl(),
    },
  };

  const featuredRankings = await buildFeaturedRankings(['fiis-maior-dividend-yield']);

  return (
    <>
      <Script
        id="hub-webpage-jsonld-fiiDividendYieldHub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }}
      />
      <Script
        id="hub-faq-jsonld-fiiDividendYieldHub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoHubPage {...fiiDividendYieldHub} />
      <section className="container-page pb-10">
        <FeaturedRankingPreview tables={featuredRankings} />
      </section>
    </>
  );
}
