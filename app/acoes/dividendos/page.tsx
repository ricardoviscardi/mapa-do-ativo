import Script from "next/script";
import { FeaturedRankingPreview } from "@/components/content/FeaturedRankingPreview";
import { SeoHubPage } from "@/components/content/SeoHubPage";
import { stockDividendHub } from "@/lib/content/hub-pages";
import { getBaseUrl } from "@/lib/seo";
import { buildFeaturedRankings } from "@/lib/content/featured-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = stockDividendHub.metadata;

export default async function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: stockDividendHub.faq.map((item) => ({
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
    name: stockDividendHub.title,
    description: stockDividendHub.description,
    url: `${getBaseUrl()}${stockDividendHub.path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Mapa do Ativo",
      url: getBaseUrl(),
    },
  };

  const featuredRankings = await buildFeaturedRankings(['maiores-dividend-yield', 'acoes-mais-negociadas']);

  return (
    <>
      <Script
        id="hub-webpage-jsonld-stockDividendHub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }}
      />
      <Script
        id="hub-faq-jsonld-stockDividendHub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoHubPage {...stockDividendHub} />
      <section className="container-page pb-10">
        <FeaturedRankingPreview tables={featuredRankings} />
      </section>
    </>
  );
}
