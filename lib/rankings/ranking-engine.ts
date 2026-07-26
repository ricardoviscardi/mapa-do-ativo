import { evaluateAssetQuality, hasUsefulDisplayValue } from "@/lib/stocks/asset-quality";
import { getStockByTicker } from "@/lib/stocks/stock-service";
import { isProductionBuildPhase } from "@/lib/utils/build-env";
import { popularFIIs, popularStocks, rankingFIIs, rankingStocks } from "@/lib/stocks/stock-list";
import { formatInteger, formatLargeCurrency, formatPlainPercent } from "@/lib/utils/formatters";
import { displayAssetCategory } from "@/lib/stocks/asset-display";
import { sanitizeDisplayText } from "@/lib/utils/text";
import type { StockData } from "@/types/stock";
import type { RankingDefinition, RankingKind, RankingMetric } from "@/lib/rankings/ranking-definitions";

export type RankingItem = {
  ticker: string;
  name: string;
  sector: string;
  value: number;
  displayValue: string;
  hasData: boolean;
  qualityScore: number;
  qualityLabel: string;
  price: number | null;
  marketCap: number | null;
  volume: number | null;
  hasHistory: boolean;
  isOutlier: boolean;
  strengths: string[];
  issues: string[];
};

export type RankingTableData = {
  slug: string;
  title: string;
  description: string;
  valueLabel: string;
  kind: RankingKind;
  metric: RankingMetric;
  items: RankingItem[];
};

export type RankingGroup = {
  label: string;
  description: string;
  tables: RankingTableData[];
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function parseLocaleNumber(value: string | null | undefined): number | null {
  if (!hasUsefulDisplayValue(value)) return null;
  const raw = String(value);
  const hasTrillion = /tri/i.test(raw);
  const hasBillion = /bi/i.test(raw);
  const hasMillion = /mi/i.test(raw);
  const cleaned = raw
    .replace(/[R$%+]/g, "")
    .replace(/tri|bi|mi|\/ação|\/cota/gi, "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  if (hasTrillion) return parsed * 1_000_000_000_000;
  if (hasBillion) return parsed * 1_000_000_000;
  if (hasMillion) return parsed * 1_000_000;
  return parsed;
}

function indicatorValue(stock: StockData, labels: string[]): string | null {
  const normalizedLabels = labels.map(normalizeText);
  return stock.indicators.find((indicator) => normalizedLabels.includes(normalizeText(indicator.label)))?.value ?? null;
}

function companyValue(stock: StockData, fragments: string[]): string | null {
  const normalizedFragments = fragments.map(normalizeText);
  return stock.companyInfo.find((row) => normalizedFragments.some((fragment) => normalizeText(row.label).includes(fragment)))?.value ?? null;
}

function normalizeDividendYieldForPublic(value: string | null | undefined, kind: RankingKind): number | null {
  const parsed = parseLocaleNumber(value);
  if (parsed === null || parsed <= 0) return null;

  const max = kind === "fii" ? 20 : 20;
  if (parsed > max) return null;

  return parsed;
}

function metricValue(stock: StockData, metric: RankingMetric): { value: number | null; displayValue: string | null } {
  if (metric === "marketCap") {
    return {
      value: stock.quote.marketCap,
      displayValue: stock.quote.marketCap === null ? null : formatLargeCurrency(stock.quote.marketCap),
    };
  }

  if (metric === "volume") {
    return {
      value: stock.quote.volume,
      displayValue: stock.quote.volume === null ? null : formatInteger(stock.quote.volume),
    };
  }

  if (metric === "dividendYield") {
    const rawDisplayValue = indicatorValue(stock, ["DY 12m", "Div. Yield", "Dividend Yield"]) ?? stock.dividendSummary.yield12m;
    const kind: RankingKind = stock.assetKind === "fii" || stock.ticker.endsWith("11") ? "fii" : "stock";
    const value = normalizeDividendYieldForPublic(rawDisplayValue, kind);
    return {
      value,
      displayValue: value === null ? null : formatPlainPercent(value),
    };
  }

  if (metric === "pe") {
    const displayValue = indicatorValue(stock, ["P/L"]);
    const value = parseLocaleNumber(displayValue);
    return { value: value !== null && value > 0 ? value : null, displayValue };
  }

  if (metric === "pvp") {
    const displayValue = indicatorValue(stock, ["P/VP"]);
    const value = parseLocaleNumber(displayValue);
    return { value: value !== null && value > 0 ? value : null, displayValue };
  }

  if (metric === "roe") {
    const displayValue = indicatorValue(stock, ["ROE"]);
    return { value: parseLocaleNumber(displayValue), displayValue };
  }

  if (metric === "roic") {
    const displayValue = indicatorValue(stock, ["ROIC"]);
    return { value: parseLocaleNumber(displayValue), displayValue };
  }

  if (metric === "netMargin") {
    const displayValue = indicatorValue(stock, ["Margem líquida", "Mg. Líquida"]);
    return { value: parseLocaleNumber(displayValue), displayValue };
  }

  if (metric === "patrimony") {
    const displayValue = companyValue(stock, ["patrimonio", "patrimonio liquido"]) ?? indicatorValue(stock, ["Patrimônio", "Patrimônio líquido"]);
    const value = parseLocaleNumber(displayValue);
    return { value, displayValue: value === null ? null : displayValue ?? formatLargeCurrency(value) };
  }

  return { value: null, displayValue: null };
}


function isMetricValuePlausible(value: number, definition: RankingDefinition): boolean {
  if (!Number.isFinite(value)) return false;

  if (definition.metric === "dividendYield") {
    // Rankings de DY precisam ser conservadores: acima de 20% costuma envolver
    // evento extraordinário, fundo em desinvestimento/liquidação, preço distorcido
    // ou dado fora do padrão. Melhor excluir do ranking do que sugerir renda recorrente falsa.
    return value > 0 && value <= 20;
  }

  if (definition.metric === "roe" || definition.metric === "roic" || definition.metric === "netMargin") {
    return value > -100 && value <= 200;
  }

  return true;
}

function tickerUniverse(kind: RankingKind): string[] {
  return kind === "stock"
    ? [...rankingStocks, ...popularStocks]
    : [...rankingFIIs, ...popularFIIs];
}

async function loadAssets(kind: RankingKind): Promise<StockData[]> {
  if (isProductionBuildPhase()) return [];

  const uniqueTickers = Array.from(new Set(tickerUniverse(kind))).slice(0, 140);
  const results = await Promise.allSettled(uniqueTickers.map((ticker) => getStockByTicker(ticker)));

  return results
    .filter((result): result is PromiseFulfilledResult<StockData> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((stock) => (kind === "stock" ? stock.assetKind !== "fii" : stock.assetKind === "fii" || stock.ticker.endsWith("11")));
}

function assetName(stock: StockData): string {
  return sanitizeDisplayText(stock.companyName) || sanitizeDisplayText(stock.fullName) || stock.ticker;
}

function assetSector(stock: StockData): string {
  return displayAssetCategory(stock);
}

export function buildRankingItems(stocks: StockData[], definition: RankingDefinition): RankingItem[] {
  const items: RankingItem[] = [];

  for (const stock of stocks) {
    const quality = evaluateAssetQuality(stock);
    const selected = metricValue(stock, definition.metric);

    if (selected.value === null || selected.displayValue === null) continue;
    if (!Number.isFinite(selected.value)) continue;
    const isOutlier = !isMetricValuePlausible(selected.value, definition);
    if (quality.score < definition.minQualityScore) continue;

    if (isOutlier) continue;

    items.push({
      ticker: stock.ticker,
      name: assetName(stock),
      sector: assetSector(stock),
      value: selected.value,
      displayValue: selected.displayValue,
      hasData: true,
      qualityScore: quality.score,
      qualityLabel: quality.label,
      price: stock.quote.price,
      marketCap: stock.quote.marketCap,
      volume: stock.quote.volume,
      hasHistory: quality.hasUsableHistory,
      isOutlier,
      strengths: quality.strengths,
      issues: quality.issues,
    });
  }

  items.sort((a, b) => {
    if (a.isOutlier !== b.isOutlier) return a.isOutlier ? 1 : -1;
    return definition.direction === "desc" ? b.value - a.value : a.value - b.value;
  });

  return items.slice(0, definition.maxItems + 10);
}

function emptyRankingTable(definition: RankingDefinition): RankingTableData {
  return {
    slug: definition.slug,
    title: definition.title,
    description: definition.description,
    valueLabel: definition.valueLabel,
    kind: definition.kind,
    metric: definition.metric,
    items: [],
  };
}

export async function buildRanking(definition: RankingDefinition): Promise<RankingTableData> {
  if (isProductionBuildPhase()) return emptyRankingTable(definition);
  const assets = await loadAssets(definition.kind);
  return {
    slug: definition.slug,
    title: definition.title,
    description: definition.description,
    valueLabel: definition.valueLabel,
    kind: definition.kind,
    metric: definition.metric,
    items: buildRankingItems(assets, definition),
  };
}

export async function buildRankingGroups(definitions: RankingDefinition[]): Promise<{ stocks: RankingGroup; fiis: RankingGroup }> {
  if (isProductionBuildPhase()) {
    const stockDefinitions = definitions.filter((definition) => definition.kind === "stock");
    const fiiDefinitions = definitions.filter((definition) => definition.kind === "fii");

    return {
      stocks: {
        label: "Rankings de ações",
        description: "Rankings com comparação por indicador, setor e histórico. A lista prioriza uma leitura clara e contextualizada.",
        tables: stockDefinitions.map(emptyRankingTable),
      },
      fiis: {
        label: "Rankings de FIIs",
        description: "Rankings de fundos imobiliários com comparação por segmento, rendimentos, P/VP, patrimônio e liquidez.",
        tables: fiiDefinitions.map(emptyRankingTable),
      },
    };
  }

  const [stockAssets, fiiAssets] = await Promise.all([loadAssets("stock"), loadAssets("fii")]);
  const stockDefinitions = definitions.filter((definition) => definition.kind === "stock");
  const fiiDefinitions = definitions.filter((definition) => definition.kind === "fii");

  return {
    stocks: {
      label: "Rankings de ações",
      description: "Rankings com comparação por indicador, setor e histórico. A lista prioriza uma leitura clara e contextualizada.",
      tables: stockDefinitions.map((definition) => ({
        slug: definition.slug,
        title: definition.title,
        description: definition.description,
        valueLabel: definition.valueLabel,
        kind: definition.kind,
        metric: definition.metric,
        items: buildRankingItems(stockAssets, definition).slice(0, 10),
      })),
    },
    fiis: {
      label: "Rankings de FIIs",
      description: "Rankings de fundos imobiliários com comparação por segmento, rendimentos, P/VP, patrimônio e liquidez.",
      tables: fiiDefinitions.map((definition) => ({
        slug: definition.slug,
        title: definition.title,
        description: definition.description,
        valueLabel: definition.valueLabel,
        kind: definition.kind,
        metric: definition.metric,
        items: buildRankingItems(fiiAssets, definition).slice(0, 10),
      })),
    },
  };
}
