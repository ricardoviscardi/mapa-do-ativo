import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RankingTableExplorer } from "@/components/rankings/RankingSelector";
import { Card } from "@/components/ui/Card";
import { getBaseUrl } from "@/lib/seo";
import { getRankingDefinition, rankingDefinitions } from "@/lib/rankings/ranking-definitions";
import { buildRanking } from "@/lib/rankings/ranking-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;


function rankingFilter(score: number) {
  if (score >= 85) return "Lista principal";
  if (score >= 70) return "Lista principal";
  if (score >= 50) return "Lista ampliada";
  return "Consulta ampla";
}

type RankingPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const definition = getRankingDefinition(slug);

  if (!definition) {
    return {
      title: "Ranking não encontrado",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/rankings/${definition.slug}`;

  return {
    title: definition.h1,
    description: definition.description,
    keywords: [
      definition.h1,
      definition.title,
      definition.valueLabel,
      definition.kind === "stock" ? "ações brasileiras" : "fundos imobiliários",
      "ranking de investimentos",
      "Mapa do Ativo",
    ],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: definition.h1,
      description: definition.description,
      url: `${getBaseUrl()}${canonicalPath}`,
      siteName: "Mapa do Ativo",
      locale: "pt_BR",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: definition.h1,
      description: definition.description,
    },
  };
}

export default async function RankingDetailPage({ params }: RankingPageProps) {
  const { slug } = await params;
  const definition = getRankingDefinition(slug);

  if (!definition) notFound();

  const table = await buildRanking(definition);
  const linkBase = definition.kind === "stock" ? "/acoes" : "/fiis";
  const related = rankingDefinitions
    .filter((ranking) => ranking.kind === definition.kind && ranking.slug !== definition.slug)
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: definition.h1,
    description: definition.description,
    url: `${getBaseUrl()}/rankings/${definition.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Mapa do Ativo",
      url: getBaseUrl(),
    },
    about: definition.valueLabel,
  };

  return (
    <section className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-8">
        <Link href="/rankings" className="text-sm font-bold text-[var(--color-primary)] hover:underline">
          ← Voltar para rankings
        </Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {definition.kind === "stock" ? "Ranking de ações" : "Ranking de FIIs"}
        </p>
        <h1 className="mt-2 max-w-4xl text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
          {definition.h1}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
          {definition.intro}
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">Filtro aplicado</p>
          <p className="mt-2 text-2xl font-bold">{rankingFilter(definition.minQualityScore)}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Organização inicial para facilitar a comparação.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">Ordenação</p>
          <p className="mt-2 text-2xl font-bold">{definition.direction === "desc" ? "Maior primeiro" : "Menor primeiro"}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Ranking ordenado por {definition.valueLabel.toLowerCase()}.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">Universo</p>
          <p className="mt-2 text-2xl font-bold">{definition.kind === "stock" ? "Ações" : "FIIs"}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Ativos disponíveis nos diretórios Mapa do Ativo.</p>
        </Card>
      </div>

      <RankingTableExplorer table={table} linkBase={linkBase} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="text-2xl font-bold">Como usar este ranking</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
            {definition.methodology.map((item) => (
              <li key={item} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">
                {item}
              </li>
            ))}
          </ul>
          {definition.glossarySlug ? (
            <Link
              href={`/glossario/${definition.glossarySlug}`}
              className="mt-5 inline-flex min-h-11 items-center rounded-2xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
            >
              Entender {definition.valueLabel} no glossário
            </Link>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Outros rankings</h2>
          <div className="mt-4 grid gap-2">
            {related.map((ranking) => (
              <Link
                key={ranking.slug}
                href={`/rankings/${ranking.slug}`}
                className="rounded-2xl border border-[var(--color-border)] p-3 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-blue-50"
              >
                {ranking.shortTitle}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-8">
        <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
        <div className="mt-4 grid gap-4">
          {definition.faq.map((item) => (
            <div key={item.question} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-alt)] p-4">
              <h3 className="font-bold">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.answer}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
