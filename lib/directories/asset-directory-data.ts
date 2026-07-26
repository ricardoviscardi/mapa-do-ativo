import { evaluateAssetQuality, hasUsefulDisplayValue } from "@/lib/stocks/asset-quality";
import { getStockByTicker } from "@/lib/stocks/stock-service";
import { popularFIIs, popularStocks, rankingFIIs, rankingStocks } from "@/lib/stocks/stock-list";
import { formatCurrency, formatInteger, formatLargeCurrency, formatPlainPercent } from "@/lib/utils/formatters";
import { displayAssetCategory } from "@/lib/stocks/asset-display";
import { sanitizeDisplayText } from "@/lib/utils/text";
import { parseLocaleNumber } from "@/lib/rankings/ranking-engine";
import { isProductionBuildPhase } from "@/lib/utils/build-env";
import type { StockData } from "@/types/stock";

export type DirectoryKind = "stock" | "fii";
export type DirectoryQualityStatus = "OK" | "parcial" | "limitado" | "inconsistente";

export type AssetDirectoryItem = {
  ticker: string;
  name: string;
  sector: string;
  qualityStatus: DirectoryQualityStatus;
  qualityLabel: string;
  qualityScore: number;
  price: number | null;
  priceDisplay: string;
  dividendYield: number | null;
  dividendYieldDisplay: string;
  pe: number | null;
  peDisplay: string;
  pvp: number | null;
  pvpDisplay: string;
  marketCap: number | null;
  marketCapDisplay: string;
  volume: number | null;
  volumeDisplay: string;
  hasHistory: boolean;
  hasIndicators: boolean;
  hasDividends: boolean;
  issues: string[];
  strengths: string[];
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function indicatorValue(stock: StockData, labels: string[]): string | null {
  const normalizedLabels = labels.map(normalizeText);
  return stock.indicators.find((indicator) => normalizedLabels.includes(normalizeText(indicator.label)))?.value ?? null;
}

function assetSector(stock: StockData): string {
  return displayAssetCategory(stock);
}

function assetName(stock: StockData): string {
  return sanitizeDisplayText(stock.companyName) || sanitizeDisplayText(stock.fullName) || stock.ticker;
}

function publicDividendYield(value: string | null | undefined, kind: DirectoryKind): number | null {
  const parsed = parseLocaleNumber(value);
  if (parsed === null || parsed <= 0) return null;
  const max = kind === "fii" ? 20 : 20;
  return parsed <= max ? parsed : null;
}

function publicRatio(value: string | null | undefined, maxAbs: number): number | null {
  const parsed = parseLocaleNumber(value);
  if (parsed === null || parsed <= 0 || Math.abs(parsed) > maxAbs) return null;
  return parsed;
}

export function qualityStatusFromScore(score: number, hasPrice: boolean): DirectoryQualityStatus {
  if (!hasPrice || score < 40) return "inconsistente";
  if (score >= 80) return "OK";
  if (score >= 60) return "parcial";
  return "limitado";
}

export function qualityStatusLabel(status: DirectoryQualityStatus): string {
  if (status === "OK") return "OK";
  if (status === "parcial") return "Consulta inicial";
  if (status === "limitado") return "Limitado";
  return "Inconsistente";
}

function itemFromStock(stock: StockData): AssetDirectoryItem {
  const quality = evaluateAssetQuality(stock);
  const kind: DirectoryKind = stock.assetKind === "fii" || stock.ticker.endsWith("11") ? "fii" : "stock";
  const rawDividendYieldDisplay = indicatorValue(stock, ["DY 12m", "Dividend Yield", "Div. Yield"]) ?? stock.dividendSummary.yield12m;
  const rawPeDisplay = indicatorValue(stock, ["P/L"]) ?? "Não disponível";
  const rawPvpDisplay = indicatorValue(stock, ["P/VP"]) ?? "Não disponível";
  const dividendYield = publicDividendYield(rawDividendYieldDisplay, kind);
  const pe = publicRatio(rawPeDisplay, 120);
  const pvp = publicRatio(rawPvpDisplay, kind === "fii" ? 20 : 40);
  const status = qualityStatusFromScore(quality.score, quality.hasPrice);

  return {
    ticker: stock.ticker,
    name: assetName(stock),
    sector: assetSector(stock),
    qualityStatus: status,
    qualityLabel: quality.label,
    qualityScore: quality.score,
    price: stock.quote.price,
    priceDisplay: stock.quote.price === null ? "Não disponível" : formatCurrency(stock.quote.price),
    dividendYield,
    dividendYieldDisplay: dividendYield === null ? "Não disponível" : formatPlainPercent(dividendYield),
    pe,
    peDisplay: pe === null ? "Não disponível" : rawPeDisplay,
    pvp,
    pvpDisplay: pvp === null ? "Não disponível" : rawPvpDisplay,
    marketCap: stock.quote.marketCap,
    marketCapDisplay: stock.quote.marketCap === null ? "Não disponível" : formatLargeCurrency(stock.quote.marketCap),
    volume: stock.quote.volume,
    volumeDisplay: stock.quote.volume === null ? "Não disponível" : formatInteger(stock.quote.volume),
    hasHistory: quality.hasUsableHistory,
    hasIndicators: quality.hasIndicators,
    hasDividends: quality.hasDividends,
    issues: quality.issues,
    strengths: quality.strengths,
  };
}

function directoryUniverse(kind: DirectoryKind): string[] {
  return kind === "stock"
    ? [...rankingStocks, ...popularStocks]
    : [...rankingFIIs, ...popularFIIs];
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

export async function buildAssetDirectory(kind: DirectoryKind): Promise<AssetDirectoryItem[]> {
  if (isProductionBuildPhase()) return [];
  const tickers = Array.from(new Set(directoryUniverse(kind).map((ticker) => ticker.toUpperCase())));
  const items: AssetDirectoryItem[] = [];

  for (const group of chunk(tickers, 12)) {
    const settled = await Promise.allSettled(group.map((ticker) => getStockByTicker(ticker)));
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      const stock = result.value;
      const resolvedKind = stock.assetKind === "fii" || stock.ticker.endsWith("11") ? "fii" : "stock";
      if (kind === "stock" && resolvedKind === "fii") continue;
      if (kind === "fii" && resolvedKind !== "fii") continue;
      items.push(itemFromStock(stock));
    }
  }

  return items.sort((a, b) => a.ticker.localeCompare(b.ticker, "pt-BR"));
}
