import Script from "next/script";
import { FeaturedRankingPreview } from "@/components/content/FeaturedRankingPreview";
import { SeoHubPage } from "@/components/content/SeoHubPage";
import { fiiRendimentosHub } from "@/lib/content/hub-pages";
import { getBaseUrl } from "@/lib/seo";
import { buildFeaturedRankings } from "@/lib/content/featured-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = fiiRendimentosHub.metadata;

export default async function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: fiiRendimentosHub.faq.map((item) => ({
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
    name: fiiRendimentosHub.title,
    description: fiiRendimentosHub.description,
    url: `${getBaseUrl()}${fiiRendimentosHub.path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Mapa do Ativo",
      url: getBaseUrl(),
    },
  };

  const featuredRankings = await buildFeaturedRankings(['fiis-maior-dividend-yield', 'fiis-mais-negociados', 'fiis-maior-patrimonio']);

  return (
    <>
      <Script
        id="hub-webpage-jsonld-fiiRendimentosHub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }}
      />
      <Script
        id="hub-faq-jsonld-fiiRendimentosHub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoHubPage {...fiiRendimentosHub} />
      <section className="container-page pb-10">
        <FeaturedRankingPreview tables={featuredRankings} />
      </section>
    </>
  );
}
