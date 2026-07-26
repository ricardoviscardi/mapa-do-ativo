import { fetchBrapiBundle } from "@/lib/stocks/brapi-client";
import { getStockFromSupabase } from "@/lib/stocks/supabase-stock-repository";
import { getStockFromLocalSnapshot } from "@/lib/stocks/local-snapshot-repository";
import { getStockFromRemoteSnapshot } from "@/lib/stocks/remote-snapshot-repository";
import { resolveCurrentTicker, tickerAliasWarning } from "@/lib/stocks/ticker-aliases";
import {
  createUnavailableStock,
  mapBrapiToStockData,
} from "@/lib/stocks/brapi-mapper";
import { getCachedValue, setCachedValue } from "@/lib/stocks/api-cache";
import { mockStocks } from "@/lib/stocks/mock-stocks";
import type {
  AnalysisRow,
  AnalysisTable,
  DividendEvent,
  DividendSummary,
  FundamentalAnalysisData,
  StockData,
  StockFinancialRow,
  StockIndicator,
  StockOscillation,
  CompanyInfoRow,
  StockQuote,
} from "@/types/stock";
import {
  formatCurrency,
  formatInteger,
  formatLargeCurrency,
  formatPlainPercent,
  toFiniteNumber,
} from "@/lib/utils/formatters";
import { isProductionBuildPhase } from "@/lib/utils/build-env";

const STOCK_CACHE_VERSION = "v1564";
const STOCK_CACHE_TTL_MS = 15 * 60 * 1000;
const STOCK_STALE_TTL_MS = 6 * 60 * 60 * 1000;

const UNAVAILABLE_VALUES = new Set([
  "",
  "—",
  "-",
  "não disponível",
  "nao disponível",
  "nao disponivel",
  "não disponivel",
  "em consolidação",
  "em consolidacao",
  "histórico em validação",
  "historico em validacao",
]);

export function getAllStocks(): StockData[] {
  return mockStocks;
}

function normalizeTicker(ticker: string): string {
  return ticker
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function withAliasWarning(stock: StockData, requestedTicker: string): StockData {
  const warning = tickerAliasWarning(requestedTicker);
  if (!warning) return stock;
  return {
    ...stock,
    warnings: Array.from(new Set([...(stock.warnings ?? []), warning])),
  };
}

function hasUsefulText(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return !UNAVAILABLE_VALUES.has(normalized);
}

function usefulOrFallback<T extends string | null | undefined>(
  primary: T,
  fallback: T,
): T {
  return hasUsefulText(primary) ? primary : fallback;
}

function normalizeLabel(label: string): string {
  const clean = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (clean === "dy12m" || (clean.includes("dividend") && clean.includes("yield")) || clean.includes("divyield")) return "dividendyield";
  if (clean === "pl" || clean.includes("priceearnings")) return "pl";
  if (clean === "pvp" || clean.includes("pricetobook")) return "pvp";
  if (clean.includes("roe") || clean.includes("returnonequity")) return "roe";
  if (clean.includes("roic") || clean.includes("returnoninvestedcapital")) return "roic";
  if (clean.includes("margemliquida") || clean.includes("mgliquida") || clean.includes("profitmargins")) return "margemliquida";
  if (clean.includes("evebitda") || clean.includes("enterprisevalueebitda")) return "evebitda";
  if (clean.includes("divliqebitda") || clean.includes("netdebtebitda")) return "divliqebitda";
  if (clean === "vpa" || clean.includes("bookvalue")) return "vpa";
  if (clean.includes("valordemercado") || clean.includes("marketcap")) return "marketcap";
  if (clean.includes("lpa") || clean.includes("earningspershare")) return "lpa";

  return clean;
}

function parseBrazilianNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const clean = value
    .replace(/R\$/gi, "")
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePercent(value: string | null | undefined): number | null {
  if (!value || !value.includes("%")) return null;
  return parseBrazilianNumber(value);
}

function positiveNumberOrNull(value: number | null | undefined): number | null {
  return value !== null && value !== undefined && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function finiteNumberOrNull(value: number | null | undefined): number | null {
  return value !== null && value !== undefined && Number.isFinite(value)
    ? value
    : null;
}

function volumeFromHistory(stock: StockData): number | null {
  return (
    [...stock.history]
      .reverse()
      .map((point) => positiveNumberOrNull(toFiniteNumber(point.volume)))
      .find((value): value is number => value !== null) ?? null
  );
}

function volumeFromQuoteRows(stock: StockData): number | null {
  const row = stock.dayQuoteRows.find((item) => normalizeLabel(item.label) === "volume");
  return positiveNumberOrNull(parseBrazilianNumber(row?.value));
}


function computedChangePercent(
  changeValue: number | null,
  previousClose: number | null,
): number | null {
  if (changeValue === null || previousClose === null || previousClose === 0) return null;
  const value = (changeValue / previousClose) * 100;
  return Number.isFinite(value) ? value : null;
}

function chooseDisplayChangePercent(
  rawChangePercent: number | null,
  changeValue: number | null,
  previousClose: number | null,
): number | null {
  const calculated = computedChangePercent(changeValue, previousClose);

  if (rawChangePercent === null) return calculated;
  if (calculated === null) return Math.abs(rawChangePercent) <= 70 ? rawChangePercent : null;

  const rawAbs = Math.abs(rawChangePercent);
  const calculatedAbs = Math.abs(calculated);
  const looksScaled =
    rawAbs >= 10 &&
    calculatedAbs < 10 &&
    Math.abs(rawAbs / Math.max(calculatedAbs, 0.01)) >= 20;

  if (looksScaled) return calculated;

  return Math.abs(rawChangePercent) <= 70 ? rawChangePercent : calculated;
}

function buildDisplayOscillation(label: string, value: number | null): StockOscillation {
  if (value === null || Number.isNaN(value)) {
    return { label, value: "Não disponível", status: "unavailable", description: "" };
  }

  return {
    label,
    value: `${value > 0 ? "+" : ""}${formatPlainPercent(value)}`,
    status: value > 0 ? "positive" : value < 0 ? "negative" : "neutral",
    description: "",
  };
}

function pickPositiveNumber(
  primary: number | null | undefined,
  fallback: number | null | undefined,
): number | null {
  return positiveNumberOrNull(primary) ?? positiveNumberOrNull(fallback);
}

function pickFiniteNumber(
  primary: number | null | undefined,
  fallback: number | null | undefined,
): number | null {
  return finiteNumberOrNull(primary) ?? finiteNumberOrNull(fallback);
}

function isLikelyFii(stock: StockData): boolean {
  return stock.assetKind === "fii" ||
    stock.sector.toLowerCase().includes("fundo") ||
    stock.companyInfo.some((row) => {
      const label = row.label.toLowerCase();
      return label.includes("mandato") || label.includes("nº de cotas") || label.includes("numero de cotas");
    });
}

function isPlausibleDividendValue(value: string | null | undefined, isFii: boolean): boolean {
  const percent = parsePercent(value);
  if (percent === null) return false;
  return Math.abs(percent) <= (isFii ? 35 : 25);
}

function sanitizeDividendIndicator(indicator: StockIndicator, isFii: boolean): StockIndicator {
  if (normalizeLabel(indicator.label) !== "dividendyield") return indicator;
  return isPlausibleDividendValue(indicator.value, isFii)
    ? indicator
    : { ...indicator, value: "Não disponível", status: "indisponível" };
}

function sanitizePublicIndicator(indicator: StockIndicator, isFii: boolean): StockIndicator {
  if (!hasUsefulText(indicator.value)) return indicator;

  const key = normalizeLabel(indicator.label);
  const assetKind = isFii ? "fii" : "stock";

  if (key === "dividendyield") return sanitizeDividendIndicator(indicator, isFii);

  const shouldValidate = new Set([
    "pl",
    "pvp",
    "roe",
    "roa",
    "roic",
    "margemliquida",
    "evebitda",
    "divliqebitda",
  ]).has(key);

  if (!shouldValidate) return indicator;

  return analysisValueWithinPublicRange(indicator.label, indicator.value, assetKind)
    ? indicator
    : { ...indicator, value: "Não disponível", status: "indisponível" };
}

function mergeIndicators(
  primary: StockIndicator[],
  fallback: StockIndicator[],
  isFii: boolean,
): StockIndicator[] {
  const fallbackMap = new Map<string, StockIndicator>();

  for (const indicator of fallback.map((item) => sanitizeDividendIndicator(item, isFii))) {
    if (hasUsefulText(indicator.value)) {
      fallbackMap.set(normalizeLabel(indicator.label), indicator);
    }
  }

  const usedKeys = new Set<string>();
  const merged = primary.map((indicator) => {
    const key = normalizeLabel(indicator.label);
    usedKeys.add(key);
    const cleanPrimary = sanitizeDividendIndicator(indicator, isFii);

    if (hasUsefulText(cleanPrimary.value)) return cleanPrimary;

    const complement = fallbackMap.get(key);
    return complement
      ? { ...cleanPrimary, value: complement.value, status: complement.status }
      : cleanPrimary;
  });

  const extraUsefulFallbacks = [...fallbackMap.entries()]
    .filter(([key]) => !usedKeys.has(key))
    .map(([, indicator]) => indicator)
    .slice(0, 4);

  return [...merged, ...extraUsefulFallbacks];
}

function mergeRowsByLabel<T extends { label: string; value: string }>(
  primary: T[],
  fallback: T[],
): T[] {
  const fallbackMap = new Map<string, T>();

  for (const row of fallback) {
    if (hasUsefulText(row.value)) fallbackMap.set(normalizeLabel(row.label), row);
  }

  const used = new Set<string>();
  const merged = primary.map((row) => {
    const key = normalizeLabel(row.label);
    used.add(key);
    if (hasUsefulText(row.value)) return row;
    const complement = fallbackMap.get(key);
    return complement ? { ...row, value: complement.value } : row;
  });

  return [
    ...merged,
    ...[...fallbackMap.entries()]
      .filter(([key]) => !used.has(key))
      .map(([, row]) => row),
  ];
}

function mergeFinancialRows(
  primary: StockFinancialRow[],
  fallback: StockFinancialRow[],
): StockFinancialRow[] {
  return mergeRowsByLabel(primary, fallback);
}

function mergeCompanyInfoRows(
  primary: CompanyInfoRow[],
  fallback: CompanyInfoRow[],
): CompanyInfoRow[] {
  return mergeRowsByLabel(primary, fallback);
}

function tableScore(table: AnalysisTable): number {
  return table.rows.reduce(
    (score, row) => score + row.values.filter(hasUsefulText).length,
    0,
  );
}

function isPlaceholderColumn(column: string): boolean {
  const normalized = column.trim().toLowerCase();
  return normalized === "" || normalized === "—" || normalized === "atual";
}

function mergeColumns(primary: string[], fallback: string[]): string[] {
  const result: string[] = [];

  for (const column of [...primary, ...fallback]) {
    if (!result.includes(column)) result.push(column);
  }

  const useful = result.filter((column) => !isPlaceholderColumn(column));
  const placeholders = result.filter(isPlaceholderColumn);
  const orderedUseful = useful.sort((a, b) => {
    const na = Number(a.replace(/\D/g, ""));
    const nb = Number(b.replace(/\D/g, ""));
    if (Number.isFinite(na) && Number.isFinite(nb) && na > 1900 && nb > 1900) return nb - na;
    return a.localeCompare(b);
  });

  return [...orderedUseful, ...placeholders].slice(0, 7);
}

function valueAt(table: AnalysisTable, rowLabel: string, column: string): string {
  const row = table.rows.find((item) => normalizeLabel(item.label) === normalizeLabel(rowLabel));
  if (!row) return "—";
  const index = table.columns.indexOf(column);
  if (index < 0) return "—";
  return row.values[index] ?? "—";
}

function tableUsesOnlyCurrentColumn(table: AnalysisTable): boolean {
  return table.columns.length <= 1 && table.columns.every(isPlaceholderColumn);
}

function mergeAnalysisTable(primary: AnalysisTable, fallback: AnalysisTable): AnalysisTable {
  const primaryScore = tableScore(primary);
  const fallbackScore = tableScore(fallback);

  if (primaryScore === 0 && fallbackScore > 0) return fallback;
  if (fallbackScore === 0) return primary;

  // A fonte complementar pode trazer apenas uma coluna "Atual". Isso ajuda nos
  // cards-resumo, mas não deve substituir ou empobrecer a tabela histórica da
  // análise fundamentalista. Quando a base principal tem anos/trimestres, ela
  // permanece como fonte da tabela.
  if (primaryScore > 0 && tableUsesOnlyCurrentColumn(fallback)) {
    return primary;
  }

  const columns = mergeColumns(primary.columns, fallback.columns);
  const labels = Array.from(new Set([...primary.rows, ...fallback.rows].map((row) => row.label)));

  const rows = labels.map((label) => ({
    label,
    values: columns.map((column) => {
      const primaryValue = valueAt(primary, label, column);
      if (hasUsefulText(primaryValue)) return primaryValue;

      const fallbackValue = valueAt(fallback, label, column);
      if (hasUsefulText(fallbackValue)) return fallbackValue;

      // Quando a fonte complementar traz apenas a coluna Atual, usamos esse valor
      // somente para a coluna Atual. Não espalhamos valor atual em anos anteriores.
      if (isPlaceholderColumn(column)) {
        const currentFallback = valueAt(fallback, label, "Atual");
        if (hasUsefulText(currentFallback)) return currentFallback;
      }

      return "—";
    }),
  }));

  return {
    columns,
    rows,
    emptyMessage: primary.emptyMessage ?? fallback.emptyMessage,
  };
}

function mergeFundamentalAnalysis(
  primary: FundamentalAnalysisData,
  fallback: FundamentalAnalysisData,
): FundamentalAnalysisData {
  return {
    indicators: {
      annual: mergeAnalysisTable(primary.indicators.annual, fallback.indicators.annual),
      quarterly: mergeAnalysisTable(primary.indicators.quarterly, fallback.indicators.quarterly),
    },
    balanceSheet: {
      annual: mergeAnalysisTable(primary.balanceSheet.annual, fallback.balanceSheet.annual),
      quarterly: mergeAnalysisTable(primary.balanceSheet.quarterly, fallback.balanceSheet.quarterly),
    },
    incomeStatement: {
      annual: mergeAnalysisTable(primary.incomeStatement.annual, fallback.incomeStatement.annual),
      quarterly: mergeAnalysisTable(primary.incomeStatement.quarterly, fallback.incomeStatement.quarterly),
    },
    cashFlow: {
      annual: mergeAnalysisTable(primary.cashFlow.annual, fallback.cashFlow.annual),
      quarterly: mergeAnalysisTable(primary.cashFlow.quarterly, fallback.cashFlow.quarterly),
    },
  };
}

function mergeDividendSummary(
  primary: DividendSummary,
  fallback: DividendSummary,
  isFii: boolean,
): DividendSummary {
  const fallbackYield = isPlausibleDividendValue(fallback.yield12m, isFii)
    ? fallback.yield12m
    : "Não disponível";

  return {
    yield12m: hasUsefulText(primary.yield12m)
      ? primary.yield12m
      : fallbackYield,
    cash12m: usefulOrFallback(primary.cash12m, fallback.cash12m),
  };
}

function mergeDividends(
  primary: DividendEvent[],
  fallback: DividendEvent[],
): DividendEvent[] {
  const usefulPrimary = primary.filter((event) => hasUsefulText(event.value));
  if (usefulPrimary.length) return primary;
  return fallback;
}

function mergeQuote(primary: StockQuote, fallback: StockQuote): StockQuote {
  return {
    price: pickPositiveNumber(primary.price, fallback.price),
    changeValue: pickFiniteNumber(primary.changeValue, fallback.changeValue),
    changePercent: pickFiniteNumber(primary.changePercent, fallback.changePercent),
    open: pickPositiveNumber(primary.open, fallback.open),
    dayHigh: pickPositiveNumber(primary.dayHigh, fallback.dayHigh),
    dayLow: pickPositiveNumber(primary.dayLow, fallback.dayLow),
    previousClose: pickPositiveNumber(primary.previousClose, fallback.previousClose),
    volume: pickPositiveNumber(primary.volume, fallback.volume),
    marketCap: pickPositiveNumber(primary.marketCap, fallback.marketCap),
  };
}


function makeQuoteRow(label: string, value: string | null, note: string): StockFinancialRow {
  return {
    label,
    value: value ?? "Não disponível",
    note,
  };
}


function findAnalysisValue(
  data: FundamentalAnalysisData,
  labels: string[],
): string | null {
  const tables: AnalysisTable[] = [
    data.indicators.annual,
    data.indicators.quarterly,
    data.balanceSheet.annual,
    data.balanceSheet.quarterly,
    data.incomeStatement.annual,
    data.incomeStatement.quarterly,
    data.cashFlow.annual,
    data.cashFlow.quarterly,
  ];
  const normalizedLabels = labels.map(normalizeLabel);

  for (const table of tables) {
    for (const row of table.rows) {
      if (!normalizedLabels.includes(normalizeLabel(row.label))) continue;
      const value = row.values.find(hasUsefulText);
      if (hasUsefulText(value)) return value ?? null;
    }
  }

  return null;
}

function enrichIndicatorsFromAnalysis(stock: StockData): StockIndicator[] {
  const aliases: Record<string, string[]> = {
    pl: ["P/L"],
    pvp: ["P/VP"],
    dividendyield: ["Dividend Yield", "Div. Yield", "DY 12m"],
    roe: ["ROE"],
    roa: ["ROA"],
    roic: ["ROIC"],
    margemliquida: ["Margem líquida", "Mg. Líquida"],
    evebitda: ["EV/EBITDA"],
    divliqebitda: ["Dív.Líq/EBITDA", "Dív. líquida/EBITDA"],
    vpa: ["VPA", "VP/Cota", "Valor patrimonial por cota"],
    marketcap: ["Valor de mercado"],
    dividendoporcota: ["Dividendo/Cota", "Dividendo/ação"],
    dividendoporcao: ["Dividendo/Cota", "Dividendo/ação"],
    ndecotas: ["Nº de cotas", "Nº de ações"],
    ndeacoes: ["Nº de cotas", "Nº de ações"],
  };

  return stock.indicators.map((indicator) => {
    if (hasUsefulText(indicator.value)) return indicator;
    const key = normalizeLabel(indicator.label);
    const candidates = aliases[key] ?? [indicator.label];
    const value = findAnalysisValue(stock.fundamentalAnalysis, candidates);
    return hasUsefulText(value)
      ? { ...indicator, value: value as string, status: "calculado" }
      : indicator;
  });
}

function analysisValueWithinPublicRange(label: string, value: string, assetKind?: "stock" | "fii"): boolean {
  if (!hasUsefulText(value)) return false;

  const key = normalizeLabel(label);
  const parsed = parseBrazilianNumber(value);

  if (parsed === null) return true;

  const absolute = Math.abs(parsed);
  if (key === "pl") return absolute <= 120;
  if (key === "pvp") return absolute <= (assetKind === "fii" ? 20 : 40);
  if (key === "dividendyield") return absolute <= (assetKind === "fii" ? 35 : 25);
  if (key === "roe") return absolute <= 80;
  if (key === "roa") return absolute <= 50;
  if (key === "roic") return absolute <= 80;
  if (key === "margemliquida") return absolute <= 75;
  if (key === "evebitda") return absolute <= 80;
  if (key === "divliqebitda") return absolute <= 30;

  return true;
}

function sanitizeAnalysisRow(row: AnalysisRow, assetKind?: "stock" | "fii"): AnalysisRow {
  return {
    ...row,
    values: row.values.map((value) =>
      analysisValueWithinPublicRange(row.label, value, assetKind) ? value : "—",
    ),
  };
}

function hasUsefulRow(row: { values: string[] }): boolean {
  return row.values.some(hasUsefulText);
}

type TrimAnalysisOptions = {
  assetKind?: "stock" | "fii";
  historicalIndicators?: boolean;
};

function emptyLikeTable(table: AnalysisTable): AnalysisTable {
  return {
    ...table,
    columns: [],
    rows: [],
  };
}

function trimAnalysisTable(table: AnalysisTable, options: TrimAnalysisOptions = {}): AnalysisTable {
  const sanitizedRows = table.rows.map((row) => sanitizeAnalysisRow(row, options.assetKind));
  let rows = sanitizedRows.filter(hasUsefulRow);
  const usefulColumnIndexes = table.columns
    .map((column, index) => ({ column, index }))
    .filter(({ index }) => rows.some((row) => hasUsefulText(row.values[index])))
    .map(({ index }) => index);

  if (!rows.length || !usefulColumnIndexes.length) return emptyLikeTable(table);

  let selectedColumnIndexes = usefulColumnIndexes;

  if (options.historicalIndicators && usefulColumnIndexes.length >= 3) {
    const minimumUsefulCells = Math.max(
      options.assetKind === "fii" ? 3 : 4,
      Math.ceil(rows.length * (options.assetKind === "fii" ? 0.34 : 0.38)),
    );
    const denseIndexes = usefulColumnIndexes.filter((index) => {
      const usefulCells = rows.filter((row) => hasUsefulText(row.values[index])).length;
      return usefulCells >= minimumUsefulCells;
    });

    // Em páginas públicas, é melhor esconder um ano quase vazio do que manter uma
    // coluna com muitos traços. Isso preserva a leitura e evita percepção de dado quebrado.
    if (denseIndexes.length >= 2) {
      selectedColumnIndexes = denseIndexes;
    }
  }

  rows = rows
    .map((row) => ({
      ...row,
      values: selectedColumnIndexes.map((index) => row.values[index] ?? "—"),
    }))
    .filter((row) => {
      if (!options.historicalIndicators) return hasUsefulRow(row);
      const usefulCells = row.values.filter(hasUsefulText).length;

      if (selectedColumnIndexes.length >= 5) return usefulCells >= 3;
      if (selectedColumnIndexes.length >= 3) return usefulCells >= 2;
      return usefulCells >= 1;
    });

  if (!rows.length) return emptyLikeTable(table);

  const columns = selectedColumnIndexes.map((index) => table.columns[index]);
  const usefulColumnsAfterRowFilter = columns
    .map((column, index) => ({ column, index }))
    .filter(({ index }) => rows.some((row) => hasUsefulText(row.values[index])));

  if (!usefulColumnsAfterRowFilter.length) return emptyLikeTable(table);

  return {
    ...table,
    columns: usefulColumnsAfterRowFilter.map(({ column }) => column),
    rows: rows.map((row) => ({
      ...row,
      values: usefulColumnsAfterRowFilter.map(({ index }) => row.values[index] ?? "—"),
    })),
  };
}

function trimFundamentalAnalysis(
  data: FundamentalAnalysisData,
  assetKind?: "stock" | "fii",
): FundamentalAnalysisData {
  return {
    indicators: {
      annual: trimAnalysisTable(data.indicators.annual, { assetKind, historicalIndicators: true }),
      quarterly: trimAnalysisTable(data.indicators.quarterly, { assetKind }),
    },
    balanceSheet: {
      annual: trimAnalysisTable(data.balanceSheet.annual, { assetKind }),
      quarterly: trimAnalysisTable(data.balanceSheet.quarterly, { assetKind }),
    },
    incomeStatement: {
      annual: trimAnalysisTable(data.incomeStatement.annual, { assetKind }),
      quarterly: trimAnalysisTable(data.incomeStatement.quarterly, { assetKind }),
    },
    cashFlow: {
      annual: trimAnalysisTable(data.cashFlow.annual, { assetKind }),
      quarterly: trimAnalysisTable(data.cashFlow.quarterly, { assetKind }),
    },
  };
}

function dividendCashFromEvents(dividends: DividendEvent[], referenceDate = new Date()): number | null {
  const start = new Date(referenceDate);
  start.setFullYear(start.getFullYear() - 1);
  let total = 0;

  for (const event of dividends) {
    const rawDate = event.paymentDate && event.paymentDate !== "Não disponível" ? event.paymentDate : event.comDate;
    const date = rawDate ? new Date(rawDate.split("/").reverse().join("-")) : null;
    const value = parseBrazilianNumber(event.value);
    if (!date || Number.isNaN(date.getTime()) || value === null || value <= 0) continue;
    if (date >= start && date <= referenceDate) total += value;
  }

  return total > 0 ? total : null;
}

function cleanWarnings(stock: StockData): string[] {
  const hasHistoricalTables = [
    stock.fundamentalAnalysis.indicators.annual,
    stock.fundamentalAnalysis.balanceSheet.annual,
    stock.fundamentalAnalysis.incomeStatement.annual,
    stock.fundamentalAnalysis.cashFlow.annual,
  ].some((table) => table.columns.some((column) => !isPlaceholderColumn(column)) && tableScore(table) > 0);

  return stock.warnings.filter((warning) => {
    const normalized = warning.toLowerCase();
    if (hasHistoricalTables && normalized.includes("base histórica")) return false;
    if (normalized.includes("fonte")) return false;
    return true;
  });
}

function normalizeStockForDisplay(stock: StockData): StockData {
  const latestHistory = stock.history.at(-1) ?? null;
  const previousHistory = stock.history.at(-2) ?? null;
  const historyPrice = positiveNumberOrNull(toFiniteNumber(latestHistory?.close));
  const historyPreviousClose = positiveNumberOrNull(toFiniteNumber(previousHistory?.close));
  const quotePrice = positiveNumberOrNull(toFiniteNumber(stock.quote.price));
  const quotePreviousClose = positiveNumberOrNull(toFiniteNumber(stock.quote.previousClose));
  const quoteChangeValue = finiteNumberOrNull(toFiniteNumber(stock.quote.changeValue));
  const quoteChangePercent = finiteNumberOrNull(toFiniteNumber(stock.quote.changePercent));
  const price = quotePrice ?? historyPrice;
  const previousClose = quotePreviousClose ?? historyPreviousClose;
  const changeValue =
    quoteChangeValue ??
    (price !== null && previousClose !== null ? price - previousClose : null);
  const changePercent = chooseDisplayChangePercent(quoteChangePercent, changeValue, previousClose);
  const marketCap = positiveNumberOrNull(toFiniteNumber(stock.quote.marketCap));
  const volume =
    positiveNumberOrNull(toFiniteNumber(stock.quote.volume)) ??
    volumeFromHistory(stock) ??
    volumeFromQuoteRows(stock);
  const open = positiveNumberOrNull(toFiniteNumber(stock.quote.open));
  const dayHigh = positiveNumberOrNull(toFiniteNumber(stock.quote.dayHigh));
  const dayLow = positiveNumberOrNull(toFiniteNumber(stock.quote.dayLow));
  const hasIntraday = open !== null || dayHigh !== null || dayLow !== null;

  const dayQuoteRows = hasIntraday
    ? [
        makeQuoteRow("Abertura", open === null ? null : formatCurrency(open), "Preço de abertura."),
        makeQuoteRow("Máxima", dayHigh === null ? null : formatCurrency(dayHigh), "Máxima do dia."),
        makeQuoteRow("Mínima", dayLow === null ? null : formatCurrency(dayLow), "Mínima do dia."),
        makeQuoteRow("Fech. anterior", previousClose === null ? null : formatCurrency(previousClose), "Fechamento anterior."),
        makeQuoteRow("Volume", volume === null ? null : formatInteger(volume), "Volume negociado."),
        makeQuoteRow("Valor de mercado", marketCap === null ? null : formatLargeCurrency(marketCap), "Valor de mercado."),
      ]
    : [
        makeQuoteRow("Último fechamento", price === null ? null : formatCurrency(price), "Último fechamento disponível."),
        makeQuoteRow("Fech. anterior", previousClose === null ? null : formatCurrency(previousClose), "Fechamento anterior."),
        makeQuoteRow("Variação", changePercent === null ? null : formatPlainPercent(changePercent), "Variação entre o último fechamento e o fechamento anterior."),
        makeQuoteRow("Volume", volume === null ? null : formatInteger(volume), "Volume negociado."),
        makeQuoteRow("Valor de mercado", marketCap === null ? null : formatLargeCurrency(marketCap), "Valor de mercado."),
      ];

  const isFii = isLikelyFii(stock);
  const dividendCash = dividendCashFromEvents(stock.dividends);
  const computedYield = price && dividendCash ? formatPlainPercent((dividendCash / price) * 100) : null;
  const chosenYield = hasUsefulText(stock.dividendSummary.yield12m)
    ? stock.dividendSummary.yield12m
    : computedYield;
  const sanitizedYield: string = isPlausibleDividendValue(chosenYield, isFii)
    ? (chosenYield as string)
    : "Não disponível";
  const fundamentalAnalysis = trimFundamentalAnalysis(stock.fundamentalAnalysis, stock.assetKind);
  const normalizedBase: StockData = {
    ...stock,
    fundamentalAnalysis,
    warnings: cleanWarnings({ ...stock, fundamentalAnalysis }),
    quote: {
      ...stock.quote,
      price,
      previousClose,
      changeValue,
      changePercent,
      marketCap,
      volume,
      open,
      dayHigh,
      dayLow,
    },
    oscillations: stock.oscillations.map((oscillation) =>
      oscillation.label.toLowerCase() === "dia"
        ? buildDisplayOscillation("Dia", changePercent)
        : oscillation,
    ),
    dayQuoteRows,
    dividendSummary: {
      ...stock.dividendSummary,
      yield12m: sanitizedYield,
      cash12m: sanitizedYield === "Não disponível"
        ? "Não disponível"
        : hasUsefulText(stock.dividendSummary.cash12m)
          ? stock.dividendSummary.cash12m
          : dividendCash === null
            ? stock.dividendSummary.cash12m
            : `${formatCurrency(dividendCash)}/${isFii ? "cota" : "ação"}`,
    },
  };

  const cleanIndicators = enrichIndicatorsFromAnalysis(normalizedBase)
    .map((indicator) => sanitizePublicIndicator(indicator, isFii));

  return {
    ...normalizedBase,
    indicators: cleanIndicators,
  };
}

function hasMissingImportantData(stock: StockData): boolean {
  const unavailableIndicators = stock.indicators.filter(
    (indicator) => !hasUsefulText(indicator.value),
  ).length;
  const indicatorMissingRatio = stock.indicators.length
    ? unavailableIndicators / stock.indicators.length
    : 1;

  const financialScore =
    tableScore(stock.fundamentalAnalysis.indicators.annual) +
    tableScore(stock.fundamentalAnalysis.balanceSheet.annual) +
    tableScore(stock.fundamentalAnalysis.incomeStatement.annual) +
    tableScore(stock.fundamentalAnalysis.cashFlow.annual);

  const dayRowsMissing = stock.dayQuoteRows.filter((row) => !hasUsefulText(row.value)).length;
  const dividendInvalid =
    hasUsefulText(stock.dividendSummary.yield12m) &&
    !isPlausibleDividendValue(stock.dividendSummary.yield12m, isLikelyFii(stock));

  const isFii = isLikelyFii(stock);

  if (isFii) {
    const visibleScore =
      tableScore(stock.fundamentalAnalysis.indicators.annual) +
      tableScore(stock.fundamentalAnalysis.balanceSheet.annual) +
      tableScore(stock.fundamentalAnalysis.incomeStatement.annual);
    return (
      indicatorMissingRatio >= 0.10 ||
      visibleScore <= 8 ||
      dayRowsMissing >= 1 ||
      dividendInvalid
    );
  }

  return (
    indicatorMissingRatio >= 0.35 ||
    financialScore <= 6 ||
    dayRowsMissing >= 3 ||
    dividendInvalid
  );
}

function mergeStockData(primary: StockData, fallback: StockData): StockData {
  const isFii = isLikelyFii(primary) || isLikelyFii(fallback);
  const mergedHistory = primary.history.length >= fallback.history.length ? primary.history : fallback.history;
  const mergedQuote = mergeQuote(primary.quote, fallback.quote);
  const indicators = mergeIndicators(primary.indicators, fallback.indicators, isFii);
  const dayQuoteRows = mergeFinancialRows(primary.dayQuoteRows, fallback.dayQuoteRows);

  return {
    ...primary,
    assetKind: primary.assetKind ?? fallback.assetKind,
    companyName: hasUsefulText(primary.companyName) ? primary.companyName : fallback.companyName,
    fullName: primary.fullName ?? fallback.fullName,
    sector: hasUsefulText(primary.sector) ? primary.sector : fallback.sector,
    subsector: primary.subsector ?? fallback.subsector,
    logoUrl: primary.logoUrl ?? fallback.logoUrl,
    source: "Base Mapa do Ativo",
    quote: mergedQuote,
    dividendSummary: mergeDividendSummary(primary.dividendSummary, fallback.dividendSummary, isFii),
    indicators,
    dayQuoteRows,
    companyInfo: mergeCompanyInfoRows(primary.companyInfo, fallback.companyInfo),
    history: mergedHistory,
    oscillations: primary.oscillations.some((item) => hasUsefulText(item.value))
      ? primary.oscillations
      : fallback.oscillations,
    fundamentalAnalysis: mergeFundamentalAnalysis(
      primary.fundamentalAnalysis,
      fallback.fundamentalAnalysis,
    ),
    dividends: mergeDividends(primary.dividends, fallback.dividends),
    related: primary.related.length ? primary.related : fallback.related,
    warnings: primary.warnings.filter((warning) => !warning.toLowerCase().includes("fonte")),
  };
}

function withCacheWarning(
  stock: StockData,
  state: "hit" | "stale",
  ageMs: number | null,
): StockData {
  if (state !== "stale") {
    return stock;
  }

  const ageMinutes = ageMs === null ? null : Math.round(ageMs / 60_000);
  const staleMessage =
    ageMinutes === null
      ? "Dados exibidos a partir do cache temporário."
      : `Dados exibidos a partir do cache temporário de aproximadamente ${ageMinutes} min.`;

  return {
    ...stock,
    warnings: Array.from(new Set([...(stock.warnings ?? []), staleMessage])),
  };
}

function shouldTryLiveComplement(stock: StockData): boolean {
  if (hasMissingImportantData(stock)) return true;
  if (stock.ticker === "NTCO3") return true;
  if (stock.assetKind === "fii") return true;
  return false;
}

async function fetchLiveComplement(normalizedTicker: string): Promise<StockData | null> {
  // Durante o build, evitamos chamadas externas para que o deploy não dependa
  // de APIs públicas ou rede local. Em runtime, a complementação continua ativa.
  if (isProductionBuildPhase()) return null;

  const bundle = await fetchBrapiBundle(normalizedTicker);
  const hasAnyData = Boolean(
    bundle.classicQuote ||
      bundle.quote ||
      bundle.profile ||
      bundle.statistics ||
      bundle.financialData ||
      bundle.yahooHistory ||
      bundle.yahooQuote ||
      bundle.yahooSummary ||
      bundle.fundamentus,
  );

  if (!hasAnyData) return null;

  return mapBrapiToStockData({
    ticker: normalizedTicker,
    classicQuote: bundle.classicQuote,
    quote: bundle.quote,
    profile: bundle.profile,
    statistics: bundle.statistics,
    statisticsHistory: bundle.statisticsHistory,
    financialData: bundle.financialData,
    financialDataHistory: bundle.financialDataHistory,
    balanceAnnual: bundle.balanceAnnual,
    balanceQuarterly: bundle.balanceQuarterly,
    incomeAnnual: bundle.incomeAnnual,
    incomeQuarterly: bundle.incomeQuarterly,
    cashAnnual: bundle.cashAnnual,
    cashQuarterly: bundle.cashQuarterly,
    dividends: bundle.dividends,
    historical: bundle.historical,
    yahooHistory: bundle.yahooHistory,
    yahooQuote: bundle.yahooQuote,
    yahooSummary: bundle.yahooSummary,
    fundamentus: bundle.fundamentus,
  });
}

export async function getStockByTicker(ticker: string): Promise<StockData> {
  const requestedTicker = normalizeTicker(ticker);
  const normalizedTicker = resolveCurrentTicker(requestedTicker);

  if (!normalizedTicker || normalizedTicker === "—") {
    return createUnavailableStock("—", "Digite um ticker válido.");
  }

  const cacheKey = `${STOCK_CACHE_VERSION}:stock:${requestedTicker}:${normalizedTicker}`;
  const cached = getCachedValue<StockData>(cacheKey);

  if (cached.state === "hit" && cached.value) {
    return normalizeStockForDisplay(withAliasWarning(cached.value, requestedTicker));
  }

  const supabaseStock = await getStockFromSupabase(normalizedTicker);
  const localSnapshotStock = supabaseStock
    ? null
    : await getStockFromLocalSnapshot(normalizedTicker);
  const remoteSnapshotStock = supabaseStock || localSnapshotStock
    ? null
    : await getStockFromRemoteSnapshot(normalizedTicker);
  const primaryStock = supabaseStock ?? localSnapshotStock ?? remoteSnapshotStock;

  if (primaryStock) {
    if (!shouldTryLiveComplement(primaryStock)) {
      return normalizeStockForDisplay(withAliasWarning(setCachedValue(
        cacheKey,
        primaryStock,
        STOCK_CACHE_TTL_MS,
        STOCK_STALE_TTL_MS,
      ), requestedTicker));
    }

    const liveComplement = await fetchLiveComplement(normalizedTicker);
    const enrichedStock = liveComplement
      ? mergeStockData(primaryStock, liveComplement)
      : primaryStock;

    return normalizeStockForDisplay(withAliasWarning(setCachedValue(
      cacheKey,
      enrichedStock,
      STOCK_CACHE_TTL_MS,
      STOCK_STALE_TTL_MS,
    ), requestedTicker));
  }

  const liveStock = await fetchLiveComplement(normalizedTicker);

  if (!liveStock) {
    if (cached.value) {
      return normalizeStockForDisplay(withAliasWarning(withCacheWarning(cached.value, "stale", cached.ageMs), requestedTicker));
    }

    return createUnavailableStock(
      normalizedTicker,
      "Ticker fora da cobertura disponível para consulta.",
    );
  }

  const partialLiveStock: StockData = {
    ...liveStock,
    source: "Complemento público parcial",
    warnings: Array.from(new Set([
      ...(liveStock.warnings ?? []),
      "Consulta exibida com cobertura parcial para este ativo.",
    ])),
  };

  return normalizeStockForDisplay(withAliasWarning(setCachedValue(
    cacheKey,
    partialLiveStock,
    STOCK_CACHE_TTL_MS,
    STOCK_STALE_TTL_MS,
  ), requestedTicker));
}
