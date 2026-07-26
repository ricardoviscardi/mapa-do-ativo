import type { Metadata } from "next";
import Script from "next/script";
import { notFound, redirect } from "next/navigation";
import { ApiStatusNotice } from "@/components/stocks/ApiStatusNotice";
import { CompanyInfoCard } from "@/components/stocks/CompanyInfoCard";
import { DayQuoteCard } from "@/components/stocks/DayQuoteCard";
import { DataQualityCard } from "@/components/stocks/DataQualityCard";
import { DividendSummaryCard } from "@/components/stocks/DividendSummaryCard";
import { DividendsTable } from "@/components/stocks/DividendsTable";
import { FundamentalAnalysisTable } from "@/components/stocks/FundamentalAnalysisTable";
import { KeyIndicatorsGrid } from "@/components/stocks/KeyIndicatorsGrid";
import { OscillationsCard } from "@/components/stocks/OscillationsCard";
import { PriceChartCard } from "@/components/stocks/PriceChartCard";
import { StockHeader } from "@/components/stocks/StockHeader";
import { getStockByTicker } from "@/lib/stocks/stock-service";
import { getBaseUrl } from "@/lib/seo";
import { evaluateAssetQuality } from "@/lib/stocks/asset-quality";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type StockPageProps = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function generateMetadata({
  params,
}: StockPageProps): Promise<Metadata> {
  const { ticker } = await params;
  const stock = await getStockByTicker(ticker);

  if (isUnavailableAsset(stock)) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const canonicalPath = `${isFiiAsset(stock) ? "/fiis" : "/acoes"}/${stock.ticker.toLowerCase()}`;
  const title = `${stock.ticker}: cotação, dividendos, indicadores e fundamentos`;
  const description = `Consulte ${stock.ticker} com cotação atual, gráfico, oscilações, dividendos, P/L, P/VP, ROE, balanço, DRE e fluxo de caixa no Mapa do Ativo.`;
  const quality = evaluateAssetQuality(stock);
  const shouldNoIndex = stock.quote.price === null || stock.history.length < 30 || !quality.indexable;

  return {
    title,
    description,
    keywords: [
      stock.ticker,
      `${stock.ticker} cotação`,
      `${stock.ticker} dividendos`,
      `${stock.ticker} fundamentos`,
      `${stock.ticker} P/L`,
      `${stock.ticker} dividend yield`,
      `${stock.ticker} gráfico`,
    ],
    alternates: {
      canonical: canonicalPath,
    },
    robots: shouldNoIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: `${baseUrl}${canonicalPath}`,
      siteName: "Mapa do Ativo",
      locale: "pt_BR",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}


function isUnavailableAsset(stock: Awaited<ReturnType<typeof getStockByTicker>>): boolean {
  const sector = stock.sector.trim().toLowerCase();
  const hasNoVisibleBase =
    stock.quote.price === null &&
    stock.history.length === 0 &&
    stock.dividends.length === 0 &&
    stock.fundamentalAnalysis.indicators.annual.rows.length === 0 &&
    stock.fundamentalAnalysis.balanceSheet.annual.rows.length === 0 &&
    stock.fundamentalAnalysis.incomeStatement.annual.rows.length === 0 &&
    stock.fundamentalAnalysis.cashFlow.annual.rows.length === 0;

  return hasNoVisibleBase && (sector === "não disponível" || sector === "nao disponivel");
}

function isFiiAsset(stock: Awaited<ReturnType<typeof getStockByTicker>>): boolean {
  return stock.assetKind === "fii" ||
    stock.sector.toLowerCase().includes("fundo") ||
    stock.companyInfo.some((row) => row.label.toLowerCase().includes("nº de cotas"));
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const stock = await getStockByTicker(ticker);

  if (isUnavailableAsset(stock)) {
    notFound();
  }

  if (isFiiAsset(stock)) {
    redirect(`/fiis/${stock.ticker.toLowerCase()}`);
  }

  const baseUrl = getBaseUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${stock.ticker}: cotação, indicadores e fundamentos`,
    description: `Página informativa sobre ${stock.ticker}, com cotação, gráfico, oscilações, dividendos e fundamentos.`,
    url: `${baseUrl}/acoes/${stock.ticker.toLowerCase()}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Mapa do Ativo",
      url: baseUrl,
    },
    about: {
      "@type": "Corporation",
      name: stock.fullName ?? stock.companyName,
      tickerSymbol: stock.ticker,
    },
  };

  return (
    <section className="container-page overflow-x-hidden py-10">
      <Script
        id={`stock-jsonld-${stock.ticker}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <StockHeader stock={stock} />
      <ApiStatusNotice stock={stock} />

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <PriceChartCard ticker={stock.ticker} history={stock.history} />
          <OscillationsCard oscillations={stock.oscillations} />
          <KeyIndicatorsGrid indicators={stock.indicators} />
        </div>

        <aside className="min-w-0 space-y-6">
          <DayQuoteCard rows={stock.dayQuoteRows} />
          <DividendSummaryCard summary={stock.dividendSummary} />
          <DataQualityCard stock={stock} />
          <CompanyInfoCard rows={stock.companyInfo} />
        </aside>
      </div>

      <div className="mt-6 min-w-0 space-y-6">
        <FundamentalAnalysisTable
          data={stock.fundamentalAnalysis}
          indicators={stock.indicators}
          assetKind={stock.assetKind}
        />
        <DividendsTable dividends={stock.dividends} />
      </div>
    </section>
  );
}
