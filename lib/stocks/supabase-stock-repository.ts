import {
  supabaseSelect,
  supabaseSelectPaged,
  getSupabaseConnectionStatus,
} from "@/lib/supabase/server";
import type {
  AnalysisTable,
  DividendEvent,
  FundamentalAnalysisData,
  StockData,
  StockFinancialRow,
  StockHistoryPoint,
  StockIndicator,
  StockOscillation,
} from "@/types/stock";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatInteger,
  formatLargeCurrency,
  formatNumber,
  formatPlainPercent,
  toFiniteNumber,
} from "@/lib/utils/formatters";
import { sameDisplayText, sanitizeDisplayText } from "@/lib/utils/text";

export type AssetRow = {
  ticker: string;
  kind: "stock" | "fii";
  name: string | null;
  company_name: string | null;
  cnpj: string | null;
  sector: string | null;
  industry: string | null;
  segment: string | null;
  website: string | null;
  currency: string | null;
  source: string | null;
  updated_at: string | null;
};

export type QuoteRow = {
  price: number | null;
  change_value: number | null;
  change_percent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previous_close: number | null;
  volume: number | null;
  market_cap: number | null;
  quote_date: string | null;
  source: string | null;
  updated_at: string | null;
};

export type HistoryRow = {
  date: string;
  close: number;
  volume: number | null;
  source: string | null;
};

export type FinancialRow = {
  period_type: "annual" | "quarterly";
  reference_year: number | null;
  reference_period: string | null;
  reference_date: string | null;
  total_assets: number | null;
  current_assets: number | null;
  non_current_assets?: number | null;
  cash_and_equivalents?: number | null;
  total_liabilities: number | null;
  current_liabilities?: number | null;
  non_current_liabilities?: number | null;
  short_term_debt?: number | null;
  long_term_debt?: number | null;
  equity: number | null;
  revenue: number | null;
  cost_of_revenue?: number | null;
  gross_profit: number | null;
  operating_expenses?: number | null;
  ebit: number | null;
  ebitda: number | null;
  financial_result?: number | null;
  income_before_tax?: number | null;
  income_tax?: number | null;
  net_income: number | null;
  operating_cash_flow: number | null;
  investing_cash_flow?: number | null;
  financing_cash_flow?: number | null;
  capex: number | null;
  dividends_paid?: number | null;
  free_cash_flow: number | null;
  net_change_cash?: number | null;
  source: string | null;
};

export type DividendRow = {
  type: string | null;
  value: number | null;
  com_date: string | null;
  payment_date: string | null;
  source: string | null;
};

export type IndicatorRow = {
  reference_date: string;
  pe: number | null;
  pvp: number | null;
  dividend_yield: number | null;
  roe: number | null;
  roa: number | null;
  roic: number | null;
  net_margin: number | null;
  ev_ebitda: number | null;
  debt_ebitda: number | null;
  book_value_per_share: number | null;
  market_cap: number | null;
  shares_outstanding: number | null;
  vp_per_share: number | null;
  dividend_per_share: number | null;
  source: string | null;
};

function normalizeTicker(ticker: string): string {
  return ticker
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function latest<T>(items: T[]): T | null {
  return items[0] ?? null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" || typeof value === "string") {
    return toFiniteNumber(value);
  }

  return null;
}

function normalizePercentValue(value: unknown, maxAbs = 100): number | null {
  const numberValue = numberOrNull(value);

  if (numberValue === null) return null;

  const percentValue =
    Math.abs(numberValue) <= 1 ? numberValue * 100 : numberValue;

  if (!Number.isFinite(percentValue) || Math.abs(percentValue) > maxAbs) {
    return null;
  }

  return percentValue;
}

function normalizeAlreadyPercentValue(
  value: unknown,
  maxAbs = 100,
): number | null {
  const numberValue = numberOrNull(value);

  if (
    numberValue === null ||
    !Number.isFinite(numberValue) ||
    Math.abs(numberValue) > maxAbs
  ) {
    return null;
  }

  return numberValue;
}

function safePercent(value: unknown, maxAbs = 100): string | null {
  const percentValue = normalizePercentValue(value, maxAbs);
  return percentValue === null ? null : formatPlainPercent(percentValue);
}

function safeAlreadyPercent(value: unknown, maxAbs = 100): string | null {
  const percentValue = normalizeAlreadyPercentValue(value, maxAbs);
  return percentValue === null ? null : formatPlainPercent(percentValue);
}

function plausibleDividendYield(
  value: unknown,
  assetKind: "stock" | "fii",
): number | null {
  const maxAbs = assetKind === "fii" ? 35 : 25;
  return normalizeAlreadyPercentValue(value, maxAbs);
}

const textFixes: Array<[RegExp, string]> = [
  [/N�o/g, "Não"],
  [/A��es/g, "Ações"],
  [/El�trica/g, "Elétrica"],
  [/El�trico/g, "Elétrico"],
  [/Energ�tica/g, "Energética"],
  [/Petr�leo/g, "Petróleo"],
  [/G�s/g, "Gás"],
  [/Minera��o/g, "Mineração"],
  [/Constru��o/g, "Construção"],
  [/Comunica��o/g, "Comunicação"],
  [/Distribui��o/g, "Distribuição"],
  [/Transmiss�o/g, "Transmissão"],
  [/Servi�os/g, "Serviços"],
  [/Servi�o/g, "Serviço"],
  [/B�sicos/g, "Básicos"],
  [/B�sico/g, "Básico"],
  [/Imobili�rios/g, "Imobiliários"],
  [/Imobili�rio/g, "Imobiliário"],
  [/Com�rcio/g, "Comércio"],
  [/Alimenta��o/g, "Alimentação"],
  [/Educa��o/g, "Educação"],
  [/Sa�de/g, "Saúde"],
  [/Inform�tica/g, "Informática"],
  [/Telecomunica��es/g, "Telecomunicações"],
  [/Institui��es/g, "Instituições"],
  [/Administra��o/g, "Administração"],
  [/Gest�o/g, "Gestão"],
  [/Cr�dito/g, "Crédito"],
  [/M�quinas/g, "Máquinas"],
  [/Log�stica/g, "Logística"],
  [/A�reo/g, "Aéreo"],
  [/Qu�mica/g, "Química"],
  [/Sider�rgica/g, "Siderúrgica"],
  [/Agr�cola/g, "Agrícola"],
  [/Tecnol�gico/g, "Tecnológico"],
  [/Tecnol�gica/g, "Tecnológica"],
];

function sanitizeTextLegacy(value: string | null | undefined): string | null {
  if (!value) return null;

  let text = value.trim();

  for (const [pattern, replacement] of textFixes) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/\s+/g, " ").trim();

  return text || null;
}

function sameTextLegacy(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" }) === 0;
}

function sanitizeNullable(value: string | null | undefined): string | null {
  const sanitized = sanitizeDisplayText(value);
  return sanitized || null;
}

function usefulSegment(value: string | null | undefined): string | null {
  const sanitized = sanitizeNullable(value);
  if (!sanitized) return null;
  if (["EQUITY", "ETF", "MUTUALFUND"].includes(sanitized.toUpperCase()))
    return null;
  return sanitized;
}

function normalizeForRule(value: string | null | undefined): string {
  return sanitizeDisplayText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isFinancialBusinessText(...values: Array<string | null | undefined>): boolean {
  const text = values.map(normalizeForRule).join(" ");
  return (
    text.includes("banco") ||
    text.includes("bancos") ||
    text.includes("servicos financeiros") ||
    text.includes("servico financeiro") ||
    text.includes("financeiro") ||
    text.includes("seguradora") ||
    text.includes("seguros") ||
    text.includes("capital markets") ||
    text.includes("credit services") ||
    text.includes("financial")
  );
}

function safeRatioDisplay(value: number | null, maxAbs = 80): string | null {
  const clean = sanitizeRatio(value, maxAbs);
  return clean === null ? null : formatNumber(clean);
}

function safePublicPercent(value: number | null, maxAbs = 100): string | null {
  return safeAlreadyPercent(value, maxAbs);
}

function cleanReportedPercent(value: number | null, maxAbs = 100): number | null {
  if (value === null || !Number.isFinite(value) || Math.abs(value) > maxAbs) return null;
  return value;
}

function choosePlausiblePercent(
  computed: number | null,
  existing: number | null,
  maxAbs = 100,
): number | null {
  const cleanComputed = cleanReportedPercent(computed, maxAbs);
  const cleanExisting = cleanReportedPercent(existing, maxAbs);

  if (cleanComputed !== null && cleanExisting !== null) {
    const computedAbs = Math.abs(cleanComputed);
    const existingAbs = Math.abs(cleanExisting);
    if (computedAbs > 0 && existingAbs > 0) {
      const ratio = computedAbs > existingAbs ? computedAbs / existingAbs : existingAbs / computedAbs;
      if (ratio >= 3) return cleanExisting;
    }
    return cleanComputed;
  }

  return cleanComputed ?? cleanExisting;
}

function hideRowsByLabel(table: AnalysisTable, labelsToHide: string[]): AnalysisTable {
  const normalizedToHide = labelsToHide.map((label) =>
    label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ""),
  );

  return {
    ...table,
    rows: table.rows.filter((row) => {
      const normalized = row.label
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
      return !normalizedToHide.includes(normalized);
    }),
  };
}

function lastFiveYears(
  dividends: DividendRow[],
  referenceDate = new Date(),
): DividendRow[] {
  const start = new Date(referenceDate);
  start.setFullYear(start.getFullYear() - 5);

  return dividends.filter((dividend) => {
    const rawDate = dividend.payment_date ?? dividend.com_date;
    if (!rawDate) return false;
    const date = new Date(rawDate);
    return (
      !Number.isNaN(date.getTime()) && date >= start && date <= referenceDate
    );
  });
}

function indicator(
  label: string,
  value: string | null,
  description: string,
): StockIndicator {
  return {
    label,
    value: value ?? "Não disponível",
    description,
    status: value ? "api" : "indisponível",
  };
}

function quoteRow(
  label: string,
  value: string | null,
  note: string,
): StockFinancialRow {
  return {
    label,
    value: value ?? "Não disponível",
    note,
  };
}

function buildOscillation(
  label: string,
  value: number | null,
): StockOscillation {
  if (value === null || Number.isNaN(value)) {
    return {
      label,
      value: "Não disponível",
      status: "unavailable",
      description: "",
    };
  }

  return {
    label,
    value: `${value > 0 ? "+" : ""}${formatPlainPercent(value)}`,
    status: value > 0 ? "positive" : value < 0 ? "negative" : "neutral",
    description: "",
  };
}

function variation(current: number | null, past: number | null): number | null {
  if (current === null || past === null || past === 0) return null;
  return (current / past - 1) * 100;
}

function pointBeforeOrAt(
  history: StockHistoryPoint[],
  target: Date,
): StockHistoryPoint | null {
  return (
    history.filter((point) => new Date(point.date) <= target).at(-1) ?? null
  );
}

function firstPointOfYear(
  history: StockHistoryPoint[],
  year: number,
): StockHistoryPoint | null {
  return (
    history.find((point) => new Date(point.date).getFullYear() === year) ?? null
  );
}

function buildOscillations(
  history: StockHistoryPoint[],
  price: number | null,
  dayChangePercent: number | null,
): StockOscillation[] {
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const last = sorted.at(-1) ?? null;
  const current = price ?? last?.close ?? null;
  const lastDate = last ? new Date(last.date) : new Date();
  const pastByDays = (days: number) => {
    const target = new Date(lastDate);
    target.setDate(target.getDate() - days);
    return pointBeforeOrAt(sorted, target)?.close ?? null;
  };

  const currentYear = new Date().getFullYear();
  const values: StockOscillation[] = [
    buildOscillation("Dia", dayChangePercent),
    buildOscillation("5 dias", variation(current, pastByDays(5))),
    buildOscillation("Mês", variation(current, pastByDays(31))),
    buildOscillation("30 dias", variation(current, pastByDays(30))),
    buildOscillation("12 meses", variation(current, pastByDays(365))),
  ];

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    const first = firstPointOfYear(sorted, year);
    const lastOfYear = sorted
      .filter((point) => new Date(point.date).getFullYear() === year)
      .at(-1);
    const end = year === currentYear ? current : (lastOfYear?.close ?? null);
    const value = variation(end, first?.close ?? null);

    // Não exibe anos totalmente sem histórico. Isso evita cartões de FII recém-listado
    // com vários "Não disponível" em anos anteriores que a fonte realmente não possui.
    if (value !== null) {
      values.push(buildOscillation(String(year), value));
    }
  }

  return values;
}

function getYearColumns() {
  const year = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => String(year - index));
}

function annualColumnsFromRows(rows: Array<{ reference_date?: string | null; reference_year?: number | null }>): string[] {
  const years = Array.from(
    new Set(
      rows
        .map((row) => row.reference_year ?? (row.reference_date ? Number(String(row.reference_date).slice(0, 4)) : null))
        .filter((year): year is number => Number.isFinite(year))
    )
  )
    .sort((a, b) => b - a)
    .slice(0, 6)
    .map(String);

  return years.length ? years : getYearColumns();
}

function latestAnnualRowsByYear<T extends { reference_date?: string | null; reference_year?: number | null }>(rows: T[]): Map<number, T> {
  const sorted = [...rows].sort((a, b) =>
    String(b.reference_date ?? b.reference_year ?? "").localeCompare(String(a.reference_date ?? a.reference_year ?? ""))
  );
  const byYear = new Map<number, T>();

  for (const row of sorted) {
    const year = row.reference_year ?? (row.reference_date ? Number(String(row.reference_date).slice(0, 4)) : null);
    if (year !== null && Number.isFinite(year) && !byYear.has(year)) {
      byYear.set(year, row);
    }
  }

  return byYear;
}

function priceAtOrBefore(historyRows: Array<{ date: string; close: number | null }>, referenceDate: string | null | undefined): number | null {
  if (!referenceDate) return null;
  const target = new Date(referenceDate).getTime();
  if (!Number.isFinite(target)) return null;

  const row = [...historyRows]
    .filter((item) => item.close !== null && new Date(item.date).getTime() <= target)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .at(-1);

  return row?.close ?? null;
}

function lastPriceInYear(
  historyRows: Array<{ date: string; close: number | null }>,
  year: number,
): number | null {
  return (
    [...historyRows]
      .filter((item) => item.close !== null && new Date(item.date).getFullYear() === year)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .at(-1)?.close ?? null
  );
}

function yearFromReferenceDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const year = Number(String(value).slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function latestIndicatorByYear(rows: IndicatorRow[]): Map<number, IndicatorRow> {
  const out = new Map<number, IndicatorRow>();
  const sorted = [...rows].sort((a, b) => String(b.reference_date ?? "").localeCompare(String(a.reference_date ?? "")));

  for (const row of sorted) {
    const year = yearFromReferenceDate(row.reference_date);
    if (year !== null && !out.has(year)) out.set(year, row);
  }

  return out;
}

function latestFinancialByYear(rows: FinancialRow[]): Map<number, FinancialRow> {
  const out = new Map<number, FinancialRow>();
  const sorted = sortFinancialRowsDesc(rows);

  for (const row of sorted) {
    const year = row.reference_year ?? yearFromReferenceDate(row.reference_date);
    if (year !== null && Number.isFinite(year) && !out.has(year)) out.set(year, row);
  }

  return out;
}

function latestAnnualFinancialByYear(rows: FinancialRow[]): Map<number, FinancialRow> {
  const out = new Map<number, FinancialRow>();
  const sorted = sortFinancialRowsDesc(
    rows.filter(
      (row) => row.period_type === "annual" && isYearEndReferenceDate(row.reference_date),
    ),
  );

  for (const row of sorted) {
    const year = row.reference_year ?? yearFromReferenceDate(row.reference_date);
    if (year !== null && Number.isFinite(year) && !out.has(year)) out.set(year, row);
  }

  return out;
}

function usefulYearsForAnnualIndicators(args: {
  historyRows: Array<{ date: string; close: number | null }>;
  dividendRows: DividendRow[];
  financials: FinancialRow[];
  existingIndicators: IndicatorRow[];
  assetKind: "stock" | "fii";
}): number[] {
  const currentYear = new Date().getFullYear();
  const years = new Set<number>();

  for (const row of args.historyRows) {
    const year = yearFromReferenceDate(row.date);
    if (year !== null) years.add(year);
  }
  for (const row of args.dividendRows) {
    const year = dividendReferenceYear(row);
    if (year !== null) years.add(year);
  }
  for (const row of args.financials) {
    const year = row.reference_year ?? yearFromReferenceDate(row.reference_date);
    if (year !== null && Number.isFinite(year)) years.add(year);
  }
  for (const row of args.existingIndicators) {
    const year = yearFromReferenceDate(row.reference_date);
    if (year !== null) years.add(year);
  }

  const lookback = args.assetKind === "fii" ? 7 : 6;
  const maxYear = args.assetKind === "stock" ? currentYear - 1 : currentYear;

  return [...years]
    .filter((year) => year <= maxYear && year >= currentYear - lookback)
    .sort((a, b) => b - a)
    .slice(0, 6);
}

function indicatorValueFromRow(row: IndicatorRow | null | undefined, key: keyof IndicatorRow): number | null {
  return row ? numberOrNull(row[key]) : null;
}

function latestCloseFromHistoryRows(
  historyRows: Array<{ date: string; close: number | null }>,
): number | null {
  return (
    [...historyRows]
      .filter((row) => row.close !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .at(-1)?.close ?? null
  );
}

function normalizeSharesOutstandingValue(
  value: unknown,
  referenceShares: number | null,
): number | null {
  const shares = numberOrNull(value);
  if (shares === null || shares <= 0) return referenceShares;

  if (referenceShares === null || referenceShares <= 0) return shares;

  const candidates = [shares, shares / 10, shares / 100, shares / 1000, shares * 10, shares * 100];
  const best = candidates
    .filter((candidate) => Number.isFinite(candidate) && candidate > 0)
    .map((candidate) => ({
      value: candidate,
      distance: Math.abs(Math.log(candidate / referenceShares)),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!best) return shares;

  const ratio = best.value / referenceShares;
  return ratio >= 0.35 && ratio <= 2.85 ? best.value : referenceShares;
}

function firstUsefulIndicatorValue(
  rows: IndicatorRow[],
  latestIndicator: IndicatorRow | null | undefined,
  key: keyof IndicatorRow,
): number | null {
  for (const row of rows) {
    const value = numberOrNull(row[key]);
    if (value !== null) return value;
  }

  return numberOrNull(latestIndicator?.[key]);
}

const FINANCIAL_VALUE_KEYS: Array<keyof FinancialRow> = [
  "total_assets",
  "current_assets",
  "non_current_assets",
  "cash_and_equivalents",
  "total_liabilities",
  "current_liabilities",
  "non_current_liabilities",
  "short_term_debt",
  "long_term_debt",
  "equity",
  "revenue",
  "cost_of_revenue",
  "gross_profit",
  "operating_expenses",
  "ebit",
  "ebitda",
  "financial_result",
  "income_before_tax",
  "income_tax",
  "net_income",
  "operating_cash_flow",
  "investing_cash_flow",
  "financing_cash_flow",
  "capex",
  "dividends_paid",
  "free_cash_flow",
  "net_change_cash",
];

function median(values: number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 === 0 ? (clean[middle - 1] + clean[middle]) / 2 : clean[middle];
}

function financialValueBaseline(
  rows: FinancialRow[],
  key: keyof FinancialRow,
  latestMarketCap: number | null,
): number | null {
  const values = rows
    .map((row) => numberOrNull(row[key]))
    .filter((value): value is number => {
      if (value === null || !Number.isFinite(value) || value === 0) return false;
      const abs = Math.abs(value);
      // Valores nessa faixa costumam estar em reais e não em uma escala quebrada.
      return abs >= 1_000 && abs <= 5_000_000_000_000;
    });

  const byOwnRows = median(values.map(Math.abs));
  if (byOwnRows !== null) return byOwnRows;

  if (latestMarketCap !== null && latestMarketCap > 0) {
    return latestMarketCap;
  }

  return null;
}

function normalizeScaledFinancialValue(
  rawValue: number | null,
  baseline: number | null,
  latestMarketCap: number | null,
): number | null {
  if (rawValue === null || !Number.isFinite(rawValue) || rawValue === 0) {
    return rawValue;
  }

  const sign = rawValue < 0 ? -1 : 1;
  const abs = Math.abs(rawValue);
  const reference = baseline ?? latestMarketCap;
  const divisors = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000, 100_000_000_000, 1_000_000_000_000];

  if (reference !== null && reference > 0) {
    const best = divisors
      .map((divisor) => abs / divisor)
      .filter((candidate) => Number.isFinite(candidate) && candidate > 0)
      .map((candidate) => ({
        value: candidate,
        distance: Math.abs(Math.log(candidate / reference)),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (best) {
      const ratio = best.value / reference;
      // Aceita uma faixa ampla, pois ativo, receita, dívida e caixa não são iguais ao valor de mercado.
      if (ratio >= 0.01 && ratio <= 100) {
        return sign * best.value;
      }
    }
  }

  // Proteção final: nenhum demonstrativo operacional de ação da B3 deve aparecer em quadrilhões/trilhões por erro de escala.
  if (abs > 5_000_000_000_000) {
    for (const divisor of divisors.slice(1)) {
      const candidate = abs / divisor;
      if (candidate <= 5_000_000_000_000) return sign * candidate;
    }
  }

  return rawValue;
}

function sanitizeFinancialRowsScale(
  financials: FinancialRow[],
  latestMarketCap: number | null,
): FinancialRow[] {
  const baselines = new Map<keyof FinancialRow, number | null>();

  for (const key of FINANCIAL_VALUE_KEYS) {
    baselines.set(key, financialValueBaseline(financials, key, latestMarketCap));
  }

  return financials.map((row) => {
    const sanitized: FinancialRow = { ...row };

    for (const key of FINANCIAL_VALUE_KEYS) {
      const current = numberOrNull(sanitized[key]);
      const normalized = normalizeScaledFinancialValue(
        current,
        baselines.get(key) ?? null,
        latestMarketCap,
      );
      (sanitized as unknown as Record<string, number | null>)[key] = normalized;
    }

    const totalAssets = numberOrNull(sanitized.total_assets);
    const currentAssets = numberOrNull(sanitized.current_assets);
    const nonCurrentAssets = numberOrNull(sanitized.non_current_assets);
    const equity = numberOrNull(sanitized.equity);
    const totalLiabilities = numberOrNull(sanitized.total_liabilities);
    const currentLiabilities = numberOrNull(sanitized.current_liabilities);
    const nonCurrentLiabilities = numberOrNull(sanitized.non_current_liabilities);
    const revenue = numberOrNull(sanitized.revenue);
    const grossProfit = numberOrNull(sanitized.gross_profit);
    const costOfRevenue = numberOrNull(sanitized.cost_of_revenue);
    const ebit = numberOrNull(sanitized.ebit);
    const operatingExpenses = numberOrNull(sanitized.operating_expenses);
    const incomeBeforeTax = numberOrNull(sanitized.income_before_tax);
    const financialResult = numberOrNull(sanitized.financial_result);
    const netIncome = numberOrNull(sanitized.net_income);
    const incomeTax = numberOrNull(sanitized.income_tax);

    if (nonCurrentAssets === null && totalAssets !== null && currentAssets !== null) {
      sanitized.non_current_assets = totalAssets - currentAssets;
    }
    if (sanitized.total_liabilities === null && totalAssets !== null && equity !== null) {
      sanitized.total_liabilities = totalAssets - equity;
    }
    const derivedTotalLiabilities = numberOrNull(sanitized.total_liabilities) ?? totalLiabilities;
    if (sanitized.non_current_liabilities === null && derivedTotalLiabilities !== null && currentLiabilities !== null) {
      sanitized.non_current_liabilities = derivedTotalLiabilities - currentLiabilities;
    }
    if (sanitized.current_liabilities === null && derivedTotalLiabilities !== null && nonCurrentLiabilities !== null) {
      sanitized.current_liabilities = derivedTotalLiabilities - nonCurrentLiabilities;
    }
    if (costOfRevenue === null && revenue !== null && grossProfit !== null) {
      sanitized.cost_of_revenue = grossProfit - revenue;
    }
    if (operatingExpenses === null && grossProfit !== null && ebit !== null) {
      sanitized.operating_expenses = ebit - grossProfit;
    }
    if (financialResult === null && incomeBeforeTax !== null && ebit !== null) {
      sanitized.financial_result = incomeBeforeTax - ebit;
    }
    if (incomeBeforeTax === null && netIncome !== null && incomeTax !== null) {
      sanitized.income_before_tax = netIncome - incomeTax;
    }

    const operatingCashFlow = numberOrNull(sanitized.operating_cash_flow);
    const investingCashFlow = numberOrNull(sanitized.investing_cash_flow);
    const financingCashFlow = numberOrNull(sanitized.financing_cash_flow);
    const capex = numberOrNull(sanitized.capex);
    if (operatingCashFlow !== null || capex !== null) {
      sanitized.free_cash_flow = (operatingCashFlow ?? 0) + (capex ?? 0);
    }
    if (sanitized.net_change_cash === null && (operatingCashFlow !== null || investingCashFlow !== null || financingCashFlow !== null)) {
      sanitized.net_change_cash = (operatingCashFlow ?? 0) + (investingCashFlow ?? 0) + (financingCashFlow ?? 0);
    }

    return sanitized;
  });
}

function sanitizeRatio(value: number | null, maxAbs = 500): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (Math.abs(value) < 0.01 || Math.abs(value) > maxAbs) return null;
  return value;
}

function chooseReliableRatio(
  computed: number | null,
  reported: number | null,
  maxAbs = 500,
): number | null {
  const cleanComputed = sanitizeRatio(computed, maxAbs);
  const cleanReported = sanitizeRatio(reported, maxAbs);

  if (cleanComputed !== null && cleanReported !== null) {
    const computedAbs = Math.abs(cleanComputed);
    const reportedAbs = Math.abs(cleanReported);
    const ratio = computedAbs > reportedAbs ? computedAbs / reportedAbs : reportedAbs / computedAbs;

    // Se a conta derivada diverge muito do indicador já consolidado, normalmente
    // a linha financeira usada é parcial/ITR ou está em escala diferente. Nesses
    // casos, usa o indicador consolidado para evitar P/L e múltiplos absurdos.
    if (ratio >= 3) return cleanReported;

    return cleanComputed;
  }

  return cleanComputed ?? cleanReported;
}

function sanitizeCurrencyPerShare(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (Math.abs(value) < 0.0001 || Math.abs(value) > 1_000) return null;
  return value;
}

function chooseDividendYieldValue(
  calculated: number | null,
  reported: number | null,
  assetKind: "stock" | "fii",
): number | null {
  const maxAbs = 25;
  const cleanReported = reported !== null && Math.abs(reported) <= maxAbs ? reported : null;
  const cleanCalculated = calculated !== null && Math.abs(calculated) <= maxAbs ? calculated : null;

  if (cleanReported !== null && cleanCalculated !== null) {
    // Quando a soma dos eventos fica muito acima do indicador informado pela fonte,
    // normalmente há split/ajuste contaminando os proventos. Nesses casos o indicador
    // reportado é mais seguro para não inflar WEGE3, MGLU3 e casos parecidos.
    if (cleanCalculated > cleanReported * 1.8 && cleanCalculated - cleanReported > 1) {
      return cleanReported;
    }
    return cleanCalculated;
  }

  return cleanReported ?? cleanCalculated;
}

function chooseComputedFirst(
  computed: number | null,
  existing: number | null,
): number | null {
  return computed !== null && Number.isFinite(computed) ? computed : existing;
}


function dividendReferenceYear(dividend: DividendRow): number | null {
  const rawDate = dividend.payment_date ?? dividend.com_date;
  if (!rawDate) return null;
  const year = Number(String(rawDate).slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function dividendsPerShareForYear(
  dividends: DividendRow[],
  year: number,
  priceAtYearEnd: number | null,
  assetKind: "stock" | "fii",
): number | null {
  const maxSinglePayment =
    priceAtYearEnd && priceAtYearEnd > 0
      ? priceAtYearEnd * (assetKind === "fii" ? 0.5 : 0.3)
      : null;

  const total = dividends.reduce((sum, dividend) => {
    if (dividendReferenceYear(dividend) !== year) return sum;
    const value = numberOrNull(dividend.value);
    if (value === null || value <= 0) return sum;
    if (maxSinglePayment !== null && value > maxSinglePayment) return sum;
    return sum + value;
  }, 0);

  return total > 0 ? total : null;
}

function dividendYieldForYear(
  dividends: DividendRow[],
  year: number,
  priceAtYearEnd: number | null,
  assetKind: "stock" | "fii",
): number | null {
  const dividendsPerShare = dividendsPerShareForYear(dividends, year, priceAtYearEnd, assetKind);
  if (dividendsPerShare === null || priceAtYearEnd === null || priceAtYearEnd <= 0) return null;
  const value = (dividendsPerShare / priceAtYearEnd) * 100;
  const maxAbs = assetKind === "fii" ? 35 : 25;
  return Math.abs(value) <= maxAbs ? value : null;
}

function chooseComputedOrPlausibleExisting(
  computed: number | null,
  existing: number | null,
  maxAbs: number,
): number | null {
  if (computed !== null && Number.isFinite(computed) && Math.abs(computed) <= maxAbs) return computed;
  if (existing !== null && Number.isFinite(existing) && Math.abs(existing) <= maxAbs) return existing;
  return null;
}

function computedIndicatorRowsFromFinancials(args: {
  financials: FinancialRow[];
  existingIndicators: IndicatorRow[];
  dividendRows: DividendRow[];
  historyRows: Array<{ date: string; close: number | null }>;
  latestMarketCap: number | null;
  latestSharesOutstanding: number | null;
  assetKind: "stock" | "fii";
  isFinancialBusiness?: boolean;
}): IndicatorRow[] {
  const currentYear = new Date().getFullYear();
  const normalizedExistingIndicators = args.assetKind === "stock"
    ? args.existingIndicators.filter((row) => {
        const year = yearFromReferenceDate(row.reference_date);
        return year === null || year < currentYear;
      })
    : args.existingIndicators;
  const existingByDate = new Map(normalizedExistingIndicators.map((row) => [row.reference_date, row]));
  const existingByYear = latestIndicatorByYear(normalizedExistingIndicators);
  const financialByYear = args.assetKind === "stock"
    ? latestAnnualFinancialByYear(args.financials)
    : latestFinancialByYear(args.financials);
  const annualFinancials = dedupeFinancialRowsByPeriod(args.financials, "annual").map(([, row]) => row);
  const rows: IndicatorRow[] = [];

  const latestHistoryPrice = latestCloseFromHistoryRows(args.historyRows);
  const impliedLatestShares =
    args.latestMarketCap !== null &&
    latestHistoryPrice !== null &&
    latestHistoryPrice > 0
      ? args.latestMarketCap / latestHistoryPrice
      : null;
  const referenceShares = normalizeSharesOutstandingValue(
    args.latestSharesOutstanding,
    impliedLatestShares,
  );
  const latestExistingIndicator = normalizedExistingIndicators[0] ?? args.existingIndicators[0] ?? null;
  const referenceVpPerShare = sanitizeCurrencyPerShare(
    indicatorValueFromRow(latestExistingIndicator, "vp_per_share") ??
      indicatorValueFromRow(latestExistingIndicator, "book_value_per_share"),
  );

  const pushRowForFinancial = (financial: FinancialRow) => {
    if (!financial.reference_date) return;

    const referenceYear = Number(String(financial.reference_date).slice(0, 4));
    const existing = existingByDate.get(financial.reference_date) ?? existingByYear.get(referenceYear);
    const shares = normalizeSharesOutstandingValue(
      indicatorValueFromRow(existing, "shares_outstanding"),
      referenceShares,
    );
    const price = priceAtOrBefore(args.historyRows, financial.reference_date);
    const computedDividendPerShare = Number.isFinite(referenceYear)
      ? dividendsPerShareForYear(args.dividendRows, referenceYear, price, args.assetKind)
      : null;
    const computedDividendYield = Number.isFinite(referenceYear)
      ? dividendYieldForYear(args.dividendRows, referenceYear, price, args.assetKind)
      : null;
    const computedMarketCap = price !== null && shares !== null ? price * shares : null;
    const marketCap = computedMarketCap ?? args.latestMarketCap ?? indicatorValueFromRow(existing, "market_cap");

    const equity = numberOrNull(financial.equity);
    const assets = numberOrNull(financial.total_assets);
    const revenue = numberOrNull(financial.revenue);
    const netIncome = numberOrNull(financial.net_income);
    const ebit = numberOrNull(financial.ebit);
    const ebitda = numberOrNull(financial.ebitda);
    const shortDebt = numberOrNull(financial.short_term_debt);
    const longDebt = numberOrNull(financial.long_term_debt);
    const cash = numberOrNull(financial.cash_and_equivalents);
    const grossDebt = (shortDebt ?? 0) + (longDebt ?? 0);
    const netDebt = grossDebt || cash !== null ? grossDebt - (cash ?? 0) : null;

    const computedPe = marketCap && netIncome && netIncome > 0 ? marketCap / netIncome : null;
    const computedPvp = marketCap && equity && equity > 0 ? marketCap / equity : null;
    const computedRoe = netIncome && equity && equity > 0 ? (netIncome / equity) * 100 : null;
    const computedRoa = netIncome && assets && assets > 0 ? (netIncome / assets) * 100 : null;
    const computedRoic = ebit && assets && assets > 0 ? (ebit / assets) * 100 : null;
    const computedNetMargin = netIncome && revenue && revenue !== 0 ? (netIncome / revenue) * 100 : null;
    const computedEvEbitda =
      marketCap && netDebt !== null && ebitda && ebitda > 0
        ? (marketCap + netDebt) / ebitda
        : null;
    const computedDebtEbitda =
      netDebt !== null && ebitda && ebitda > 0 ? netDebt / ebitda : null;
    const computedBookValue = equity && shares && shares > 0 ? equity / shares : null;
    const reportedVpPerShare = indicatorValueFromRow(existing, "vp_per_share") ?? indicatorValueFromRow(existing, "book_value_per_share");

    rows.push({
      reference_date: financial.reference_date,
      pe: chooseReliableRatio(computedPe, indicatorValueFromRow(existing, "pe"), 120),
      pvp: chooseReliableRatio(computedPvp, indicatorValueFromRow(existing, "pvp"), 40),
      dividend_yield: chooseComputedOrPlausibleExisting(
        computedDividendYield,
        normalizeAlreadyPercentValue(indicatorValueFromRow(existing, "dividend_yield"), args.assetKind === "fii" ? 25 : 25),
        25,
      ),
      roe: choosePlausiblePercent(computedRoe, indicatorValueFromRow(existing, "roe"), 120),
      roa: choosePlausiblePercent(computedRoa, indicatorValueFromRow(existing, "roa"), 80),
      roic: args.isFinancialBusiness ? null : choosePlausiblePercent(computedRoic, indicatorValueFromRow(existing, "roic"), 100),
      net_margin: args.isFinancialBusiness ? null : choosePlausiblePercent(computedNetMargin, indicatorValueFromRow(existing, "net_margin"), 80),
      ev_ebitda: args.isFinancialBusiness ? null : chooseReliableRatio(computedEvEbitda, indicatorValueFromRow(existing, "ev_ebitda"), 80),
      debt_ebitda: args.isFinancialBusiness ? null : chooseReliableRatio(computedDebtEbitda, indicatorValueFromRow(existing, "debt_ebitda"), 30),
      book_value_per_share: chooseComputedFirst(computedBookValue, reportedVpPerShare),
      market_cap: marketCap,
      shares_outstanding: shares,
      vp_per_share: chooseComputedFirst(computedBookValue, reportedVpPerShare),
      dividend_per_share: sanitizeCurrencyPerShare(computedDividendPerShare) ?? sanitizeCurrencyPerShare(indicatorValueFromRow(existing, "dividend_per_share")),
      source: existing?.source ?? "Base própria consolidada",
    });
  };

  for (const financial of annualFinancials) {
    pushRowForFinancial(financial);
  }

  if (args.assetKind === "fii") {
    const years = usefulYearsForAnnualIndicators(args);
    for (const year of years) {
      const referenceDate = `${year}-12-31`;
      const existing = existingByDate.get(referenceDate) ?? existingByYear.get(year) ?? latestExistingIndicator;
      const financial = financialByYear.get(year);
      const shares = normalizeSharesOutstandingValue(
        indicatorValueFromRow(existing, "shares_outstanding"),
        referenceShares,
      );
      const price = priceAtOrBefore(args.historyRows, referenceDate) ?? lastPriceInYear(args.historyRows, year);
      const dividendPerShare = dividendsPerShareForYear(args.dividendRows, year, price, "fii") ?? indicatorValueFromRow(existing, "dividend_per_share");
      const dividendYield =
        dividendYieldForYear(args.dividendRows, year, price, "fii") ??
        normalizeAlreadyPercentValue(indicatorValueFromRow(existing, "dividend_yield"), 25);
      const equity = numberOrNull(financial?.equity);
      const reportedVpPerShare = sanitizeCurrencyPerShare(
        indicatorValueFromRow(existing, "vp_per_share") ?? indicatorValueFromRow(existing, "book_value_per_share") ?? referenceVpPerShare,
      );
      const computedVpPerShare = equity && shares && shares > 0 ? equity / shares : null;
      const vpPerShare = sanitizeCurrencyPerShare(computedVpPerShare) ?? reportedVpPerShare;
      const marketCap =
        (price !== null && shares !== null ? price * shares : null) ??
        indicatorValueFromRow(existing, "market_cap") ??
        args.latestMarketCap;
      const pvp =
        (marketCap !== null && equity !== null && equity > 0 ? marketCap / equity : null) ??
        (price !== null && vpPerShare !== null && vpPerShare > 0 ? price / vpPerShare : null) ??
        indicatorValueFromRow(existing, "pvp");

      if (
        dividendYield !== null ||
        dividendPerShare !== null ||
        pvp !== null ||
        vpPerShare !== null ||
        marketCap !== null ||
        shares !== null
      ) {
        rows.push({
          reference_date: referenceDate,
          pe: null,
          pvp: sanitizeRatio(pvp, 20),
          dividend_yield: chooseComputedOrPlausibleExisting(
            dividendYield,
            normalizeAlreadyPercentValue(indicatorValueFromRow(existing, "dividend_yield"), 25),
            25,
          ),
          roe: null,
          roa: null,
          roic: null,
          net_margin: null,
          ev_ebitda: null,
          debt_ebitda: null,
          book_value_per_share: vpPerShare,
          market_cap: marketCap,
          shares_outstanding: shares,
          vp_per_share: vpPerShare,
          dividend_per_share: sanitizeCurrencyPerShare(dividendPerShare),
          source: existing?.source ?? "Histórico estimado por proventos e CVM",
        });
      }
    }
  }

  if (args.assetKind === "stock") {
    const years = usefulYearsForAnnualIndicators(args);
    const alreadyCoveredYears = new Set(
      rows
        .map((row) => yearFromReferenceDate(row.reference_date))
        .filter((year): year is number => year !== null),
    );

    for (const year of years) {
      if (alreadyCoveredYears.has(year)) continue;

      const referenceDate = `${year}-12-31`;
      const existing = existingByDate.get(referenceDate) ?? existingByYear.get(year);
      const financial = financialByYear.get(year);
      const shares = normalizeSharesOutstandingValue(
        indicatorValueFromRow(existing, "shares_outstanding"),
        referenceShares,
      );
      const price = priceAtOrBefore(args.historyRows, referenceDate) ?? lastPriceInYear(args.historyRows, year);
      const computedDividendPerShare = dividendsPerShareForYear(args.dividendRows, year, price, "stock");
      const computedDividendYield = dividendYieldForYear(args.dividendRows, year, price, "stock");
      const equity = numberOrNull(financial?.equity);
      const netIncome = numberOrNull(financial?.net_income);
      const revenue = numberOrNull(financial?.revenue);
      const assets = numberOrNull(financial?.total_assets);
      const ebit = numberOrNull(financial?.ebit);
      const ebitda = numberOrNull(financial?.ebitda);
      const shortDebt = numberOrNull(financial?.short_term_debt);
      const longDebt = numberOrNull(financial?.long_term_debt);
      const cash = numberOrNull(financial?.cash_and_equivalents);
      const grossDebt = (shortDebt ?? 0) + (longDebt ?? 0);
      const netDebt = grossDebt || cash !== null ? grossDebt - (cash ?? 0) : null;
      const computedMarketCap = price !== null && shares !== null ? price * shares : null;
      const marketCap = computedMarketCap ?? indicatorValueFromRow(existing, "market_cap") ?? args.latestMarketCap;
      const bookValue = equity !== null && shares !== null && shares > 0 ? equity / shares : null;

      if (
        existing ||
        computedDividendPerShare !== null ||
        computedDividendYield !== null ||
        marketCap !== null ||
        bookValue !== null
      ) {
        rows.push({
          reference_date: referenceDate,
          pe: chooseReliableRatio(
            marketCap !== null && netIncome !== null && netIncome > 0 ? marketCap / netIncome : null,
            indicatorValueFromRow(existing, "pe"),
            120,
          ),
          pvp: chooseReliableRatio(
            marketCap !== null && equity !== null && equity > 0 ? marketCap / equity : null,
            indicatorValueFromRow(existing, "pvp"),
            40,
          ),
          dividend_yield: chooseComputedOrPlausibleExisting(
            computedDividendYield,
            normalizeAlreadyPercentValue(indicatorValueFromRow(existing, "dividend_yield"), 25),
            25,
          ),
          roe: choosePlausiblePercent(
            netIncome !== null && equity !== null && equity > 0 ? (netIncome / equity) * 100 : null,
            indicatorValueFromRow(existing, "roe"),
            120,
          ),
          roa: choosePlausiblePercent(
            netIncome !== null && assets !== null && assets > 0 ? (netIncome / assets) * 100 : null,
            indicatorValueFromRow(existing, "roa"),
            80,
          ),
          roic: args.isFinancialBusiness
            ? null
            : choosePlausiblePercent(
                ebit !== null && assets !== null && assets > 0 ? (ebit / assets) * 100 : null,
                indicatorValueFromRow(existing, "roic"),
                100,
              ),
          net_margin: args.isFinancialBusiness
            ? null
            : choosePlausiblePercent(
                netIncome !== null && revenue !== null && revenue !== 0 ? (netIncome / revenue) * 100 : null,
                indicatorValueFromRow(existing, "net_margin"),
                80,
              ),
          ev_ebitda: args.isFinancialBusiness
            ? null
            : chooseReliableRatio(
                marketCap !== null && netDebt !== null && ebitda !== null && ebitda > 0 ? (marketCap + netDebt) / ebitda : null,
                indicatorValueFromRow(existing, "ev_ebitda"),
                80,
              ),
          debt_ebitda: args.isFinancialBusiness
            ? null
            : chooseReliableRatio(
                netDebt !== null && ebitda !== null && ebitda > 0 ? netDebt / ebitda : null,
                indicatorValueFromRow(existing, "debt_ebitda"),
                30,
              ),
          book_value_per_share: sanitizeCurrencyPerShare(bookValue) ?? sanitizeCurrencyPerShare(indicatorValueFromRow(existing, "book_value_per_share")),
          market_cap: marketCap,
          shares_outstanding: shares,
          vp_per_share: sanitizeCurrencyPerShare(bookValue) ?? sanitizeCurrencyPerShare(indicatorValueFromRow(existing, "vp_per_share")),
          dividend_per_share: sanitizeCurrencyPerShare(computedDividendPerShare) ?? sanitizeCurrencyPerShare(indicatorValueFromRow(existing, "dividend_per_share")),
          source: existing?.source ?? "Histórico estimado por proventos e CVM",
        });
      }
    }
  }

  const byDate = new Map<string, IndicatorRow>();
  for (const row of [...normalizedExistingIndicators, ...rows]) {
    if (row.reference_date) byDate.set(row.reference_date, row);
  }

  return [...byDate.values()].sort((a, b) => String(b.reference_date).localeCompare(String(a.reference_date)));
}

function buildAnnualIndicatorTable(
  indicatorRows: IndicatorRow[],
  assetKind: "stock" | "fii",
  options: { isFinancialBusiness?: boolean } = {},
): AnalysisTable {
  const annualRows = indicatorRows.filter((row) =>
    row.reference_date && (assetKind === "fii" || isYearEndReferenceDate(row.reference_date)),
  );
  const columns = annualColumnsFromRows(annualRows);
  const rowsByYear = latestAnnualRowsByYear(annualRows);

  const definitions =
    assetKind === "fii"
      ? ([
          ["Div. Yield", "dividend_yield"],
          ["P/VP", "pvp"],
          ["VP/Cota", "vp_per_share"],
          ["Dividendo/Cota", "dividend_per_share"],
          ["Valor de mercado", "market_cap"],
          ["Nº de cotas", "shares_outstanding"],
        ] as const)
      : ([
          ["P/L", "pe"],
          ["P/VP", "pvp"],
          ["Dividend Yield", "dividend_yield"],
          ["ROE", "roe"],
          ["ROA", "roa"],
          ["ROIC", "roic"],
          ["Margem líquida", "net_margin"],
          ["EV/EBITDA", "ev_ebitda"],
          ["Dív.Líq/EBITDA", "debt_ebitda"],
          ["VPA", "book_value_per_share"],
          ["Valor de mercado", "market_cap"],
          ["Dividendo/ação", "dividend_per_share"],
        ] as const);

  const builtRows = definitions.map(([label, key]) => ({
    label,
    values: columns.map((column) => {
      const row = rowsByYear.get(Number(column));
      const value = row ? numberOrNull(row[key]) : null;
      if (value === null) return "—";
      if (["pe", "pvp", "ev_ebitda"].includes(key)) {
        const cleanRatio = sanitizeRatio(value);
        return cleanRatio === null ? "—" : formatNumber(cleanRatio);
      }
      if (key === "debt_ebitda") {
        const cleanDebtRatio = sanitizeRatio(value, 20);
        return cleanDebtRatio === null ? "—" : formatNumber(cleanDebtRatio);
      }
      if (["dividend_yield", "roe", "roa", "roic", "net_margin"].includes(key)) {
        const maxAbs = key === "dividend_yield"
          ? 25
          : key === "net_margin"
            ? 80
            : key === "roic"
              ? 100
              : key === "roa"
                ? 80
                : 120;
        return safeAlreadyPercent(value, maxAbs) ?? "—";
      }
      if (
        [
          "vp_per_share",
          "book_value_per_share",
          "dividend_per_share",
        ].includes(key)
      ) {
        const cleanCurrency = sanitizeCurrencyPerShare(value);
        return cleanCurrency === null ? "—" : formatCurrency(cleanCurrency);
      }
      if (key === "market_cap") return formatLargeCurrency(value);
      if (key === "shares_outstanding") return formatInteger(value);
      return formatNumber(value);
    }),
  }));
  const usefulRows = builtRows.filter((row) => row.values.some((value) => value !== "—"));

  const table = {
    columns,
    rows: usefulRows.length ? usefulRows : builtRows,
    emptyMessage:
      assetKind === "fii"
        ? "Indicadores anuais ainda não disponíveis para este fundo."
        : "Indicadores anuais ainda não disponíveis para este ativo.",
  };

  return options.isFinancialBusiness
    ? hideRowsByLabel(table, ["ROIC", "Margem líquida", "EV/EBITDA", "Dív.Líq/EBITDA"])
    : table;

}

function periodKeyForFinancialRow(row: FinancialRow, periodType: "annual" | "quarterly"): string {
  if (periodType === "annual") {
    return String(row.reference_year ?? (row.reference_date ? String(row.reference_date).slice(0, 4) : "—"));
  }

  const referenceDate = row.reference_date ?? "";
  const year = row.reference_year ?? (referenceDate ? Number(String(referenceDate).slice(0, 4)) : null);
  const month = referenceDate ? Number(String(referenceDate).slice(5, 7)) : null;
  const quarter = month ? Math.max(1, Math.min(4, Math.ceil(month / 3))) : null;

  return row.reference_period ?? (quarter && year ? `${quarter}T${year}` : referenceDate || "—");
}


function isYearEndReferenceDate(referenceDate: string | null | undefined): boolean {
  if (!referenceDate) return false;
  const month = Number(String(referenceDate).slice(5, 7));
  const day = Number(String(referenceDate).slice(8, 10));
  return month === 12 && day >= 28;
}

function financialSourcePriority(source: string | null | undefined): number {
  const normalized = String(source ?? "").toLowerCase();
  if (normalized.includes("base própria") || normalized.includes("base propria") || normalized.includes("cvm")) return 30;
  if (normalized.includes("yahoo")) return 10;
  return 20;
}

function mergeFinancialRow(primary: FinancialRow, fallback: FinancialRow): FinancialRow {
  const merged: FinancialRow = { ...fallback, ...primary };

  for (const key of FINANCIAL_VALUE_KEYS) {
    const primaryValue = numberOrNull(primary[key]);
    const fallbackValue = numberOrNull(fallback[key]);
    (merged as unknown as Record<string, number | null>)[key] = primaryValue ?? fallbackValue;
  }

  return merged;
}

function dedupeFinancialRowsByPeriod(rows: FinancialRow[], periodType: "annual" | "quarterly"): Array<[string, FinancialRow]> {
  const groups = new Map<string, FinancialRow[]>();

  for (const row of rows.filter((item) => item.period_type === periodType)) {
    if (periodType === "annual" && !isYearEndReferenceDate(row.reference_date)) {
      continue;
    }

    const key = periodKeyForFinancialRow(row, periodType);
    if (key === "—") continue;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const orderedKeys = [...groups.keys()].sort((a, b) => {
    const yearA = Number(String(a).replace(/\D/g, ""));
    const yearB = Number(String(b).replace(/\D/g, ""));
    if (Number.isFinite(yearA) && Number.isFinite(yearB)) return yearB - yearA;
    return String(b).localeCompare(String(a));
  });

  return orderedKeys.map((key) => {
    const group = [...(groups.get(key) ?? [])].sort((a, b) => {
      const dateCompare = String(b.reference_date ?? "").localeCompare(String(a.reference_date ?? ""));
      if (dateCompare !== 0) return dateCompare;
      return financialSourcePriority(b.source) - financialSourcePriority(a.source);
    });

    const [primary, ...fallbacks] = group;
    const merged = fallbacks.reduce((acc, row) => mergeFinancialRow(acc, row), primary);
    return [key, merged] as [string, FinancialRow];
  });
}

function sortFinancialRowsDesc<T extends { reference_date?: string | null; reference_year?: number | null; source?: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const dateCompare = String(b.reference_date ?? b.reference_year ?? "").localeCompare(
      String(a.reference_date ?? a.reference_year ?? ""),
    );
    if (dateCompare !== 0) return dateCompare;
    return financialSourcePriority(b.source) - financialSourcePriority(a.source);
  });
}

function buildFinancialTable(
  financials: FinancialRow[],
  periodType: "annual" | "quarterly",
  rows: Array<[string, keyof FinancialRow, "currency" | "large"]>,
  emptyMessage: string,
): AnalysisTable {
  const periodRows = dedupeFinancialRowsByPeriod(financials, periodType).slice(0, periodType === "annual" ? 5 : 8);
  const columns = periodRows.length
    ? periodRows.map(([key]) => key)
    : periodType === "annual"
      ? getYearColumns().filter((year) => Number(year) < new Date().getFullYear()).slice(0, 5)
      : ["—"];

  const builtRows = rows.map(([label, key]) => ({
    label,
    values: periodRows.length
      ? periodRows.map(([, row]) => {
          const value = numberOrNull(row[key]);
          return value === null ? "—" : formatLargeCurrency(value);
        })
      : columns.map(() => "—"),
  }));
  const usefulRows = builtRows.filter((row) => row.values.some((value) => value !== "—"));

  return {
    columns,
    rows: usefulRows.length ? usefulRows : builtRows,
    emptyMessage,
  };
}

function getIndicatorColumnsAndRows(indicators: IndicatorRow[]): {
  columns: string[];
  rowsByYear: Map<number, IndicatorRow>;
} {
  const rows = indicators.filter((row) => row.reference_date);
  return {
    columns: annualColumnsFromRows(rows),
    rowsByYear: latestAnnualRowsByYear(rows),
  };
}

function buildFiiBalanceTable(
  financials: FinancialRow[],
  indicators: IndicatorRow[],
): AnalysisTable {
  const { columns, rowsByYear } = getIndicatorColumnsAndRows(indicators);
  const financialByYear = latestFinancialByYear(financials);

  const definitions = [
    ["Patrimônio líquido", "equity"],
    ["VP/Cota", "vp_per_share"],
    ["P/VP", "pvp"],
    ["Valor de mercado", "market_cap"],
    ["Nº de cotas", "shares_outstanding"],
  ] as const;

  const rows = definitions.map(([label, key]) => ({
    label,
    values: columns.map((column) => {
      const year = Number(column);
      const indicatorRow = rowsByYear.get(year);
      const financialRow = financialByYear.get(year);
      const value = key === "equity" ? numberOrNull(financialRow?.equity) : numberOrNull(indicatorRow?.[key as keyof IndicatorRow]);
      if (value === null) return "—";
      if (key === "pvp") {
        const clean = sanitizeRatio(value, 20);
        return clean === null ? "—" : formatNumber(clean);
      }
      if (key === "vp_per_share") {
        const cleanCurrency = sanitizeCurrencyPerShare(value);
        return cleanCurrency === null ? "—" : formatCurrency(cleanCurrency);
      }
      if (key === "market_cap" || key === "equity") return formatLargeCurrency(value);
      if (key === "shares_outstanding") return formatInteger(value);
      return formatNumber(value);
    }),
  }));

  const usefulRows = rows.filter((row) => row.values.some((value) => value !== "—"));

  return {
    columns,
    rows: usefulRows.length ? usefulRows : rows,
    emptyMessage: "Dados patrimoniais anuais ainda não disponíveis para este fundo.",
  };
}

function buildFiiIncomeLikeTable(indicators: IndicatorRow[]): AnalysisTable {
  const { columns, rowsByYear } = getIndicatorColumnsAndRows(indicators);
  const rows = [
    {
      label: "Dividendo/Cota",
      values: columns.map((column) => {
        const value = numberOrNull(rowsByYear.get(Number(column))?.dividend_per_share);
        const cleanCurrency = sanitizeCurrencyPerShare(value);
        return cleanCurrency === null ? "—" : formatCurrency(cleanCurrency);
      }),
    },
    {
      label: "Dividend Yield",
      values: columns.map((column) => {
        const value = numberOrNull(rowsByYear.get(Number(column))?.dividend_yield);
        return safeAlreadyPercent(value, 25) ?? "—";
      }),
    },
  ];

  const usefulRows = rows.filter((row) => row.values.some((value) => value !== "—"));

  return {
    columns,
    rows: usefulRows.length ? usefulRows : rows,
    emptyMessage: "Histórico anual de rendimentos ainda não disponível para este fundo.",
  };
}

function buildFinancialAnalysis(
  financials: FinancialRow[],
  indicators: IndicatorRow[],
  assetKind: "stock" | "fii",
  options: { isFinancialBusiness?: boolean } = {},
): FundamentalAnalysisData {
  if (assetKind === "fii") {
    const fiiIndicators = buildAnnualIndicatorTable(indicators, assetKind, options);
    const fiiBalance = buildFiiBalanceTable(financials, indicators);
    const fiiIncome = buildFiiIncomeLikeTable(indicators);

    return {
      indicators: {
        annual: fiiIndicators,
        quarterly: {
          columns: ["Atual"],
          rows: [],
          emptyMessage: "Indicadores trimestrais não se aplicam à maioria dos FIIs nesta base.",
        },
      },
      balanceSheet: {
        annual: fiiBalance,
        quarterly: {
          columns: ["Atual"],
          rows: [],
          emptyMessage: "Dados patrimoniais trimestrais ainda não disponíveis para este fundo.",
        },
      },
      incomeStatement: {
        annual: fiiIncome,
        quarterly: {
          columns: ["Atual"],
          rows: [],
          emptyMessage: "Histórico trimestral de rendimentos ainda não disponível para este fundo.",
        },
      },
      cashFlow: {
        annual: fiiIncome,
        quarterly: {
          columns: ["Atual"],
          rows: [],
          emptyMessage: "Fluxo de caixa padronizado não se aplica à maioria dos FIIs nesta base.",
        },
      },
    };
  }

  const balanceRows: Array<[string, keyof FinancialRow, "large"]> = [
          ["Ativo total", "total_assets", "large"],
          ["Ativo circulante", "current_assets", "large"],
          ["Ativo não circulante", "non_current_assets", "large"],
          ["Caixa e equivalentes", "cash_and_equivalents", "large"],
          ["Passivo total", "total_liabilities", "large"],
          ["Passivo circulante", "current_liabilities", "large"],
          ["Passivo não circulante", "non_current_liabilities", "large"],
          ["Dívida de curto prazo", "short_term_debt", "large"],
          ["Dívida de longo prazo", "long_term_debt", "large"],
          ["Patrimônio líquido", "equity", "large"],
        ];

  const incomeRows: Array<[string, keyof FinancialRow, "large"]> = [
    ["Receita líquida", "revenue", "large"],
    ["Custo dos produtos/serviços", "cost_of_revenue", "large"],
    ["Lucro bruto", "gross_profit", "large"],
    ["Despesas operacionais", "operating_expenses", "large"],
    ["EBIT", "ebit", "large"],
    ["EBITDA", "ebitda", "large"],
    ["Resultado financeiro", "financial_result", "large"],
    ["Lucro antes dos impostos", "income_before_tax", "large"],
    ["Imposto de renda", "income_tax", "large"],
    ["Lucro líquido", "net_income", "large"],
  ];

  const cashRows: Array<[string, keyof FinancialRow, "large"]> = [
    ["Fluxo operacional", "operating_cash_flow", "large"],
    ["Fluxo de investimento", "investing_cash_flow", "large"],
    ["Fluxo de financiamento", "financing_cash_flow", "large"],
    ["Capex", "capex", "large"],
    ["Dividendos pagos", "dividends_paid", "large"],
    ["Fluxo livre", "free_cash_flow", "large"],
    ["Variação líquida de caixa", "net_change_cash", "large"],
  ];

  return {
    indicators: {
      annual: buildAnnualIndicatorTable(indicators, assetKind, options),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage:
          "Indicadores trimestrais ainda não disponíveis para este ativo.",
      },
    },
    balanceSheet: {
      annual: buildFinancialTable(
        financials,
        "annual",
        balanceRows,
        "Balanço patrimonial anual ainda não disponível para este ativo.",
      ),
      quarterly: buildFinancialTable(
        financials,
        "quarterly",
        balanceRows,
        "Balanço patrimonial trimestral ainda não disponível para este ativo.",
      ),
    },
    incomeStatement: {
      annual: buildFinancialTable(
        financials,
        "annual",
        incomeRows,
        "DRE anual ainda não disponível para este ativo.",
      ),
      quarterly: buildFinancialTable(
        financials,
        "quarterly",
        incomeRows,
        "DRE trimestral ainda não disponível para este ativo.",
      ),
    },
    cashFlow: {
      annual: buildFinancialTable(
        financials,
        "annual",
        cashRows,
        "Fluxo de caixa anual ainda não disponível para este ativo.",
      ),
      quarterly: buildFinancialTable(
        financials,
        "quarterly",
        cashRows,
        "Fluxo de caixa trimestral ainda não disponível para este ativo.",
      ),
    },
  };
}

function dividendsLast12Months(
  dividends: DividendRow[],
  referenceDate = new Date(),
  price: number | null = null,
  assetKind: "stock" | "fii" = "stock",
): number | null {
  const start = new Date(referenceDate);
  start.setFullYear(start.getFullYear() - 1);
  const maxSinglePayment =
    price && price > 0 ? price * (assetKind === "fii" ? 0.35 : 0.25) : null;

  const total = dividends.reduce((sum, dividend) => {
    const value = numberOrNull(dividend.value);
    if (!dividend.payment_date || value === null || value <= 0) return sum;

    // Evita que splits, grupamentos ou registros atípicos contaminem o DY da página.
    if (maxSinglePayment !== null && value > maxSinglePayment) return sum;

    const date = new Date(dividend.payment_date);
    return date >= start && date <= referenceDate ? sum + value : sum;
  }, 0);

  return total > 0 ? total : null;
}

type LocalSupabaseSelectOptions = {
  select?: string;
  filters?: Record<string, string>;
  order?: string;
  limit?: number;
  offset?: number;
};

async function safeSupabaseSelect<T>(
  table: string,
  options: LocalSupabaseSelectOptions,
  fallback: T[] = [],
): Promise<T[]> {
  try {
    return await supabaseSelect<T>(table, options);
  } catch {
    return fallback;
  }
}

async function safeSupabaseSelectPaged<T>(
  table: string,
  options: Omit<LocalSupabaseSelectOptions, "limit" | "offset">,
  totalLimit?: number,
  pageSize?: number,
): Promise<T[]> {
  try {
    return await supabaseSelectPaged<T>(table, options, totalLimit, pageSize);
  } catch {
    return [];
  }
}

export async function searchSupabaseAssets(query: string, limit = 8) {
  const status = getSupabaseConnectionStatus();
  const normalized = query
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "");

  if (!status.configured || normalized.length < 2) return [];

  try {
    const rows = await supabaseSelect<AssetRow>("assets", {
      select: "ticker,name,company_name,sector,industry,kind",
      filters: {
        or: `(ticker.ilike.*${normalized}*,name.ilike.*${normalized}*,company_name.ilike.*${normalized}*)`,
      },
      order: "ticker.asc",
      limit,
    });

    return rows.map((row) => ({
      symbol: row.ticker,
      name: row.name ?? row.company_name ?? row.ticker,
      sector:
        row.sector ?? row.industry ?? (row.kind === "fii" ? "FII" : undefined),
      type: row.kind,
      source: "supabase" as const,
    }));
  } catch {
    return [];
  }
}


export type SupabaseStockRawRows = {
  asset: AssetRow;
  quotes: QuoteRow[];
  historyRows: HistoryRow[];
  financials: FinancialRow[];
  dividendRows: DividendRow[];
  indicatorRows: IndicatorRow[];
};

export function buildStockDataFromSupabaseRows(args: SupabaseStockRawRows): StockData {
  const { asset, quotes, historyRows, financials, dividendRows, indicatorRows } = args;

const quote = latest(quotes);
const latestIndicator = latest(indicatorRows);
const orderedHistoryRows = [...historyRows]
  .map((row) => ({
    ...row,
    close: numberOrNull(row.close),
    volume: numberOrNull(row.volume),
  }))
  .filter(
    (row): row is HistoryRow => Boolean(row.date) && row.close !== null,
  )
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
const latestHistoryRow = orderedHistoryRows.at(-1) ?? null;
const previousHistoryRow = orderedHistoryRows.at(-2) ?? null;
const history = orderedHistoryRows.map((row) => ({
  date: row.date,
  close: numberOrNull(row.close) ?? 0,
  volume: numberOrNull(row.volume),
}));

const quotePrice = numberOrNull(quote?.price);
const quotePreviousClose = numberOrNull(quote?.previous_close);
const quoteChangeValue = numberOrNull(quote?.change_value);
const quoteChangePercent = normalizeAlreadyPercentValue(quote?.change_percent, 70);
const quoteOpen = numberOrNull(quote?.open);
const quoteHigh = numberOrNull(quote?.high);
const quoteLow = numberOrNull(quote?.low);
const quoteVolume = numberOrNull(quote?.volume);
const quoteMarketCap = numberOrNull(quote?.market_cap);

const latestHistoryClose = numberOrNull(latestHistoryRow?.close);
const previousHistoryClose = numberOrNull(previousHistoryRow?.close);

const effectivePrice = quotePrice ?? latestHistoryClose ?? null;
const effectivePreviousClose =
  quotePreviousClose ?? previousHistoryClose ?? null;
const effectiveChangeValue =
  quoteChangeValue ??
  (effectivePrice !== null && effectivePreviousClose !== null
    ? effectivePrice - effectivePreviousClose
    : null);
const effectiveChangePercent =
  quoteChangePercent ??
  (effectiveChangeValue !== null &&
  effectivePreviousClose !== null &&
  effectivePreviousClose !== 0
    ? (effectiveChangeValue / effectivePreviousClose) * 100
    : null);
const effectiveVolume =
  quoteVolume ?? numberOrNull(latestHistoryRow?.volume) ?? null;
const referenceDate = quote?.quote_date
  ? new Date(quote.quote_date)
  : latestHistoryRow?.date
    ? new Date(latestHistoryRow.date)
    : new Date();
const isFii = asset.kind === "fii";

const dividends12m = dividendsLast12Months(
  dividendRows,
  referenceDate,
  effectivePrice,
  asset.kind,
);
const calculatedDividendYield =
  effectivePrice && dividends12m
    ? (dividends12m / effectivePrice) * 100
    : null;
const latestSharesForMarketCap =
  firstUsefulIndicatorValue(indicatorRows, latestIndicator, "shares_outstanding");
const latestPvpForMarketCap =
  firstUsefulIndicatorValue(indicatorRows, latestIndicator, "pvp");
const latestEquityForMarketCap =
  sortFinancialRowsDesc(financials)
    .map((row) => numberOrNull(row.equity))
    .find((value): value is number => value !== null && value > 0) ?? null;
const marketCap =
  quoteMarketCap ??
  numberOrNull(latestIndicator?.market_cap) ??
  (effectivePrice !== null && latestSharesForMarketCap !== null
    ? effectivePrice * latestSharesForMarketCap
    : null) ??
  (latestEquityForMarketCap !== null && latestPvpForMarketCap !== null
    ? latestEquityForMarketCap * latestPvpForMarketCap
    : null);
const cleanName =
  sanitizeNullable(asset.name) ??
  sanitizeNullable(asset.company_name) ??
  asset.ticker;
const cleanCompanyName = sanitizeNullable(asset.company_name) ?? cleanName;
const cleanSector =
  sanitizeNullable(asset.sector) ??
  (isFii ? "Fundos Imobiliários" : "Não disponível");
const cleanIndustry = usefulSegment(asset.industry);
const cleanSegment = usefulSegment(asset.segment);
const isFinancialBusiness = !isFii && isFinancialBusinessText(cleanSector, cleanIndustry, cleanSegment, cleanCompanyName);
const sanitizedFinancials = sanitizeFinancialRowsScale(financials, marketCap);
const effectiveIndicatorRows = computedIndicatorRowsFromFinancials({
  financials: sanitizedFinancials,
  existingIndicators: indicatorRows,
  dividendRows: dividendRows,
  historyRows: orderedHistoryRows,
  latestMarketCap: marketCap,
  latestSharesOutstanding: numberOrNull(latestIndicator?.shares_outstanding),
  assetKind: asset.kind,
  isFinancialBusiness,
});
const latestEffectiveIndicator = latest(effectiveIndicatorRows) ?? latestIndicator;
const currentIndicatorValue = (key: keyof IndicatorRow) =>
  firstUsefulIndicatorValue(effectiveIndicatorRows, latestIndicator, key);
const reportedDividendYield = normalizeAlreadyPercentValue(
  currentIndicatorValue("dividend_yield"),
  isFii ? 25 : 25,
);
const dividendYield = chooseDividendYieldValue(
  calculatedDividendYield,
  reportedDividendYield,
  asset.kind,
);
const displaySubsector =
  cleanIndustry && !sameDisplayText(cleanIndustry, cleanSector)
    ? cleanIndustry
    : cleanSegment && !sameDisplayText(cleanSegment, cleanSector)
      ? cleanSegment
      : undefined;
const dividendRows5y = lastFiveYears(dividendRows, referenceDate);

const keyIndicators = isFii
  ? [
      indicator(
        "Div. Yield",
        safeAlreadyPercent(dividendYield, 25),
        "Dividend yield saneado dos últimos 12 meses. DYs atípicos ou não recorrentes são ocultados.",
      ),
      indicator(
        "P/VP",
        currentIndicatorValue("pvp") === null
          ? null
          : formatNumber(currentIndicatorValue("pvp")),
        "Preço da cota dividido pelo valor patrimonial por cota.",
      ),
      indicator(
        "VP/Cota",
        currentIndicatorValue("vp_per_share") === null
          ? null
          : formatCurrency(currentIndicatorValue("vp_per_share")),
        "Valor patrimonial por cota.",
      ),
      indicator(
        "Dividendo/Cota",
        dividends12m === null ? null : formatCurrency(dividends12m),
        "Proventos distribuídos por cota nos últimos 12 meses.",
      ),
      indicator(
        "Valor de mercado",
        marketCap === null ? null : formatLargeCurrency(marketCap),
        "Valor de mercado do fundo.",
      ),
      indicator(
        "Nº de cotas",
        currentIndicatorValue("shares_outstanding") === null
          ? null
          : formatInteger(
              currentIndicatorValue("shares_outstanding"),
            ),
        "Quantidade de cotas.",
      ),
    ]
  : [
      indicator(
        "P/L",
        safeRatioDisplay(currentIndicatorValue("pe"), 120),
        "Relação entre preço e lucro por ação.",
      ),
      indicator(
        "P/VP",
        safeRatioDisplay(currentIndicatorValue("pvp"), 40),
        "Relação entre preço e valor patrimonial.",
      ),
      indicator(
        "DY 12m",
        safeAlreadyPercent(dividendYield, 25),
        "Dividend yield dos últimos 12 meses.",
      ),
      indicator(
        "ROE",
        safePublicPercent(currentIndicatorValue("roe"), 80),
        "Retorno sobre patrimônio líquido.",
      ),
      indicator(
        "ROA",
        safePublicPercent(currentIndicatorValue("roa"), 50),
        "Retorno sobre ativos.",
      ),
      ...(isFinancialBusiness
        ? []
        : [
            indicator(
              "ROIC",
              safePublicPercent(currentIndicatorValue("roic"), 80),
              "Retorno sobre capital investido.",
            ),
            indicator(
              "Mg. Líquida",
              safePublicPercent(currentIndicatorValue("net_margin"), 75),
              "Margem líquida da empresa.",
            ),
            indicator(
              "EV/EBITDA",
              safeRatioDisplay(currentIndicatorValue("ev_ebitda"), 80),
              "Valor da firma dividido pelo EBITDA.",
            ),
            indicator(
              "Dív.Líq/EBITDA",
              safeRatioDisplay(currentIndicatorValue("debt_ebitda"), 30),
              "Dívida líquida dividida pelo EBITDA.",
            ),
          ]),
      indicator(
        "VPA",
        currentIndicatorValue("book_value_per_share") === null
          ? null
          : formatCurrency(
              currentIndicatorValue("book_value_per_share"),
            ),
        "Valor patrimonial por ação.",
      ),
      indicator(
        "Valor de mercado",
        marketCap === null ? null : formatLargeCurrency(marketCap),
        "Valor de mercado da empresa.",
      ),
    ];

const hasIntradayQuote =
  quoteOpen !== null || quoteHigh !== null || quoteLow !== null;
const dayQuoteRows = hasIntradayQuote
  ? [
      quoteRow(
        "Abertura",
        quoteOpen === null ? null : formatCurrency(quoteOpen),
        "Preço de abertura.",
      ),
      quoteRow(
        "Máxima",
        quoteHigh === null ? null : formatCurrency(quoteHigh),
        "Máxima do dia.",
      ),
      quoteRow(
        "Mínima",
        quoteLow === null ? null : formatCurrency(quoteLow),
        "Mínima do dia.",
      ),
      quoteRow(
        "Fech. anterior",
        effectivePreviousClose === null ||
          effectivePreviousClose === undefined
          ? null
          : formatCurrency(effectivePreviousClose),
        "Fechamento anterior.",
      ),
      quoteRow(
        "Volume",
        effectiveVolume === null || effectiveVolume === undefined
          ? null
          : formatInteger(effectiveVolume),
        "Volume negociado.",
      ),
      quoteRow(
        "Valor de mercado",
        marketCap === null ? null : formatLargeCurrency(marketCap),
        "Valor de mercado.",
      ),
    ]
  : [
      quoteRow(
        "Último fechamento",
        effectivePrice === null ? null : formatCurrency(effectivePrice),
        "Último preço de fechamento disponível no histórico.",
      ),
      quoteRow(
        "Fech. anterior",
        effectivePreviousClose === null ||
          effectivePreviousClose === undefined
          ? null
          : formatCurrency(effectivePreviousClose),
        "Fechamento anterior.",
      ),
      quoteRow(
        "Variação",
        safeAlreadyPercent(effectiveChangePercent, 100),
        "Variação calculada com base no histórico disponível.",
      ),
      quoteRow(
        "Volume",
        effectiveVolume === null || effectiveVolume === undefined
          ? null
          : formatInteger(effectiveVolume),
        "Volume negociado.",
      ),
      quoteRow(
        "Valor de mercado",
        marketCap === null ? null : formatLargeCurrency(marketCap),
        "Valor de mercado.",
      ),
    ];

const companyInfo = isFii
  ? [
      { label: "Nome", value: cleanName },
      { label: "Segmento", value: displaySubsector ?? "Fundo imobiliário" },
      { label: "Setor", value: cleanSector },
      { label: "Moeda", value: sanitizeNullable(asset.currency) ?? "BRL" },
    ]
  : [
      { label: "Razão social", value: cleanCompanyName },
      ...(sanitizeNullable(asset.cnpj)
        ? [{ label: "CNPJ", value: sanitizeNullable(asset.cnpj) as string }]
        : []),
      { label: "Setor", value: cleanSector },
      { label: "Indústria", value: displaySubsector ?? "Não disponível" },
      ...(sanitizeNullable(asset.website)
        ? [
            {
              label: "Site",
              value: sanitizeNullable(asset.website) as string,
            },
          ]
        : []),
      { label: "Moeda", value: sanitizeNullable(asset.currency) ?? "BRL" },
    ];

return {
  ticker: asset.ticker,
  assetKind: asset.kind,
  companyName: cleanName,
  fullName: cleanCompanyName === cleanName ? undefined : cleanCompanyName,
  sector: cleanSector,
  subsector: displaySubsector,
  source: "Base Mapa do Ativo",
  updatedAt: formatDateTime(
    quote?.updated_at ?? latestHistoryRow?.date ?? asset.updated_at,
  ),
  quote: {
    price: effectivePrice,
    changeValue: effectiveChangeValue,
    changePercent: effectiveChangePercent,
    open: quoteOpen,
    dayHigh: quoteHigh,
    dayLow: quoteLow,
    previousClose: effectivePreviousClose,
    volume: effectiveVolume,
    marketCap,
  },
  dividendSummary: {
    yield12m:
      safeAlreadyPercent(dividendYield, 25) ??
      "Não disponível",
    cash12m:
      dividends12m === null
        ? "Não disponível"
        : `${formatCurrency(dividends12m)}/${isFii ? "cota" : "ação"}`,
  },
  indicators: keyIndicators,
  dayQuoteRows,
  companyInfo,
  history,
  oscillations: buildOscillations(
    history,
    effectivePrice,
    effectiveChangePercent,
  ),
  fundamentalAnalysis: buildFinancialAnalysis(
    sanitizedFinancials,
    effectiveIndicatorRows,
    asset.kind,
    { isFinancialBusiness },
  ),
  dividends: dividendRows5y.map((row): DividendEvent => ({
    type: sanitizeNullable(row.type) ?? (isFii ? "Rendimento" : "Provento"),
    value:
      numberOrNull(row.value) === null
        ? "Não disponível"
        : formatCurrency(numberOrNull(row.value)),
    comDate: formatDate(row.com_date),
    paymentDate: formatDate(row.payment_date),
    status: "Não informado",
  })),
  related: [],
  warnings:
    quotePrice === null && effectivePrice !== null
      ? [
          "Cotação atual calculada a partir do último fechamento histórico disponível.",
        ]
      : [],
};
}

export async function getStockFromSupabase(
  ticker: string,
): Promise<StockData | null> {
  const status = getSupabaseConnectionStatus();
  if (!status.configured) return null;

  const normalizedTicker = normalizeTicker(ticker);

  try {
    const [asset] = await supabaseSelect<AssetRow>("assets", {
      select: "*",
      filters: { ticker: `eq.${normalizedTicker}` },
      limit: 1,
    });

    if (!asset) return null;

    const [quotes, historyRows, financials, dividendRows, indicatorRows] =
      await Promise.all([
        safeSupabaseSelect<QuoteRow>("asset_quotes", {
          select: "*",
          filters: { ticker: `eq.${normalizedTicker}` },
          order: "quote_date.desc",
          limit: 1,
        }),
        safeSupabaseSelectPaged<HistoryRow>(
          "asset_price_history",
          {
            select: "date,close,volume,source",
            filters: { ticker: `eq.${normalizedTicker}` },
            // Trazemos os registros mais recentes primeiro para evitar o limite padrão
            // de 1.000 linhas da API REST do Supabase. Depois reordenamos em ordem
            // crescente para o gráfico.
            order: "date.desc",
          },
          2600,
          1000,
        ),
        safeSupabaseSelect<FinancialRow>("asset_financials", {
          select: "*",
          filters: { ticker: `eq.${normalizedTicker}` },
          order: "reference_date.desc",
          limit: 120,
        }),
        safeSupabaseSelect<DividendRow>("asset_dividends", {
          select: "*",
          filters: { ticker: `eq.${normalizedTicker}` },
          order: "payment_date.desc",
          limit: 300,
        }),
        safeSupabaseSelect<IndicatorRow>("asset_indicators", {
          select: "*",
          filters: { ticker: `eq.${normalizedTicker}` },
          order: "reference_date.desc",
          limit: 80,
        }),
      ]);

    return buildStockDataFromSupabaseRows({
      asset,
      quotes,
      historyRows,
      financials,
      dividendRows,
      indicatorRows,
    });

  } catch {
    return null;
  }
}
