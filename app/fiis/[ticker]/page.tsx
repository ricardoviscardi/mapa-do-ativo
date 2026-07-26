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

type FiiPageProps = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function generateMetadata({
  params,
}: FiiPageProps): Promise<Metadata> {
  const { ticker } = await params;
  const fii = await getStockByTicker(ticker);

  if (isUnavailableAsset(fii)) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const canonicalPath = `${isStockAsset(fii) ? "/acoes" : "/fiis"}/${fii.ticker.toLowerCase()}`;
  const title = `${fii.ticker}: cotação, rendimentos, dividend yield e dados do FII`;
  const description = `Consulte ${fii.ticker} com cotação atual, gráfico, oscilações, rendimentos, dividend yield, P/VP, VP por cota e informações do fundo imobiliário no Mapa do Ativo.`;
  const quality = evaluateAssetQuality(fii);
  const shouldNoIndex = fii.quote.price === null || fii.history.length < 30 || !quality.indexable;

  return {
    title,
    description,
    keywords: [
      fii.ticker,
      `${fii.ticker} cotação`,
      `${fii.ticker} dividendos`,
      `${fii.ticker} rendimentos`,
      `${fii.ticker} dividend yield`,
      `${fii.ticker} FII`,
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

function isStockAsset(stock: Awaited<ReturnType<typeof getStockByTicker>>): boolean {
  return stock.assetKind === "stock" &&
    !stock.sector.toLowerCase().includes("fundo") &&
    !stock.companyInfo.some((row) => row.label.toLowerCase().includes("nº de cotas"));
}

export default async function FiiTickerPage({ params }: FiiPageProps) {
  const { ticker } = await params;
  const fii = await getStockByTicker(ticker);

  if (isUnavailableAsset(fii)) {
    notFound();
  }

  if (isStockAsset(fii)) {
    redirect(`/acoes/${fii.ticker.toLowerCase()}`);
  }

  const baseUrl = getBaseUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${fii.ticker}: cotação, rendimentos e dados do FII`,
    description: `Página informativa sobre ${fii.ticker}, com cotação, gráfico, oscilações, dividendos e dados disponíveis do fundo imobiliário.`,
    url: `${baseUrl}/fiis/${fii.ticker.toLowerCase()}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Mapa do Ativo",
      url: baseUrl,
    },
    about: {
      "@type": "InvestmentFund",
      name: fii.fullName ?? fii.companyName,
      tickerSymbol: fii.ticker,
    },
  };

  return (
    <section className="container-page overflow-x-hidden py-10">
      <Script
        id={`fii-jsonld-${fii.ticker}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <StockHeader stock={fii} />
      <ApiStatusNotice stock={fii} />

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <PriceChartCard ticker={fii.ticker} history={fii.history} />
          <OscillationsCard oscillations={fii.oscillations} />
          <KeyIndicatorsGrid indicators={fii.indicators} />
        </div>

        <aside className="min-w-0 space-y-6">
          <DayQuoteCard rows={fii.dayQuoteRows} />
          <DividendSummaryCard summary={fii.dividendSummary} />
          <DataQualityCard stock={fii} />
          <CompanyInfoCard rows={fii.companyInfo} />
        </aside>
      </div>

      <div className="mt-6 min-w-0 space-y-6">
        <FundamentalAnalysisTable
          data={fii.fundamentalAnalysis}
          indicators={fii.indicators}
          assetKind={fii.assetKind}
        />
        <DividendsTable dividends={fii.dividends} />
      </div>
    </section>
  );
}
