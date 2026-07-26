import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Card } from "@/components/ui/Card";
import { glossaryItems, getGlossaryItem } from "@/lib/glossary-data";
import { getBaseUrl } from "@/lib/seo";

type GlossaryDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return glossaryItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: GlossaryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getGlossaryItem(slug);

  if (!item) {
    return {
      title: "Indicador não encontrado",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: item.seoTitle,
    description: item.seoDescription,
    alternates: {
      canonical: `/glossario/${item.slug}`,
    },
    openGraph: {
      title: item.seoTitle,
      description: item.seoDescription,
      url: `${getBaseUrl()}/glossario/${item.slug}`,
      siteName: "Mapa do Ativo",
      locale: "pt_BR",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: item.seoTitle,
      description: item.seoDescription,
    },
  };
}

export default async function GlossaryDetailPage({ params }: GlossaryDetailPageProps) {
  const { slug } = await params;
  const item = getGlossaryItem(slug);

  if (!item) {
    notFound();
  }

  const currentItem = item!;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: currentItem.seoTitle,
    description: currentItem.seoDescription,
    mainEntityOfPage: `${getBaseUrl()}/glossario/${currentItem.slug}`,
    author: {
      "@type": "Organization",
      name: "Mapa do Ativo",
    },
    publisher: {
      "@type": "Organization",
      name: "Mapa do Ativo",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: currentItem.faq.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="container-page py-10">
      <Script
        id={`glossary-article-jsonld-${currentItem.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Script
        id={`glossary-faq-jsonld-${currentItem.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Link href="/glossario" className="text-sm font-semibold text-[var(--color-primary)]">
        ← Voltar ao glossário
      </Link>

      <div className="mt-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {currentItem.term}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
          {currentItem.name}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
          {currentItem.seoDescription}
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <Card>
          <h2 className="text-2xl font-bold">O que é {currentItem.term}?</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">{currentItem.explanation}</p>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-2xl font-bold">Fórmula</h2>
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4 text-lg font-bold text-[var(--color-primary)]">
              {currentItem.formula}
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold">Exemplo prático</h2>
            <p className="mt-3 leading-7 text-[var(--color-muted)]">{currentItem.example}</p>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-2xl font-bold">Como interpretar</h2>
            <p className="mt-3 leading-7 text-[var(--color-muted)]">{currentItem.interpretation}</p>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold">Cuidados e armadilhas</h2>
            <p className="mt-3 leading-7 text-[var(--color-muted)]">{currentItem.attention}</p>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-bold">Relação com outros indicadores</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {currentItem.relatedMetrics.map((metric) => (
              <span key={metric} className="rounded-full border border-[var(--color-border)] bg-[var(--color-background-alt)] px-4 py-2 text-sm font-semibold text-[var(--color-text)]">
                {metric}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Rankings relacionados</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Use os rankings para aplicar o conceito na prática, sempre considerando contexto, setor e metodologia.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {currentItem.rankingLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
                {link.label}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Consulte ativos e veja o indicador na prática</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Depois de entender o indicador, pesquise ações e FIIs para ver cotação, gráfico, dividendos, rendimentos e fundamentos em uma tela simples.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {currentItem.assetLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]">
                {link.label}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Perguntas frequentes</h2>
          <div className="mt-4 grid gap-3">
            {currentItem.faq.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">
                <summary className="cursor-pointer font-bold text-[var(--color-text)]">{faq.question}</summary>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
