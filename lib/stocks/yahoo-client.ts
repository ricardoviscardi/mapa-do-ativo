import type { BrapiAsset, BrapiEndpointResult } from "@/lib/stocks/brapi-client";

type YahooChartPayload = {
  chart?: {
    result?: Array<{
      meta?: Record<string, unknown>;
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type YahooQuoteSummaryPayload = {
  quoteSummary?: {
    result?: Array<Record<string, unknown>>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type YahooQuotePayload = {
  quoteResponse?: {
    result?: Array<Record<string, unknown>>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function yahooSymbol(ticker: string): string {
  return `${normalizeTicker(ticker)}.SA`;
}

function getRawValue(value: unknown): unknown {
  if (value && typeof value === "object" && "raw" in value) {
    return (value as { raw?: unknown }).raw;
  }

  return value;
}

function getPath(source: unknown, path: string): unknown {
  if (!source || typeof source !== "object") return undefined;

  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function firstRaw(source: unknown, paths: string[]): unknown {
  for (const path of paths) {
    const value = getRawValue(getPath(source, path));

    if (value !== undefined && value !== null) return value;
  }

  return null;
}

function hasUsefulValue(data: Record<string, unknown>): boolean {
  return Object.entries(data).some(([key, value]) => key !== "symbol" && key !== "source" && value !== null && value !== undefined);
}

export async function fetchYahooHistory(ticker: string): Promise<BrapiAsset | null> {
  const symbol = yahooSymbol(ticker);
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
  url.searchParams.set("range", "10y");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("events", "div,splits");
  url.searchParams.set("includeAdjustedClose", "true");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 MapaDoAtivo/1.0"
      },
      signal: AbortSignal.timeout(8000),
      next: {
        revalidate: 1800
      }
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as YahooChartPayload;
    const result = payload.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];
    const closes = quote?.close ?? [];
    const volumes = quote?.volume ?? [];

    const historicalDataPrice = timestamps
      .map((timestamp, index) => {
        const close = closes[index];
        const volume = volumes[index];

        if (typeof close !== "number" || !Number.isFinite(close)) return null;

        return {
          date: timestamp,
          close,
          volume: typeof volume === "number" && Number.isFinite(volume) && volume > 0 ? volume : null
        };
      })
      .filter((item): item is { date: number; close: number; volume: number | null } => Boolean(item));

    if (!historicalDataPrice.length) return null;

    return {
      symbol: normalizeTicker(ticker),
      source: "Yahoo Finance",
      historicalDataPrice
    };
  } catch {
    return null;
  }
}

export async function fetchYahooQuote(ticker: string): Promise<BrapiAsset | null> {
  const symbol = yahooSymbol(ticker);
  const url = new URL("https://query1.finance.yahoo.com/v7/finance/quote");
  url.searchParams.set("symbols", symbol);
  url.searchParams.set("fields", [
    "regularMarketPrice",
    "regularMarketOpen",
    "regularMarketDayHigh",
    "regularMarketDayLow",
    "regularMarketPreviousClose",
    "regularMarketVolume",
    "regularMarketChange",
    "regularMarketChangePercent",
    "marketCap",
    "trailingPE",
    "priceToBook",
    "bookValue",
    "dividendRate",
    "dividendYield",
    "trailingAnnualDividendRate",
    "trailingAnnualDividendYield",
    "shortName",
    "longName",
    "currency",
    "sharesOutstanding",
    "fiftyTwoWeekChangePercent",
    "fiftyTwoWeekHigh",
    "fiftyTwoWeekLow"
  ].join(","));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 MapaDoAtivo/1.0"
      },
      signal: AbortSignal.timeout(8000),
      next: {
        revalidate: 1800
      }
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as YahooQuotePayload;
    const result = payload.quoteResponse?.result?.[0];

    if (!result) return null;

    const data: Record<string, unknown> = {
      symbol: normalizeTicker(ticker),
      source: "Yahoo Finance",
      regularMarketPrice: result.regularMarketPrice,
      regularMarketOpen: result.regularMarketOpen,
      regularMarketDayHigh: result.regularMarketDayHigh,
      regularMarketDayLow: result.regularMarketDayLow,
      regularMarketPreviousClose: result.regularMarketPreviousClose,
      regularMarketVolume: result.regularMarketVolume,
      regularMarketChange: result.regularMarketChange,
      regularMarketChangePercent: result.regularMarketChangePercent,
      marketCap: result.marketCap,
      trailingPE: result.trailingPE,
      priceEarnings: result.trailingPE,
      priceToBook: result.priceToBook,
      bookValue: result.bookValue,
      dividendRate: result.dividendRate ?? result.trailingAnnualDividendRate,
      dividendYield: result.dividendYield ?? result.trailingAnnualDividendYield,
      trailingAnnualDividendRate: result.trailingAnnualDividendRate,
      trailingAnnualDividendYield: result.trailingAnnualDividendYield,
      shortName: result.shortName,
      longName: result.longName,
      currency: result.currency,
      sharesOutstanding: result.sharesOutstanding,
      fiftyTwoWeekChangePercent: result.fiftyTwoWeekChangePercent,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow
    };

    return hasUsefulValue(data) ? data : null;
  } catch {
    return null;
  }
}

export async function fetchYahooSummary(ticker: string): Promise<BrapiAsset | null> {
  const symbol = yahooSymbol(ticker);
  const url = new URL(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`);
  url.searchParams.set("modules", "summaryDetail,defaultKeyStatistics,financialData,price,assetProfile,fundProfile");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 MapaDoAtivo/1.0"
      },
      signal: AbortSignal.timeout(8000),
      next: {
        revalidate: 1800
      }
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as YahooQuoteSummaryPayload;
    const result = payload.quoteSummary?.result?.[0];

    if (!result) return null;

    const data: Record<string, unknown> = {
      symbol: normalizeTicker(ticker),
      source: "Yahoo Finance",
      priceEarnings: firstRaw(result, ["defaultKeyStatistics.trailingPE", "summaryDetail.trailingPE"]),
      trailingPE: firstRaw(result, ["defaultKeyStatistics.trailingPE", "summaryDetail.trailingPE"]),
      priceToBook: firstRaw(result, ["defaultKeyStatistics.priceToBook"]),
      bookValue: firstRaw(result, ["defaultKeyStatistics.bookValue"]),
      dividendYield: firstRaw(result, ["summaryDetail.dividendYield"]),
      dividendRate: firstRaw(result, ["summaryDetail.dividendRate"]),
      trailingAnnualDividendYield: firstRaw(result, ["summaryDetail.trailingAnnualDividendYield"]),
      trailingAnnualDividendRate: firstRaw(result, ["summaryDetail.trailingAnnualDividendRate"]),
      returnOnEquity: firstRaw(result, ["financialData.returnOnEquity"]),
      returnOnAssets: firstRaw(result, ["financialData.returnOnAssets"]),
      profitMargins: firstRaw(result, ["defaultKeyStatistics.profitMargins", "financialData.profitMargins"]),
      grossMargins: firstRaw(result, ["financialData.grossMargins"]),
      ebitdaMargins: firstRaw(result, ["financialData.ebitdaMargins"]),
      operatingMargins: firstRaw(result, ["financialData.operatingMargins"]),
      enterpriseToEbitda: firstRaw(result, ["defaultKeyStatistics.enterpriseToEbitda"]),
      marketCap: firstRaw(result, ["summaryDetail.marketCap", "price.marketCap"]),
      sharesOutstanding: firstRaw(result, ["defaultKeyStatistics.sharesOutstanding", "price.sharesOutstanding"]),
      categoryName: firstRaw(result, ["fundProfile.categoryName"]),
      legalType: firstRaw(result, ["fundProfile.legalType"]),
      sector: firstRaw(result, ["assetProfile.sector"]),
      industry: firstRaw(result, ["assetProfile.industry"])
    };

    return hasUsefulValue(data) ? data : null;
  } catch {
    return null;
  }
}

export async function debugYahooTicker(ticker: string): Promise<BrapiEndpointResult[]> {
  const symbol = yahooSymbol(ticker);
  const chartUrl = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
  chartUrl.searchParams.set("range", "10y");
  chartUrl.searchParams.set("interval", "1d");
  chartUrl.searchParams.set("events", "div,splits");

  const quoteUrl = new URL("https://query1.finance.yahoo.com/v7/finance/quote");
  quoteUrl.searchParams.set("symbols", symbol);

  const summaryUrl = new URL(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`);
  summaryUrl.searchParams.set("modules", "summaryDetail,defaultKeyStatistics,financialData,price");

  const history = await fetchYahooHistory(ticker);
  const quote = await fetchYahooQuote(ticker);
  const summary = await fetchYahooSummary(ticker);

  return [
    {
      endpoint: "yahoo/chart",
      url: chartUrl.toString(),
      ok: Boolean(history),
      status: history ? 200 : 0,
      message: history ? undefined : "Histórico Yahoo não disponível.",
      resultsLength: Array.isArray(history?.historicalDataPrice) ? history.historicalDataPrice.length : 0,
      firstResultKeys: history ? Object.keys(history).slice(0, 30) : []
    },
    {
      endpoint: "yahoo/quote",
      url: quoteUrl.toString(),
      ok: Boolean(quote),
      status: quote ? 200 : 0,
      message: quote ? undefined : "Quote Yahoo não disponível.",
      resultsLength: quote ? 1 : 0,
      firstResultKeys: quote ? Object.keys(quote).slice(0, 30) : []
    },
    {
      endpoint: "yahoo/summary",
      url: summaryUrl.toString(),
      ok: Boolean(summary),
      status: summary ? 200 : 0,
      message: summary ? undefined : "Resumo Yahoo não disponível.",
      resultsLength: summary ? 1 : 0,
      firstResultKeys: summary ? Object.keys(summary).slice(0, 30) : []
    }
  ];
}
