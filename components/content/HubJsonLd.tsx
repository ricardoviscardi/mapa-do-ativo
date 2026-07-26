import Script from "next/script";
import { getBaseUrl } from "@/lib/seo";
import type { HubPageDefinition } from "@/lib/content/hub-pages";

type HubJsonLdProps = {
  page: HubPageDefinition;
  id: string;
};

export function HubJsonLd({ page, id }: HubJsonLdProps) {
  const baseUrl = getBaseUrl();
  const webpageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: `${baseUrl}${page.path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Mapa do Ativo",
      url: baseUrl,
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <Script
        id={`hub-webpage-jsonld-${id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }}
      />
      <Script
        id={`hub-faq-jsonld-${id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
