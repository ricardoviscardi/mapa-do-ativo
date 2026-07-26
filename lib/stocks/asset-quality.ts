import type { StockData } from "@/types/stock";

export type AssetQuality = {
  score: number;
  label: "Excelente" | "Boa" | "Em observação" | "Limitada";
  indexable: boolean;
  hasPrice: boolean;
  hasUsableHistory: boolean;
  hasIndicators: boolean;
  hasDividends: boolean;
  hasMarketCap: boolean;
  issues: string[];
  strengths: string[];
};

const UNAVAILABLE = new Set([
  "",
  "—",
  "-",
  "não disponível",
  "nao disponível",
  "nao disponivel",
  "não disponivel",
  "não informado",
  "nao informado",
  "em consolidação",
  "em consolidacao",
  "histórico em validação",
  "historico em validacao",
]);

export function hasUsefulDisplayValue(value: string | null | undefined): boolean {
  if (!value) return false;
  return !UNAVAILABLE.has(value.trim().toLowerCase());
}

function countUsefulValues(values: Array<string | null | undefined>): number {
  return values.filter(hasUsefulDisplayValue).length;
}

function countUsefulTableValues(stock: StockData): number {
  const tables = [
    stock.fundamentalAnalysis.indicators.annual,
    stock.fundamentalAnalysis.indicators.quarterly,
    stock.fundamentalAnalysis.balanceSheet.annual,
    stock.fundamentalAnalysis.incomeStatement.annual,
    stock.fundamentalAnalysis.cashFlow.annual,
  ];

  return tables.reduce(
    (total, table) => total + table.rows.reduce((rowTotal, row) => rowTotal + countUsefulValues(row.values), 0),
    0,
  );
}

function qualityLabel(score: number): AssetQuality["label"] {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Boa";
  if (score >= 50) return "Em observação";
  return "Limitada";
}

export function evaluateAssetQuality(stock: StockData): AssetQuality {
  const kind = stock.assetKind ?? (stock.ticker.endsWith("11") ? "fii" : "stock");
  const usefulIndicators = stock.indicators.filter((indicator) => hasUsefulDisplayValue(indicator.value)).length;
  const usefulCompanyRows = stock.companyInfo.filter((row) => hasUsefulDisplayValue(row.value)).length;
  const usefulDayRows = stock.dayQuoteRows.filter((row) => hasUsefulDisplayValue(row.value)).length;
  const usefulTableValues = countUsefulTableValues(stock);
  const usefulDividendRows = stock.dividends.filter((event) => hasUsefulDisplayValue(event.value)).length;
  const hasDividendYield = hasUsefulDisplayValue(stock.dividendSummary.yield12m) || stock.indicators.some((indicator) => {
    const label = indicator.label.toLowerCase();
    return (label.includes("dy") || label.includes("dividend")) && hasUsefulDisplayValue(indicator.value);
  });

  const hasPrice = stock.quote.price !== null && Number.isFinite(stock.quote.price) && stock.quote.price > 0;
  const hasUsableHistory = stock.history.length >= 120;
  const hasShortHistory = stock.history.length >= 30;
  const hasIndicators = usefulIndicators >= (kind === "fii" ? 4 : 6);
  const hasDividends = usefulDividendRows >= 3 || hasDividendYield;
  const hasMarketCap = stock.quote.marketCap !== null && Number.isFinite(stock.quote.marketCap) && stock.quote.marketCap > 0;

  let score = 0;
  const issues: string[] = [];
  const strengths: string[] = [];

  if (hasPrice) {
    score += 20;
    strengths.push("cotação atual disponível");
  } else {
    issues.push("sem cotação atual confiável");
  }

  if (hasUsableHistory) {
    score += 20;
    strengths.push("histórico suficiente para gráfico");
  } else if (hasShortHistory) {
    score += 12;
    issues.push("histórico curto");
  } else {
    issues.push("histórico insuficiente");
  }

  if (hasIndicators) {
    score += 20;
    strengths.push("indicadores principais preenchidos");
  } else if (usefulIndicators >= 3) {
    score += 12;
    issues.push("indicadores parciais");
  } else {
    issues.push("poucos indicadores disponíveis");
  }

  if (hasDividends) {
    score += 15;
    strengths.push(kind === "fii" ? "rendimentos disponíveis" : "proventos disponíveis");
  } else {
    issues.push(kind === "fii" ? "rendimentos insuficientes" : "proventos insuficientes");
  }

  if (hasMarketCap) {
    score += 10;
    strengths.push("valor de mercado disponível");
  } else {
    issues.push("valor de mercado ausente");
  }

  if (usefulCompanyRows >= 4) {
    score += 8;
    strengths.push("cadastro do ativo preenchido");
  } else {
    issues.push("cadastro parcial");
  }

  if (usefulDayRows >= 4) {
    score += 4;
  }

  if (kind === "stock") {
    if (usefulTableValues >= 30) {
      score += 8;
      strengths.push("fundamentos anuais disponíveis");
    } else if (usefulTableValues >= 12) {
      score += 4;
      issues.push("fundamentos parciais");
    } else {
      issues.push("fundamentos contábeis insuficientes");
    }
  } else {
    if (usefulTableValues >= 10) score += 3;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: qualityLabel(score),
    indexable: hasPrice && score >= 55,
    hasPrice,
    hasUsableHistory,
    hasIndicators,
    hasDividends,
    hasMarketCap,
    issues: Array.from(new Set(issues)).slice(0, 5),
    strengths: Array.from(new Set(strengths)).slice(0, 5),
  };
}
