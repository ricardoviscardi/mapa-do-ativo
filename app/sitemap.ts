import type { MetadataRoute } from "next";
import { glossaryItems } from "@/lib/glossary-data";
import { rankingDefinitions } from "@/lib/rankings/ranking-definitions";
import { getBaseUrl } from "@/lib/seo";
import { allHubPages } from "@/lib/content/hub-pages";
import { popularFIIs, popularStocks } from "@/lib/stocks/stock-list";

const LOW_CONFIDENCE_SITEMAP_TICKERS = new Set(["AZUL4", "BCFF11", "CPLE6", "IRDM11", "PMLL11"]);

function isSitemapReady(ticker: string): boolean {
  return !LOW_CONFIDENCE_SITEMAP_TICKERS.has(ticker.toUpperCase());
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes = [
    "",
    "/acoes",
    "/fiis",
    "/glossario",
    "/metodologia",
    "/sobre",
    "/contato",
    "/privacidade",
    "/termos",
    "/rankings",
    "/comparador",
    "/ferramentas",
    "/ferramentas/preco-teto",
    "/ferramentas/simulador-de-proventos",
    "/ferramentas/raio-x-carteira",
    "/metodologia/como-ler-os-rankings",
    "/metodologia/criterios-dos-rankings",
    "/metodologia/qualidade-dos-dados",
    "/metodologia/dados-em-atualizacao"
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7
  }));

  const hubRoutes = allHubPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.78
  }));

  const rankingRoutes = rankingDefinitions.map((ranking) => ({
    url: `${baseUrl}/rankings/${ranking.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.82
  }));

  const stockRoutes = popularStocks.filter(isSitemapReady).map((ticker) => ({
    url: `${baseUrl}/acoes/${ticker.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9
  }));

  const fiiRoutes = popularFIIs.filter(isSitemapReady).map((ticker) => ({
    url: `${baseUrl}/fiis/${ticker.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.85
  }));

  const glossaryRoutes = glossaryItems.map((item) => ({
    url: `${baseUrl}/glossario/${item.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75
  }));

  return [...staticRoutes, ...hubRoutes, ...rankingRoutes, ...stockRoutes, ...fiiRoutes, ...glossaryRoutes];
}
