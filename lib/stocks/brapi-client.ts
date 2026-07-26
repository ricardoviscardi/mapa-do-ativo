import { debugYahooTicker, fetchYahooHistory, fetchYahooQuote, fetchYahooSummary } from "@/lib/stocks/yahoo-client";
import { debugFundamentusTicker, fetchFundamentusSnapshot } from "@/lib/stocks/fundamentus-client";

const BRAPI_BASE_URL = "https://brapi.dev/api";

export type BrapiAsset = Record<string, unknown>;

export type BrapiEndpointResult = {
  endpoint: string;
  url: string;
  ok: boolean;
  status?: number;
  message?: string;
  resultsLength?: number;
  firstResultKeys?: string[];
};

export type StockSearchResult = {
  symbol: string;
  name: string;
  sector?: string;
  logoUrl?: string;
  type?: string;
  source: "brapi.dev" | "fallback" | "supabase" | "snapshot";
};

type BrapiResponse = {
  results?: BrapiAsset[];
  stocks?: BrapiAsset[];
  indexes?: BrapiAsset[];
  requestedAt?: string;
  took?: number;
  error?: boolean;
  message?: string;
  [key: string]: unknown;
};

function getBrapiToken(): string | undefined {
  return process.env.BRAPI_API_TOKEN || process.env.BRAPI_TOKEN;
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function buildBrapiUrl(endpoint: string, params: Record<string, string> = {}): URL {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${BRAPI_BASE_URL}${cleanEndpoint}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

function redactedUrl(url: URL): string {
  const safeUrl = new URL(url.toString());
  if (safeUrl.searchParams.has("token")) {
    safeUrl.searchParams.set("token", "***");
  }
  return safeUrl.toString();
}

async function fetchBrapi(endpoint: string, params: Record<string, string> = {}): Promise<{
  status: number;
  payload: BrapiResponse | null;
  url: string;
}> {
  const token = getBrapiToken();
  const url = buildBrapiUrl(endpoint, params);

  if (!token) {
    return {
      status: 0,
      payload: {
        error: true,
        message: "Token da brapi não configurado. Preencha BRAPI_API_TOKEN no .env.local."
      },
      url: redactedUrl(url)
    };
  }

  // A BRAPI usa token na query string nos exemplos oficiais. Mantemos o Bearer
  // também por compatibilidade, mas a query é o caminho mais estável.
  url.searchParams.set("token", token);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: {
        revalidate: 1800
      }
    });

    if (!response.ok) {
      let message = "";

      try {
        const errorPayload = (await response.json()) as { message?: string; error?: string };
        message = errorPayload.message ?? errorPayload.error ?? "";
      } catch {
        message = "";
      }

      return {
        status: response.status,
        payload: {
          error: true,
          message: message || `Erro HTTP ${response.status}`
        },
        url: redactedUrl(url)
      };
    }

    return {
      status: response.status,
      payload: (await response.json()) as BrapiResponse,
      url: redactedUrl(url)
    };
  } catch (error) {
    return {
      status: 0,
      payload: {
        error: true,
        message: error instanceof Error ? error.message : "Falha ao conectar com a brapi.dev."
      },
      url: redactedUrl(url)
    };
  }
}

function payloadItems(payload: BrapiResponse | null): BrapiAsset[] {
  if (!payload) return [];

  const arrays = [payload.results, payload.stocks, payload.indexes].filter(Array.isArray) as BrapiAsset[][];

  if (arrays.length) {
    return arrays.flat();
  }

  const possibleKeys = ["data", "items", "quotes"];

  for (const key of possibleKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value as BrapiAsset[];
    }
  }

  return [];
}

function firstResult(payload: BrapiResponse | null, ticker?: string): BrapiAsset | null {
  const items = payloadItems(payload);

  if (!items.length) {
    return null;
  }

  if (!ticker) {
    return items[0] ?? null;
  }

  const normalizedTicker = normalizeTicker(ticker);

  return (
    items.find((item) => String(item.symbol ?? item.stock ?? item.requestedSymbol ?? "").toUpperCase() === normalizedTicker) ??
    items[0] ??
    null
  );
}

function searchItemToResult(item: BrapiAsset): StockSearchResult | null {
  const symbol = String(item.stock ?? item.symbol ?? item.ticker ?? item.name ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!symbol) {
    return null;
  }

  const name = String(
    item.name ??
    item.longName ??
    item.shortName ??
    item.companyName ??
    item.company ??
    symbol
  );

  return {
    symbol,
    name,
    sector: typeof item.sector === "string" ? item.sector : undefined,
    logoUrl: typeof item.logo === "string" ? item.logo : typeof item.logourl === "string" ? item.logourl : undefined,
    type: typeof item.type === "string" ? item.type : undefined,
    source: "brapi.dev"
  };
}

export async function searchBrapiStocks(query: string, limit = 8): Promise<StockSearchResult[]> {
  const normalizedQuery = query.trim().toUpperCase();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const { payload } = await fetchBrapi("/quote/list", {
    search: normalizedQuery,
    sortBy: "name",
    sortOrder: "asc",
    limit: String(limit),
    page: "1"
  });

  const seen = new Set<string>();

  return payloadItems(payload)
    .map(searchItemToResult)
    .filter((item): item is StockSearchResult => Boolean(item))
    .filter((item) => {
      if (seen.has(item.symbol)) return false;
      seen.add(item.symbol);
      return true;
    })
    .slice(0, limit);
}

export async function fetchBrapiClassicQuote(ticker: string): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi(`/quote/${normalizedTicker}`, {
    range: "10y",
    interval: "1d",
    fundamental: "true",
    dividends: "true"
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiQuote(ticker: string): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/quote", {
    symbols: normalizedTicker
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiProfile(ticker: string): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/profile", {
    symbols: normalizedTicker
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiStatistics(ticker: string, mode: "current" | "history" = "current"): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/statistics", {
    symbols: normalizedTicker,
    mode
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiFinancialData(ticker: string, mode: "current" | "history" = "current"): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/financial-data", {
    symbols: normalizedTicker,
    mode
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiBalanceSheet(ticker: string, period: "annual" | "quarterly"): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/balance-sheet", {
    symbols: normalizedTicker,
    period
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiIncomeStatement(ticker: string, period: "annual" | "quarterly"): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/income-statement", {
    symbols: normalizedTicker,
    period
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiCashFlow(ticker: string, period: "annual" | "quarterly"): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/cash-flow", {
    symbols: normalizedTicker,
    period
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiDividends(ticker: string): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/dividends", {
    symbols: normalizedTicker
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiHistorical(ticker: string, range = "1y", interval = "1d"): Promise<BrapiAsset | null> {
  const normalizedTicker = normalizeTicker(ticker);
  const { payload } = await fetchBrapi("/v2/stocks/historical", {
    symbols: normalizedTicker,
    range,
    interval
  });

  return firstResult(payload, normalizedTicker);
}

export async function fetchBrapiBundle(ticker: string) {
  const normalizedTicker = normalizeTicker(ticker);

  const [
    classicQuote,
    quote,
    profile,
    statistics,
    statisticsHistory,
    financialData,
    financialDataHistory,
    balanceAnnual,
    balanceQuarterly,
    incomeAnnual,
    incomeQuarterly,
    cashAnnual,
    cashQuarterly,
    dividends,
    historical,
    yahooHistory,
    yahooQuote,
    yahooSummary,
    fundamentus
  ] = await Promise.all([
    fetchBrapiClassicQuote(normalizedTicker),
    fetchBrapiQuote(normalizedTicker),
    fetchBrapiProfile(normalizedTicker),
    fetchBrapiStatistics(normalizedTicker, "current"),
    fetchBrapiStatistics(normalizedTicker, "history"),
    fetchBrapiFinancialData(normalizedTicker, "current"),
    fetchBrapiFinancialData(normalizedTicker, "history"),
    fetchBrapiBalanceSheet(normalizedTicker, "annual"),
    fetchBrapiBalanceSheet(normalizedTicker, "quarterly"),
    fetchBrapiIncomeStatement(normalizedTicker, "annual"),
    fetchBrapiIncomeStatement(normalizedTicker, "quarterly"),
    fetchBrapiCashFlow(normalizedTicker, "annual"),
    fetchBrapiCashFlow(normalizedTicker, "quarterly"),
    fetchBrapiDividends(normalizedTicker),
    fetchBrapiHistorical(normalizedTicker, "10y", "1d"),
    fetchYahooHistory(normalizedTicker),
    fetchYahooQuote(normalizedTicker),
    fetchYahooSummary(normalizedTicker),
    fetchFundamentusSnapshot(normalizedTicker)
  ]);

  return {
    classicQuote,
    quote,
    profile,
    statistics,
    statisticsHistory,
    financialData,
    financialDataHistory,
    balanceAnnual,
    balanceQuarterly,
    incomeAnnual,
    incomeQuarterly,
    cashAnnual,
    cashQuarterly,
    dividends,
    historical,
    yahooHistory,
    yahooQuote,
    yahooSummary,
    fundamentus
  };
}

export async function debugBrapiTicker(ticker: string): Promise<BrapiEndpointResult[]> {
  const normalizedTicker = normalizeTicker(ticker);

  const endpoints = [
    [`/quote/${normalizedTicker}`, { range: "10y", interval: "1d", fundamental: "true", dividends: "true" }],
    ["/quote/list", { search: normalizedTicker.slice(0, 2), sortBy: "name", sortOrder: "asc", limit: "8", page: "1" }],
    ["/v2/stocks/quote", { symbols: normalizedTicker }],
    ["/v2/stocks/profile", { symbols: normalizedTicker }],
    ["/v2/stocks/statistics", { symbols: normalizedTicker, mode: "current" }],
    ["/v2/stocks/statistics", { symbols: normalizedTicker, mode: "history" }],
    ["/v2/stocks/financial-data", { symbols: normalizedTicker, mode: "current" }],
    ["/v2/stocks/financial-data", { symbols: normalizedTicker, mode: "history" }],
    ["/v2/stocks/balance-sheet", { symbols: normalizedTicker, period: "annual" }],
    ["/v2/stocks/income-statement", { symbols: normalizedTicker, period: "annual" }],
    ["/v2/stocks/cash-flow", { symbols: normalizedTicker, period: "annual" }],
    ["/v2/stocks/dividends", { symbols: normalizedTicker }],
    ["/v2/stocks/historical", { symbols: normalizedTicker, range: "10y", interval: "1d" }]
  ] as const;

  const results: BrapiEndpointResult[] = [];

  for (const [endpoint, params] of endpoints) {
    const { status, payload, url } = await fetchBrapi(endpoint, params);
    const first = endpoint === "/quote/list" ? payloadItems(payload)[0] ?? null : firstResult(payload, normalizedTicker);
    const safeUrl = url.replace(/([?&]token=)[^&]+/i, "$1***");

    results.push({
      endpoint,
      url: safeUrl,
      ok: Boolean(!payload?.error && first),
      status,
      message: payload?.message,
      resultsLength: payloadItems(payload).length,
      firstResultKeys: first ? Object.keys(first).slice(0, 30) : []
    });
  }

  const yahooResults = await debugYahooTicker(normalizedTicker);
  const fundamentusResults = await debugFundamentusTicker(normalizedTicker);

  return [...results, ...yahooResults, ...fundamentusResults];
}
