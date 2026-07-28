import type { BrapiAsset } from "@/lib/stocks/brapi-client";
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
} from "@/lib/utils/formatters";
import { sameDisplayText, sanitizeDisplayText } from "@/lib/utils/text";

function cleanText(value: string | null | undefined): string | null {
  const sanitized = sanitizeDisplayText(value);
  return sanitized || null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value
      .replace(/[R$\s%]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function getPath(source: unknown, path: string): unknown {
  if (!source || typeof source !== "object") return undefined;

  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function firstNumber(source: unknown, paths: readonly string[]): number | null {
  for (const path of paths) {
    const value = asNumber(getPath(source, path));
    if (value !== null) return value;
  }

  return null;
}

function firstString(source: unknown, paths: readonly string[]): string | null {
  for (const path of paths) {
    const value = asString(getPath(source, path));
    if (value !== null) return value;
  }

  return null;
}

function normalizePercentValue(
  value: number | null,
  maxAbs = 100,
): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return Math.abs(normalized) <= maxAbs ? normalized : null;
}

function normalizeAlreadyPercentValue(
  value: number | null,
  maxAbs = 100,
): number | null {
  if (value === null || !Number.isFinite(value) || Math.abs(value) > maxAbs)
    return null;
  return value;
}

function formatPercentValue(value: number | null, maxAbs = 100): string | null {
  const normalizedValue = normalizePercentValue(value, maxAbs);
  return normalizedValue === null ? null : formatPlainPercent(normalizedValue);
}

function formatAlreadyPercentValue(
  value: number | null,
  maxAbs = 100,
): string | null {
  const normalizedValue = normalizeAlreadyPercentValue(value, maxAbs);
  return normalizedValue === null ? null : formatPlainPercent(normalizedValue);
}

function plausibleDividendYield(
  value: number | null,
  isFii: boolean,
): number | null {
  return normalizeAlreadyPercentValue(value, isFii ? 35 : 25);
}

function formatByKind(
  value: number | null,
  kind: "number" | "percent" | "currency" | "largeCurrency" | "integer",
): string | null {
  if (value === null) return null;
  if (kind === "percent") return formatPercentValue(value);
  if (kind === "currency") return formatCurrency(value);
  if (kind === "largeCurrency") return formatLargeCurrency(value);
  if (kind === "integer") return formatInteger(value);
  return formatNumber(value);
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
  if (value === null || !Number.isFinite(value)) return null;
  if (Math.abs(value) < 0.01 || Math.abs(value) > maxAbs) return null;
  return formatNumber(value);
}

function safePublicPercentDisplay(value: number | null, maxAbs = 100): string | null {
  return formatAlreadyPercentValue(value, maxAbs);
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

function dataOf(asset: BrapiAsset | null): Record<string, unknown> | null {
  if (!asset) return null;
  const data = asset.data;

  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }

  return asset;
}

function arrayFromPossible(
  source: unknown,
  keys: readonly string[],
): Record<string, unknown>[] {
  if (!source || typeof source !== "object") return [];

  for (const key of keys) {
    const value = getPath(source, key);

    if (Array.isArray(value)) {
      return value as Record<string, unknown>[];
    }
  }

  if (Array.isArray(source)) {
    return source as Record<string, unknown>[];
  }

  return [];
}

function getYearColumns(): string[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => String(currentYear - index));
}

function yearFromRow(row: Record<string, unknown>): number | null {
  const rawYear =
    asString(row.year) ??
    asString(row.fiscalYear) ??
    asString(row.calendarYear) ??
    asString(row.referenceYear) ??
    asString(row.date)?.slice(0, 4) ??
    asString(row.endDate)?.slice(0, 4);

  if (!rawYear) return null;

  const match = rawYear.match(/\d{4}/);

  if (!match) return null;

  const year = Number(match[0]);
  return Number.isFinite(year) ? year : null;
}

function isQuarterlyRow(row: Record<string, unknown>): boolean {
  const period = String(
    row.period ?? row.fiscalPeriod ?? row.quarter ?? row.type ?? "",
  ).toLowerCase();

  return (
    period.includes("q") ||
    period.includes("tri") ||
    period.includes("quarter") ||
    Boolean(row.quarter)
  );
}

function columnsFromRows(
  rows: Record<string, unknown>[],
  period: "annual" | "quarterly",
  firstColumn: string,
): string[] {
  if (!rows.length) {
    return period === "annual"
      ? getYearColumns()
      : ["Atual", "—", "—", "—", "—", "—"];
  }

  const labels = rows.slice(0, 6).map((row, index) => {
    const year = yearFromRow(row);
    const quarter =
      asString(row.quarter) ??
      asString(row.period) ??
      asString(row.fiscalPeriod);

    if (period === "quarterly") {
      if (quarter && year) return `${quarter}/${year}`;
      if (quarter) return quarter;
      if (year) return String(year);
      return index === 0 ? firstColumn : "—";
    }

    return year ? String(year) : index === 0 ? firstColumn : "—";
  });

  const fallbackYears =
    period === "annual" ? getYearColumns() : ["Atual", "—", "—", "—", "—", "—"];

  while (labels.length < 6) {
    labels.push(fallbackYears[labels.length] ?? "—");
  }

  return labels;
}

function buildTable(args: {
  source: BrapiAsset | null;
  period: "annual" | "quarterly";
  firstColumn: string;
  rowKeys: readonly string[];
  definitions: readonly {
    label: string;
    paths: readonly string[];
    kind: "number" | "percent" | "currency" | "largeCurrency" | "integer";
  }[];
  emptyMessage: string;
}): AnalysisTable {
  const sourceData = dataOf(args.source) ?? args.source;
  const rawRows = arrayFromPossible(sourceData, args.rowKeys);
  const periodRows =
    args.period === "quarterly"
      ? rawRows.filter(isQuarterlyRow)
      : rawRows.filter((row) => !isQuarterlyRow(row));
  const rowsFromApi = periodRows.slice(0, 6);

  const rows = args.definitions.map((definition) => {
    const values = rowsFromApi.length
      ? rowsFromApi.map(
          (row) =>
            formatByKind(firstNumber(row, definition.paths), definition.kind) ??
            "—",
        )
      : Array(6).fill("—");

    while (values.length < 6) values.push("—");

    return {
      label: definition.label,
      values,
    };
  });

  return {
    columns: columnsFromRows(rowsFromApi, args.period, args.firstColumn),
    rows,
    emptyMessage: args.emptyMessage,
  };
}

const indicatorDefinitions = [
  {
    label: "P/L",
    paths: ["priceEarnings", "trailingPE", "peRatio", "priceToEarnings"],
    kind: "number",
  },
  {
    label: "P/VP",
    paths: ["priceToBook", "priceBookValue", "pbRatio"],
    kind: "number",
  },
  { label: "P/Receita", paths: ["priceToSales", "priceSales"], kind: "number" },
  { label: "P/EBIT", paths: ["priceToEbit", "pEbit"], kind: "number" },
  { label: "P/EBITDA", paths: ["priceToEbitda", "pEbitda"], kind: "number" },
  {
    label: "EV/EBITDA",
    paths: ["enterpriseToEbitda", "evToEbitda"],
    kind: "number",
  },
  { label: "EV/EBIT", paths: ["enterpriseToEbit", "evToEbit"], kind: "number" },
  {
    label: "Margem bruta",
    paths: ["grossMargins", "grossMargin"],
    kind: "percent",
  },
  {
    label: "Margem EBITDA",
    paths: ["ebitdaMargins", "ebitdaMargin"],
    kind: "percent",
  },
  {
    label: "Margem EBIT",
    paths: ["operatingMargins", "ebitMargin"],
    kind: "percent",
  },
  {
    label: "Margem líquida",
    paths: ["profitMargins", "netMargin"],
    kind: "percent",
  },
  { label: "ROE", paths: ["returnOnEquity", "roe"], kind: "percent" },
  { label: "ROA", paths: ["returnOnAssets", "roa"], kind: "percent" },
  {
    label: "ROIC",
    paths: ["returnOnInvestedCapital", "roic"],
    kind: "percent",
  },
  {
    label: "Dív.Líq/EBITDA",
    paths: ["netDebtToEbitda", "debtToEbitda"],
    kind: "number",
  },
  {
    label: "Dividend Yield",
    paths: ["dividendYield", "trailingAnnualDividendYield"],
    kind: "percent",
  },
] as const;

const balanceDefinitions = [
  { label: "Ativo total", paths: ["totalAssets"], kind: "largeCurrency" },
  {
    label: "Ativo circulante",
    paths: ["totalCurrentAssets", "currentAssets"],
    kind: "largeCurrency",
  },
  {
    label: "Caixa e equivalentes",
    paths: ["cashAndCashEquivalents", "cash"],
    kind: "largeCurrency",
  },
  {
    label: "Contas a receber",
    paths: ["netReceivables", "accountsReceivable"],
    kind: "largeCurrency",
  },
  { label: "Estoques", paths: ["inventory"], kind: "largeCurrency" },
  {
    label: "Ativo não circulante",
    paths: ["totalNonCurrentAssets", "nonCurrentAssets"],
    kind: "largeCurrency",
  },
  {
    label: "Passivo total",
    paths: ["totalLiabilities"],
    kind: "largeCurrency",
  },
  {
    label: "Passivo circulante",
    paths: ["totalCurrentLiabilities", "currentLiabilities"],
    kind: "largeCurrency",
  },
  {
    label: "Dívida curto prazo",
    paths: ["shortLongTermDebt", "shortTermDebt"],
    kind: "largeCurrency",
  },
  {
    label: "Dívida longo prazo",
    paths: ["longTermDebt"],
    kind: "largeCurrency",
  },
  {
    label: "Patrimônio líquido",
    paths: ["totalStockholderEquity", "stockholdersEquity", "totalEquity"],
    kind: "largeCurrency",
  },
] as const;

const incomeDefinitions = [
  {
    label: "Receita líquida",
    paths: ["totalRevenue", "revenue"],
    kind: "largeCurrency",
  },
  {
    label: "Custo dos produtos/serviços",
    paths: ["costOfRevenue", "costOfGoodsSold"],
    kind: "largeCurrency",
  },
  { label: "Lucro bruto", paths: ["grossProfit"], kind: "largeCurrency" },
  {
    label: "Despesas operacionais",
    paths: ["totalOperatingExpenses", "operatingExpenses"],
    kind: "largeCurrency",
  },
  { label: "EBIT", paths: ["ebit", "operatingIncome"], kind: "largeCurrency" },
  { label: "EBITDA", paths: ["ebitda"], kind: "largeCurrency" },
  {
    label: "Resultado financeiro",
    paths: ["netInterestIncome", "interestExpense"],
    kind: "largeCurrency",
  },
  {
    label: "Lucro antes dos impostos",
    paths: ["incomeBeforeTax"],
    kind: "largeCurrency",
  },
  {
    label: "Imposto de renda",
    paths: ["incomeTaxExpense"],
    kind: "largeCurrency",
  },
  {
    label: "Lucro líquido",
    paths: ["netIncome", "netIncomeApplicableToCommonShares"],
    kind: "largeCurrency",
  },
] as const;

const cashFlowDefinitions = [
  {
    label: "Fluxo operacional",
    paths: ["totalCashFromOperatingActivities", "operatingCashFlow"],
    kind: "largeCurrency",
  },
  { label: "Capex", paths: ["capitalExpenditures"], kind: "largeCurrency" },
  { label: "Fluxo livre", paths: ["freeCashFlow"], kind: "largeCurrency" },
  {
    label: "Dividendos pagos",
    paths: ["dividendsPaid"],
    kind: "largeCurrency",
  },
  {
    label: "Recompra de ações",
    paths: ["repurchaseOfStock"],
    kind: "largeCurrency",
  },
  {
    label: "Variação líquida de caixa",
    paths: ["changeInCash", "netChangeInCash"],
    kind: "largeCurrency",
  },
  {
    label: "Caixa inicial",
    paths: ["beginningCashPosition"],
    kind: "largeCurrency",
  },
  {
    label: "Caixa final",
    paths: ["endCashPosition", "endingCashPosition"],
    kind: "largeCurrency",
  },
] as const;

function currentIndicatorTable(
  statistics: BrapiAsset | null,
  financialData: BrapiAsset | null,
  classicQuote: BrapiAsset | null,
  statisticsHistory: BrapiAsset | null,
  financialDataHistory: BrapiAsset | null,
  yahooSummary: BrapiAsset | null,
): AnalysisTable {
  const currentYear = String(new Date().getFullYear());
  const columns = getYearColumns();
  const currentData = {
    ...(dataOf(classicQuote) ?? {}),
    ...(dataOf(yahooSummary) ?? {}),
    ...(dataOf(statistics) ?? {}),
    ...(dataOf(financialData) ?? {}),
  };

  const historyRows = [
    ...arrayFromPossible(dataOf(statisticsHistory) ?? statisticsHistory, [
      "history",
      "data.history",
      "statements",
      "items",
    ]),
    ...arrayFromPossible(dataOf(financialDataHistory) ?? financialDataHistory, [
      "history",
      "data.history",
      "statements",
      "items",
    ]),
  ];

  const rows = indicatorDefinitions.map((definition) => {
    const values = columns.map((column) => {
      if (column === currentYear) {
        return (
          formatByKind(
            firstNumber(currentData, definition.paths),
            definition.kind,
          ) ?? "—"
        );
      }

      const row = historyRows.find(
        (item) => yearFromRow(item) === Number(column),
      );

      return row
        ? (formatByKind(firstNumber(row, definition.paths), definition.kind) ??
            "—")
        : "—";
    });

    return {
      label: definition.label,
      values,
    };
  });

  return {
    columns,
    rows,
    emptyMessage: "Indicadores anuais não retornados pela API.",
  };
}

function buildAnalysis(input: {
  classicQuote: BrapiAsset | null;
  statistics: BrapiAsset | null;
  statisticsHistory: BrapiAsset | null;
  financialData: BrapiAsset | null;
  financialDataHistory: BrapiAsset | null;
  yahooSummary: BrapiAsset | null;
  balanceAnnual: BrapiAsset | null;
  balanceQuarterly: BrapiAsset | null;
  incomeAnnual: BrapiAsset | null;
  incomeQuarterly: BrapiAsset | null;
  cashAnnual: BrapiAsset | null;
  cashQuarterly: BrapiAsset | null;
}): FundamentalAnalysisData {
  return {
    indicators: {
      annual: currentIndicatorTable(
        input.statistics,
        input.financialData,
        input.classicQuote,
        input.statisticsHistory,
        input.financialDataHistory,
        input.yahooSummary,
      ),
      quarterly: {
        columns: ["Atual", "—", "—", "—", "—", "—"],
        rows: [],
        emptyMessage: "Indicadores trimestrais não retornados pela API.",
      },
    },
    balanceSheet: {
      annual: buildTable({
        source: input.balanceAnnual,
        period: "annual",
        firstColumn: "Atual",
        rowKeys: [
          "statements",
          "balanceSheetHistory",
          "balanceSheetStatements",
          "data.statements",
        ],
        definitions: balanceDefinitions,
        emptyMessage: "Balanço patrimonial anual não retornado pela API.",
      }),
      quarterly: buildTable({
        source: input.balanceQuarterly,
        period: "quarterly",
        firstColumn: "Atual",
        rowKeys: [
          "statements",
          "balanceSheetHistoryQuarterly",
          "balanceSheetStatements",
          "data.statements",
        ],
        definitions: balanceDefinitions,
        emptyMessage: "Balanço patrimonial trimestral não retornado pela API.",
      }),
    },
    incomeStatement: {
      annual: buildTable({
        source: input.incomeAnnual,
        period: "annual",
        firstColumn: "Atual",
        rowKeys: [
          "statements",
          "incomeStatementHistory",
          "incomeStatementStatements",
          "data.statements",
        ],
        definitions: incomeDefinitions,
        emptyMessage: "DRE anual não retornada pela API.",
      }),
      quarterly: buildTable({
        source: input.incomeQuarterly,
        period: "quarterly",
        firstColumn: "Atual",
        rowKeys: [
          "statements",
          "incomeStatementHistoryQuarterly",
          "incomeStatementStatements",
          "data.statements",
        ],
        definitions: incomeDefinitions,
        emptyMessage: "DRE trimestral não retornada pela API.",
      }),
    },
    cashFlow: {
      annual: buildTable({
        source: input.cashAnnual,
        period: "annual",
        firstColumn: "Atual",
        rowKeys: [
          "statements",
          "cashflowStatementHistory",
          "cashFlowStatements",
          "data.statements",
        ],
        definitions: cashFlowDefinitions,
        emptyMessage: "Fluxo de caixa anual não retornado pela API.",
      }),
      quarterly: buildTable({
        source: input.cashQuarterly,
        period: "quarterly",
        firstColumn: "Atual",
        rowKeys: [
          "statements",
          "cashflowStatementHistoryQuarterly",
          "cashFlowStatements",
          "data.statements",
        ],
        definitions: cashFlowDefinitions,
        emptyMessage: "Fluxo de caixa trimestral não retornado pela API.",
      }),
    },
  };
}

function oneColumnTable(
  rows: Array<{ label: string; value: string | null }>,
  emptyMessage: string,
): AnalysisTable {
  const validRows = rows.map((row) => ({
    label: row.label,
    values: [row.value ?? "—"],
  }));

  return {
    columns: ["Atual"],
    rows: validRows,
    emptyMessage,
  };
}

function buildFiiAnalysis(
  data: Record<string, unknown>,
  price: number | null,
  marketCap: number | null,
  sharesOutstanding: number | null,
): FundamentalAnalysisData {
  return {
    indicators: {
      annual: oneColumnTable(
        [
          {
            label: "Div. Yield",
            value: formatByKind(
              firstNumber(data, [
                "dividendYield",
                "trailingAnnualDividendYield",
              ]),
              "percent",
            ),
          },
          {
            label: "P/VP",
            value: formatByKind(firstNumber(data, ["priceToBook"]), "number"),
          },
          {
            label: "VP/Cota",
            value: formatByKind(
              firstNumber(data, ["vpPerShare", "bookValue"]),
              "currency",
            ),
          },
          {
            label: "Dividendo/Cota",
            value: formatByKind(
              firstNumber(data, ["dividendPerShare", "dividendRate"]),
              "currency",
            ),
          },
          {
            label: "FFO Yield",
            value: formatByKind(firstNumber(data, ["ffoYield"]), "percent"),
          },
          {
            label: "FFO/Cota",
            value: formatByKind(firstNumber(data, ["ffoPerShare"]), "currency"),
          },
          {
            label: "Valor de mercado",
            value: formatByKind(marketCap, "largeCurrency"),
          },
          {
            label: "Nº de cotas",
            value: formatByKind(sharesOutstanding, "integer"),
          },
          { label: "Cotação", value: formatByKind(price, "currency") },
        ],
        "Indicadores de FII não retornados pelas fontes públicas.",
      ),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage:
          "Indicadores trimestrais de FII não disponíveis nas fontes atuais.",
      },
    },
    balanceSheet: {
      annual: oneColumnTable(
        [
          {
            label: "Patrimônio líquido",
            value: formatByKind(
              firstNumber(data, ["patrimony", "equity.total"]),
              "largeCurrency",
            ),
          },
          {
            label: "Ativos",
            value: formatByKind(
              firstNumber(data, ["assets", "assetsData.total"]),
              "largeCurrency",
            ),
          },
          {
            label: "Valor patrimonial por cota",
            value: formatByKind(
              firstNumber(data, ["vpPerShare", "bookValue"]),
              "currency",
            ),
          },
          {
            label: "Nº de cotas",
            value: formatByKind(sharesOutstanding, "integer"),
          },
        ],
        "Balanço do FII não disponível nas fontes atuais.",
      ),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage:
          "Balanço trimestral de FII não disponível nas fontes atuais.",
      },
    },
    incomeStatement: {
      annual: oneColumnTable(
        [
          {
            label: "Receita 12m",
            value: formatByKind(
              firstNumber(data, ["revenue12m", "fiiResult.revenue12m"]),
              "largeCurrency",
            ),
          },
          {
            label: "Rendimento distribuído 12m",
            value: formatByKind(
              firstNumber(data, [
                "distributedIncome12m",
                "fiiResult.distributedIncome12m",
              ]),
              "largeCurrency",
            ),
          },
        ],
        "Resultado do FII não disponível nas fontes atuais.",
      ),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage:
          "Resultado trimestral de FII não disponível nas fontes atuais.",
      },
    },
    cashFlow: {
      annual: oneColumnTable(
        [
          {
            label: "Cap rate",
            value: formatByKind(
              firstNumber(data, ["capRate", "fiiRealEstate.capRate"]),
              "percent",
            ),
          },
          {
            label: "Vacância média",
            value: formatByKind(
              firstNumber(data, ["vacancy", "fiiRealEstate.vacancy"]),
              "percent",
            ),
          },
          {
            label: "Quantidade de imóveis",
            value: formatByKind(
              firstNumber(data, [
                "propertiesCount",
                "fiiRealEstate.propertiesCount",
              ]),
              "integer",
            ),
          },
          {
            label: "Área (m²)",
            value: formatByKind(
              firstNumber(data, ["areaM2", "fiiRealEstate.areaM2"]),
              "integer",
            ),
          },
        ],
        "Dados imobiliários do FII não disponíveis nas fontes atuais.",
      ),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage:
          "Dados trimestrais de FII não disponíveis nas fontes atuais.",
      },
    },
  };
}


function hasAnalysisTableData(table: AnalysisTable): boolean {
  return table.rows.some((row) =>
    row.values.some((value) => {
      const normalized = String(value ?? "").trim();
      return normalized !== "" && normalized !== "—" && normalized !== "Não disponível";
    }),
  );
}

function chooseAnalysisTable(primary: AnalysisTable, fallback: AnalysisTable): AnalysisTable {
  const primaryScore = primary.rows.reduce(
    (score, row) => score + row.values.filter((value) => value !== "—" && value !== "Não disponível").length,
    0,
  );
  const fallbackScore = fallback.rows.reduce(
    (score, row) => score + row.values.filter((value) => value !== "—" && value !== "Não disponível").length,
    0,
  );

  return fallbackScore > primaryScore ? fallback : primary;
}

function mergeSnapshotAnalysis(
  primary: FundamentalAnalysisData,
  fallback: FundamentalAnalysisData,
): FundamentalAnalysisData {
  return {
    indicators: {
      annual: chooseAnalysisTable(primary.indicators.annual, fallback.indicators.annual),
      quarterly: chooseAnalysisTable(primary.indicators.quarterly, fallback.indicators.quarterly),
    },
    balanceSheet: {
      annual: chooseAnalysisTable(primary.balanceSheet.annual, fallback.balanceSheet.annual),
      quarterly: chooseAnalysisTable(primary.balanceSheet.quarterly, fallback.balanceSheet.quarterly),
    },
    incomeStatement: {
      annual: chooseAnalysisTable(primary.incomeStatement.annual, fallback.incomeStatement.annual),
      quarterly: chooseAnalysisTable(primary.incomeStatement.quarterly, fallback.incomeStatement.quarterly),
    },
    cashFlow: {
      annual: chooseAnalysisTable(primary.cashFlow.annual, fallback.cashFlow.annual),
      quarterly: chooseAnalysisTable(primary.cashFlow.quarterly, fallback.cashFlow.quarterly),
    },
  };
}

function buildStockSnapshotAnalysis(
  data: Record<string, unknown>,
  price: number | null,
  marketCap: number | null,
  sharesOutstanding: number | null,
): FundamentalAnalysisData {
  const totalDebt = firstNumber(data, ["totalDebt", "grossDebt"]);
  const totalCash = firstNumber(data, ["totalCash", "cash"]);
  const netDebt =
    firstNumber(data, ["netDebt"]) ??
    (totalDebt !== null ? totalDebt - (totalCash ?? 0) : null);

  return {
    indicators: {
      annual: oneColumnTable(
        [
          { label: "P/L", value: formatByKind(firstNumber(data, ["priceEarnings", "trailingPE", "peRatio"]), "number") },
          { label: "P/VP", value: formatByKind(firstNumber(data, ["priceToBook", "pbRatio"]), "number") },
          { label: "P/Receita", value: formatByKind(firstNumber(data, ["priceToSales", "priceSales"]), "number") },
          { label: "P/EBIT", value: formatByKind(firstNumber(data, ["priceToEbit", "pEbit"]), "number") },
          { label: "EV/EBITDA", value: formatByKind(firstNumber(data, ["enterpriseToEbitda", "evToEbitda"]), "number") },
          { label: "EV/EBIT", value: formatByKind(firstNumber(data, ["enterpriseToEbit", "evToEbit"]), "number") },
          { label: "Dividend Yield", value: formatByKind(firstNumber(data, ["dividendYield", "trailingAnnualDividendYield"]), "percent") },
          { label: "ROE", value: formatByKind(firstNumber(data, ["returnOnEquity", "roe"]), "percent") },
          { label: "ROIC", value: formatByKind(firstNumber(data, ["returnOnInvestedCapital", "roic"]), "percent") },
          { label: "Margem EBIT", value: formatByKind(firstNumber(data, ["operatingMargins", "ebitMargin"]), "percent") },
          { label: "Margem líquida", value: formatByKind(firstNumber(data, ["profitMargins", "netMargin"]), "percent") },
          { label: "VPA", value: formatByKind(firstNumber(data, ["bookValue", "bookValuePerShare"]), "currency") },
          { label: "LPA", value: formatByKind(firstNumber(data, ["earningsPerShare", "lpa"]), "currency") },
          { label: "Valor de mercado", value: formatByKind(marketCap, "largeCurrency") },
          { label: "Nº de ações", value: formatByKind(sharesOutstanding, "integer") },
          { label: "Cotação", value: formatByKind(price, "currency") },
        ],
        "Indicadores em consolidação para este ativo.",
      ),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage: "Indicadores trimestrais ainda não disponíveis para este ativo.",
      },
    },
    balanceSheet: {
      annual: oneColumnTable(
        [
          { label: "Ativo total", value: formatByKind(firstNumber(data, ["totalAssets", "assets"]), "largeCurrency") },
          { label: "Patrimônio líquido", value: formatByKind(firstNumber(data, ["totalEquity", "patrimony", "equity.total"]), "largeCurrency") },
          { label: "Dívida bruta", value: formatByKind(totalDebt, "largeCurrency") },
          { label: "Dívida líquida", value: formatByKind(netDebt, "largeCurrency") },
          { label: "Caixa e equivalentes", value: formatByKind(totalCash, "largeCurrency") },
          { label: "Liquidez corrente", value: formatByKind(firstNumber(data, ["currentRatio"]), "number") },
        ],
        "Balanço patrimonial em consolidação para este ativo.",
      ),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage: "Balanço trimestral ainda não disponível para este ativo.",
      },
    },
    incomeStatement: {
      annual: oneColumnTable(
        [
          { label: "Receita 12m", value: formatByKind(firstNumber(data, ["revenue12m", "revenue", "totalRevenue"]), "largeCurrency") },
          { label: "EBIT 12m", value: formatByKind(firstNumber(data, ["ebit", "operatingIncome"]), "largeCurrency") },
          { label: "Lucro líquido 12m", value: formatByKind(firstNumber(data, ["netIncome"]), "largeCurrency") },
          { label: "Margem EBIT", value: formatByKind(firstNumber(data, ["operatingMargins", "ebitMargin"]), "percent") },
          { label: "Margem líquida", value: formatByKind(firstNumber(data, ["profitMargins", "netMargin"]), "percent") },
          { label: "Crescimento receita 5a", value: formatByKind(firstNumber(data, ["revenueGrowth5y"]), "percent") },
        ],
        "DRE em consolidação para este ativo.",
      ),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage: "DRE trimestral ainda não disponível para este ativo.",
      },
    },
    cashFlow: {
      annual: oneColumnTable(
        [
          { label: "Valor da firma", value: formatByKind(firstNumber(data, ["enterpriseValue"]), "largeCurrency") },
          { label: "Dív. líquida/EBITDA", value: formatByKind(firstNumber(data, ["netDebtToEbitda", "debtToEbitda"]), "number") },
          { label: "Volume médio 2m", value: formatByKind(firstNumber(data, ["averageVolume", "regularMarketVolume"]), "integer") },
        ],
        "Fluxo de caixa em consolidação para este ativo.",
      ),
      quarterly: {
        columns: ["Atual"],
        rows: [],
        emptyMessage: "Fluxo de caixa trimestral ainda não disponível para este ativo.",
      },
    },
  };
}

function extractDividends(
  dividends: BrapiAsset | null,
  classicQuote: BrapiAsset | null,
): DividendEvent[] {
  const data = dataOf(dividends) ?? dividends;
  const classic = dataOf(classicQuote) ?? classicQuote;
  const events = [
    ...arrayFromPossible(data, [
      "dividends",
      "events",
      "cashDividends",
      "data.dividends",
      "data.events",
    ]),
    ...arrayFromPossible(classic, [
      "dividendsData.cashDividends",
      "cashDividends",
      "dividends",
    ]),
  ];

  return events.slice(0, 12).map((event) => {
    const type =
      asString(event.type) ??
      asString(event.label) ??
      asString(event.paymentType) ??
      "Provento";
    const value =
      asNumber(event.value) ??
      asNumber(event.rate) ??
      asNumber(event.amount) ??
      asNumber(event.cash);
    const comDate =
      asString(event.comDate) ??
      asString(event.lastDatePrior) ??
      asString(event.dateWith) ??
      asString(event.recordDate);
    const paymentDate =
      asString(event.paymentDate) ??
      asString(event.datePayment) ??
      asString(event.payDate);

    return {
      type: translateDividendType(type),
      value: value === null ? "Não disponível" : formatCurrency(value),
      comDate: formatDate(comDate),
      paymentDate: formatDate(paymentDate),
      status: "Não informado",
    };
  });
}

function dividendCashLast12Months(
  dividends: BrapiAsset | null,
  classicQuote: BrapiAsset | null,
  referenceDate?: string | null,
): number | null {
  const events = [
    ...arrayFromPossible(dataOf(dividends) ?? dividends, [
      "dividends",
      "events",
      "cashDividends",
      "data.dividends",
      "data.events",
    ]),
    ...arrayFromPossible(dataOf(classicQuote) ?? classicQuote, [
      "dividendsData.cashDividends",
      "cashDividends",
      "dividends",
    ]),
  ];

  if (!events.length) return null;

  const reference = referenceDate ? new Date(referenceDate) : new Date();
  const start = new Date(reference);
  start.setFullYear(start.getFullYear() - 1);

  let total = 0;

  for (const event of events) {
    const date =
      normalizeHistoryDate(event.paymentDate) ??
      normalizeHistoryDate(event.datePayment) ??
      normalizeHistoryDate(event.payDate) ??
      normalizeHistoryDate(event.comDate) ??
      normalizeHistoryDate(event.lastDatePrior);

    const value =
      asNumber(event.value) ??
      asNumber(event.rate) ??
      asNumber(event.amount) ??
      asNumber(event.cash);

    if (!date || value === null) continue;

    const parsedDate = new Date(date);

    if (parsedDate >= start && parsedDate <= reference) {
      total += value;
    }
  }

  return total > 0 ? total : null;
}

function translateDividendType(type: string): string {
  const normalized = type.toLowerCase();
  if (
    normalized.includes("jcp") ||
    normalized.includes("interest") ||
    normalized.includes("juros")
  )
    return "JCP";
  if (normalized.includes("dividend")) return "Dividendo";
  if (normalized.includes("rend")) return "Rendimento";
  return type;
}

function normalizeHistoryDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value > 10_000_000_000 ? value : value * 1000;
    return new Date(timestamp).toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      const timestamp = numeric > 10_000_000_000 ? numeric : numeric * 1000;
      return new Date(timestamp).toISOString();
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    const brazilianDate = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brazilianDate) {
      return new Date(
        `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}T03:00:00.000Z`,
      ).toISOString();
    }

    return null;
  }

  return null;
}

function extractHistory(
  historical: BrapiAsset | null,
  classicQuote: BrapiAsset | null,
  yahooHistory: BrapiAsset | null,
): StockHistoryPoint[] {
  const historicalData = dataOf(historical) ?? historical;
  const classic = dataOf(classicQuote) ?? classicQuote;
  const yahoo = dataOf(yahooHistory) ?? yahooHistory;

  const points = [
    ...arrayFromPossible(historicalData, [
      "historicalDataPrice",
      "historical",
      "prices",
      "data.historicalDataPrice",
    ]),
    ...arrayFromPossible(classic, [
      "historicalDataPrice",
      "historical",
      "prices",
    ]),
    ...arrayFromPossible(yahoo, [
      "historicalDataPrice",
      "historical",
      "prices",
    ]),
  ];

  const mapped: StockHistoryPoint[] = points
    .map((point): StockHistoryPoint | null => {
      const close =
        asNumber(point.close) ??
        asNumber(point.adjClose) ??
        asNumber(point.price) ??
        asNumber(point.value);

      const date =
        normalizeHistoryDate(point.date) ??
        normalizeHistoryDate(point.formattedDate) ??
        normalizeHistoryDate(point.datetime) ??
        normalizeHistoryDate(point.time);
      const volume =
        asNumber(point.volume) ??
        asNumber(point.regularMarketVolume) ??
        asNumber(point.volumeTraded) ??
        asNumber(point.tradedVolume);

      if (!date || close === null) {
        return null;
      }

      return {
        date,
        close,
        volume: volume ?? null,
      };
    })
    .filter((point): point is StockHistoryPoint => point !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const unique = new Map<string, StockHistoryPoint>();
  for (const point of mapped) {
    unique.set(point.date.slice(0, 10), point);
  }

  return Array.from(unique.values());
}

function variationBetween(
  current: number | null,
  past: number | null,
): number | null {
  if (current === null || past === null || past === 0) return null;
  return (current / past - 1) * 100;
}

function pointBeforeOrAt(
  history: StockHistoryPoint[],
  target: Date,
): StockHistoryPoint | null {
  const eligible = history.filter((point) => new Date(point.date) <= target);
  return eligible[eligible.length - 1] ?? null;
}

function firstPointOfYear(
  history: StockHistoryPoint[],
  year: number,
): StockHistoryPoint | null {
  return (
    history.find((point) => new Date(point.date).getFullYear() === year) ?? null
  );
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

function buildOscillations(
  history: StockHistoryPoint[],
  currentPrice: number | null,
  dayChangePercent: number | null,
): StockOscillation[] {
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const last = sorted[sorted.length - 1] ?? null;
  const current = currentPrice ?? last?.close ?? null;
  const lastDate = last ? new Date(last.date) : new Date();

  const pastByDays = (days: number) => {
    const target = new Date(lastDate);
    target.setDate(target.getDate() - days);
    return pointBeforeOrAt(sorted, target)?.close ?? null;
  };

  const currentYear = new Date().getFullYear();

  const values: StockOscillation[] = [
    buildOscillation("Dia", normalizePercentValue(dayChangePercent)),
    buildOscillation("5 dias", variationBetween(current, pastByDays(5))),
    buildOscillation(
      "Mês",
      variationBetween(
        current,
        firstPointOfYear(sorted, currentYear)?.close ?? pastByDays(31),
      ),
    ),
    buildOscillation("30 dias", variationBetween(current, pastByDays(30))),
    buildOscillation("12 meses", variationBetween(current, pastByDays(365))),
  ];

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    const first = firstPointOfYear(sorted, year);
    const lastOfYear = sorted
      .filter((point) => new Date(point.date).getFullYear() === year)
      .at(-1);
    const end = year === currentYear ? current : (lastOfYear?.close ?? null);

    values.push(
      buildOscillation(
        String(year),
        variationBetween(end, first?.close ?? null),
      ),
    );
  }

  return values;
}

function emptyAnalysis(): FundamentalAnalysisData {
  const empty = (message: string): AnalysisTable => ({
    columns: ["Atual", "—", "—", "—", "—", "—"],
    rows: [],
    emptyMessage: message,
  });

  return {
    indicators: {
      annual: empty("Indicadores não retornados pela API."),
      quarterly: empty("Indicadores trimestrais não retornados pela API."),
    },
    balanceSheet: {
      annual: empty("Balanço anual não retornado pela API."),
      quarterly: empty("Balanço trimestral não retornado pela API."),
    },
    incomeStatement: {
      annual: empty("DRE anual não retornada pela API."),
      quarterly: empty("DRE trimestral não retornada pela API."),
    },
    cashFlow: {
      annual: empty("Fluxo de caixa anual não retornado pela API."),
      quarterly: empty("Fluxo de caixa trimestral não retornado pela API."),
    },
  };
}

export function createUnavailableStock(
  ticker: string,
  reason: string,
): StockData {
  const normalized = ticker.trim().toUpperCase();

  return {
    ticker: normalized,
    assetKind: "stock",
    companyName: normalized,
    sector: "Não disponível",
    source: "Base Mapa do Ativo",
    updatedAt: formatDateTime(new Date().toISOString()),
    quote: {
      price: null,
      changeValue: null,
      changePercent: null,
      open: null,
      dayHigh: null,
      dayLow: null,
      previousClose: null,
      volume: null,
      marketCap: null,
    },
    dividendSummary: {
      yield12m: "Não disponível",
      cash12m: "Não disponível",
    },
    indicators: [
      indicator("P/L", null, "Relação entre preço e lucro por ação."),
      indicator("P/VP", null, "Relação entre preço e valor patrimonial."),
      indicator("DY 12m", null, "Dividend yield dos últimos 12 meses."),
      indicator("ROE", null, "Retorno sobre patrimônio líquido."),
      indicator("ROIC", null, "Retorno sobre capital investido."),
    ],
    dayQuoteRows: [
      quoteRow("Abertura", null, "Preço de abertura."),
      quoteRow("Máxima", null, "Máxima do dia."),
      quoteRow("Mínima", null, "Mínima do dia."),
      quoteRow("Fech. anterior", null, "Fechamento anterior."),
      quoteRow("Volume", null, "Volume negociado."),
      quoteRow("Valor de mercado", null, "Valor de mercado."),
    ],
    companyInfo: [{ label: "Ticker", value: normalized }],
    history: [],
    oscillations: buildOscillations([], null, null),
    fundamentalAnalysis: emptyAnalysis(),
    dividends: [],
    related: [],
    warnings: [reason],
  };
}

function isFiiAsset(
  ticker: string,
  fundamentusData: Record<string, unknown>,
  profileData: Record<string, unknown>,
  quoteData: Record<string, unknown>,
): boolean {
  const kind =
    firstString(fundamentusData, ["kind"]) ??
    firstString(profileData, ["kind"]) ??
    firstString(quoteData, ["kind"]);

  if (kind === "fii") return true;

  const sector =
    firstString(fundamentusData, ["sector"]) ??
    firstString(profileData, ["sector", "setor"]) ??
    "";

  if (sector.toLowerCase().includes("fundo")) return true;

  const hasFiiMetrics =
    firstNumber(fundamentusData, [
      "ffoYield",
      "ffoPerShare",
      "vpPerShare",
      "propertiesCount",
    ]) !== null;

  return hasFiiMetrics && ticker.toUpperCase().endsWith("11");
}

export function mapBrapiToStockData(input: {
  ticker: string;
  classicQuote: BrapiAsset | null;
  quote: BrapiAsset | null;
  profile: BrapiAsset | null;
  statistics: BrapiAsset | null;
  statisticsHistory: BrapiAsset | null;
  financialData: BrapiAsset | null;
  financialDataHistory: BrapiAsset | null;
  balanceAnnual: BrapiAsset | null;
  balanceQuarterly: BrapiAsset | null;
  incomeAnnual: BrapiAsset | null;
  incomeQuarterly: BrapiAsset | null;
  cashAnnual: BrapiAsset | null;
  cashQuarterly: BrapiAsset | null;
  dividends: BrapiAsset | null;
  historical: BrapiAsset | null;
  yahooHistory: BrapiAsset | null;
  yahooQuote: BrapiAsset | null;
  yahooSummary: BrapiAsset | null;
  fundamentus: BrapiAsset | null;
}): StockData {
  const classicData = dataOf(input.classicQuote) ?? {};
  const yahooQuoteData = dataOf(input.yahooQuote) ?? {};
  const yahooSummaryData = dataOf(input.yahooSummary) ?? {};
  const fundamentusData = dataOf(input.fundamentus) ?? {};
  const quoteData = {
    ...fundamentusData,
    ...classicData,
    ...yahooQuoteData,
    ...(dataOf(input.quote) ?? {}),
  };
  const profileData = {
    ...fundamentusData,
    ...yahooQuoteData,
    ...yahooSummaryData,
    ...(dataOf(input.profile) ?? {}),
  };
  const statisticsData = {
    ...fundamentusData,
    ...classicData,
    ...yahooQuoteData,
    ...yahooSummaryData,
    ...(dataOf(input.statistics) ?? {}),
  };
  const financialData = {
    ...fundamentusData,
    ...yahooQuoteData,
    ...yahooSummaryData,
    ...(dataOf(input.financialData) ?? {}),
  };

  const symbol =
    asString(input.quote?.symbol) ??
    asString(input.classicQuote?.symbol) ??
    asString(input.fundamentus?.symbol) ??
    asString(input.quote?.requestedSymbol) ??
    input.ticker.trim().toUpperCase();

  const companyName =
    cleanText(
      firstString(quoteData, ["shortName", "longName", "companyName"]),
    ) ??
    cleanText(
      firstString(profileData, [
        "shortName",
        "longName",
        "name",
        "companyName",
      ]),
    ) ??
    symbol;

  const fullName =
    cleanText(firstString(quoteData, ["longName", "companyName"])) ??
    cleanText(firstString(profileData, ["longName", "companyName"]));

  const price = firstNumber(quoteData, ["regularMarketPrice", "price"]);
  const change = firstNumber(quoteData, ["regularMarketChange", "change"]);
  const changePercent = firstNumber(quoteData, [
    "regularMarketChangePercent",
    "changePercent",
  ]);
  const sharesOutstanding =
    firstNumber(quoteData, [
      "sharesOutstanding",
      "shares",
      "nroCotas",
      "nroAcoes",
    ]) ?? firstNumber(statisticsData, ["sharesOutstanding"]);
  const marketCap =
    firstNumber(quoteData, ["marketCap"]) ??
    firstNumber(statisticsData, ["marketCap"]) ??
    (price !== null && sharesOutstanding !== null
      ? price * sharesOutstanding
      : null);
  const volume = firstNumber(quoteData, ["regularMarketVolume", "volume"]);
  const high = firstNumber(quoteData, ["regularMarketDayHigh", "dayHigh"]);
  const low = firstNumber(quoteData, ["regularMarketDayLow", "dayLow"]);
  const open = firstNumber(quoteData, ["regularMarketOpen", "open"]);
  const previousClose = firstNumber(quoteData, [
    "regularMarketPreviousClose",
    "previousClose",
  ]);
  const updatedAt =
    normalizeHistoryDate(
      firstString(quoteData, ["regularMarketTime", "updatedAt", "quoteDate"]),
    ) ??
    firstString(quoteData, ["regularMarketTime", "updatedAt", "quoteDate"]);

  const isFii = isFiiAsset(
    input.ticker,
    fundamentusData,
    profileData,
    quoteData,
  );
  const sectorText = cleanText(firstString(profileData, ["sector", "setor"]));
  const industryText = cleanText(firstString(profileData, ["segment", "industry", "industria"]));
  const isFinancialBusiness = !isFii && isFinancialBusinessText(sectorText, industryText, companyName, fullName);
  const dividendRateFromEvents = dividendCashLast12Months(
    input.dividends,
    input.classicQuote,
    updatedAt,
  );
  const dividendYieldFromEvents =
    price && dividendRateFromEvents
      ? (dividendRateFromEvents / price) * 100
      : null;
  const plausibleDividendYieldFromEvents = plausibleDividendYield(
    dividendYieldFromEvents,
    isFii,
  );
  const sourceDividendYield = normalizePercentValue(
    firstNumber(statisticsData, [
      "dividendYield",
      "trailingAnnualDividendYield",
    ]) ??
      firstNumber(quoteData, ["dividendYield", "trailingAnnualDividendYield"]),
    isFii ? 35 : 25,
  );
  const dividendYield = plausibleDividendYieldFromEvents ?? sourceDividendYield;
  const dividendRateFromSource =
    firstNumber(statisticsData, [
      "dividendRate",
      "trailingAnnualDividendRate",
      "dividendPerShare",
    ]) ??
    firstNumber(quoteData, [
      "dividendRate",
      "trailingAnnualDividendRate",
      "dividendPerShare",
    ]);
  const dividendRate =
    plausibleDividendYieldFromEvents !== null
      ? dividendRateFromEvents
      : dividendRateFromSource;

  const keyIndicators = isFii
    ? [
        indicator(
          "Div. Yield",
          formatAlreadyPercentValue(dividendYield, 35),
          "Dividend yield dos últimos 12 meses.",
        ),
        indicator(
          "P/VP",
          formatByKind(
            firstNumber(statisticsData, ["priceToBook", "pbRatio"]),
            "number",
          ),
          "Preço da cota dividido pelo valor patrimonial por cota.",
        ),
        indicator(
          "VP/Cota",
          formatByKind(
            firstNumber(statisticsData, [
              "vpPerShare",
              "bookValue",
              "bookValuePerShare",
            ]),
            "currency",
          ),
          "Valor patrimonial por cota.",
        ),
        indicator(
          "Dividendo/Cota",
          dividendRate === null ? null : formatCurrency(dividendRate),
          "Proventos distribuídos por cota nos últimos 12 meses.",
        ),
        indicator(
          "Valor de mercado",
          formatLargeCurrency(marketCap) === "Não disponível"
            ? null
            : formatLargeCurrency(marketCap),
          "Valor de mercado do fundo.",
        ),
        indicator(
          "Nº de cotas",
          sharesOutstanding === null ? null : formatInteger(sharesOutstanding),
          "Quantidade de cotas.",
        ),
      ]
    : [
        indicator(
          "P/L",
          safeRatioDisplay(
            firstNumber(statisticsData, [
              "priceEarnings",
              "trailingPE",
              "peRatio",
            ]),
            120,
          ),
          "Relação entre preço e lucro por ação.",
        ),
        indicator(
          "P/VP",
          safeRatioDisplay(
            firstNumber(statisticsData, ["priceToBook", "pbRatio"]),
            40,
          ),
          "Relação entre preço e valor patrimonial.",
        ),
        indicator(
          "DY 12m",
          formatAlreadyPercentValue(dividendYield, 25),
          "Dividend yield dos últimos 12 meses.",
        ),
        indicator(
          "ROE",
          safePublicPercentDisplay(
            normalizePercentValue(firstNumber(financialData, ["returnOnEquity", "roe"])),
            120,
          ),
          "Retorno sobre patrimônio líquido.",
        ),
        indicator(
          "ROA",
          safePublicPercentDisplay(
            normalizePercentValue(firstNumber(financialData, ["returnOnAssets", "roa"])),
            80,
          ),
          "Retorno sobre ativos.",
        ),
        ...(isFinancialBusiness
          ? []
          : [
              indicator(
                "ROIC",
                safePublicPercentDisplay(
                  normalizePercentValue(firstNumber(financialData, ["returnOnInvestedCapital", "roic"])),
                  100,
                ),
                "Retorno sobre capital investido.",
              ),
              indicator(
                "Mg. Líquida",
                safePublicPercentDisplay(
                  normalizePercentValue(firstNumber(financialData, ["profitMargins", "netMargin"])),
                  80,
                ),
                "Margem líquida da empresa.",
              ),
              indicator(
                "EV/EBITDA",
                safeRatioDisplay(
                  firstNumber(statisticsData, ["enterpriseToEbitda", "evToEbitda"]),
                  80,
                ),
                "Valor da firma dividido pelo EBITDA.",
              ),
              indicator(
                "Dív.Líq/EBITDA",
                safeRatioDisplay(
                  firstNumber(financialData, ["netDebtToEbitda", "debtToEbitda"]),
                  30,
                ),
                "Dívida líquida dividida pelo EBITDA.",
              ),
            ]),
        indicator(
          "VPA",
          formatByKind(
            firstNumber(statisticsData, ["bookValue", "bookValuePerShare"]),
            "currency",
          ),
          "Valor patrimonial por ação.",
        ),
        indicator(
          "Valor de mercado",
          formatLargeCurrency(marketCap) === "Não disponível"
            ? null
            : formatLargeCurrency(marketCap),
          "Valor de mercado da empresa.",
        ),
      ];

  const hasIntradayQuote = open !== null || high !== null || low !== null;
  const dayQuoteRows = hasIntradayQuote
    ? [
        quoteRow(
          "Abertura",
          formatCurrency(open) === "Não disponível"
            ? null
            : formatCurrency(open),
          "Preço de abertura do pregão.",
        ),
        quoteRow(
          "Máxima",
          formatCurrency(high) === "Não disponível"
            ? null
            : formatCurrency(high),
          "Máxima do dia.",
        ),
        quoteRow(
          "Mínima",
          formatCurrency(low) === "Não disponível" ? null : formatCurrency(low),
          "Mínima do dia.",
        ),
        quoteRow(
          "Fech. anterior",
          formatCurrency(previousClose) === "Não disponível"
            ? null
            : formatCurrency(previousClose),
          "Fechamento anterior informado pela fonte.",
        ),
        quoteRow(
          "Volume",
          formatInteger(volume) === "Não disponível"
            ? null
            : formatInteger(volume),
          "Volume negociado no pregão.",
        ),
        quoteRow(
          "Valor de mercado",
          formatLargeCurrency(marketCap) === "Não disponível"
            ? null
            : formatLargeCurrency(marketCap),
          "Valor de mercado baseado na cotação atual.",
        ),
      ]
    : [
        quoteRow(
          "Último preço",
          formatCurrency(price) === "Não disponível"
            ? null
            : formatCurrency(price),
          "Último preço disponível.",
        ),
        quoteRow(
          "Fech. anterior",
          formatCurrency(previousClose) === "Não disponível"
            ? null
            : formatCurrency(previousClose),
          "Fechamento anterior informado pela fonte.",
        ),
        quoteRow(
          "Variação",
          formatAlreadyPercentValue(changePercent, 100),
          "Variação disponível para o período informado.",
        ),
        quoteRow(
          "Volume",
          formatInteger(volume) === "Não disponível"
            ? null
            : formatInteger(volume),
          "Volume negociado no pregão.",
        ),
        quoteRow(
          "Valor de mercado",
          formatLargeCurrency(marketCap) === "Não disponível"
            ? null
            : formatLargeCurrency(marketCap),
          "Valor de mercado baseado na cotação atual.",
        ),
      ];

  const companyInfo = isFii
    ? [
        { label: "Nome", value: fullName ?? companyName },
        {
          label: "Segmento",
          value:
            cleanText(
              firstString(profileData, ["segment", "industry", "industria"]),
            ) ?? "Não disponível",
        },
        {
          label: "Nº de cotas",
          value:
            sharesOutstanding === null
              ? "Não disponível"
              : formatInteger(sharesOutstanding),
        },
        {
          label: "Moeda",
          value: cleanText(firstString(quoteData, ["currency"])) ?? "BRL",
        },
      ]
    : [
        { label: "Razão social", value: fullName ?? "Não disponível" },
        {
          label: "CNPJ",
          value:
            firstString(profileData, ["cnpj", "taxId"]) ?? "Não disponível",
        },
        {
          label: "Setor",
          value:
            cleanText(firstString(profileData, ["sector", "setor"])) ??
            "Não disponível",
        },
        {
          label: "Indústria",
          value:
            firstString(profileData, ["industry", "industria"]) ??
            "Não disponível",
        },
        {
          label: "Site",
          value:
            cleanText(firstString(profileData, ["website", "site"])) ??
            "Não disponível",
        },
        {
          label: "Moeda",
          value: cleanText(firstString(quoteData, ["currency"])) ?? "BRL",
        },
      ];

  const baseAnalysis = buildAnalysis({
    classicQuote: input.classicQuote,
    statistics: input.statistics,
    statisticsHistory: input.statisticsHistory,
    financialData: input.financialData,
    financialDataHistory: input.financialDataHistory,
    yahooSummary: input.yahooSummary,
    balanceAnnual: input.balanceAnnual,
    balanceQuarterly: input.balanceQuarterly,
    incomeAnnual: input.incomeAnnual,
    incomeQuarterly: input.incomeQuarterly,
    cashAnnual: input.cashAnnual,
    cashQuarterly: input.cashQuarterly,
  });

  const stockSnapshotAnalysis = buildStockSnapshotAnalysis(
    statisticsData,
    price,
    marketCap,
    sharesOutstanding,
  );

  const fundamentalAnalysis = isFii
    ? buildFiiAnalysis(statisticsData, price, marketCap, sharesOutstanding)
    : mergeSnapshotAnalysis(baseAnalysis, stockSnapshotAnalysis);

  const history = extractHistory(
    input.historical,
    input.classicQuote,
    input.yahooHistory,
  );
  const warnings = [];

  if (price === null) {
    warnings.push("Não foi possível obter cotação para este ticker.");
  }

  const hasUsefulIndicators = keyIndicators.some(
    (item) => item.value !== "Não disponível",
  );
  if (!hasUsefulIndicators) {
    warnings.push("Não foi possível obter indicadores para este ticker.");
  }

  if (!history.length) {
    warnings.push(
      "Não foi possível obter histórico de preço para montar o gráfico local e as oscilações.",
    );
  }

  if (
    !isFii &&
    (!input.balanceAnnual || !input.incomeAnnual || !input.cashAnnual)
  ) {
    warnings.push(
      "Alguns demonstrativos podem depender do plano ou da cobertura das fontes integradas.",
    );
  }

  return {
    ticker: symbol,
    assetKind: isFii ? "fii" : "stock",
    companyName,
    fullName: fullName ?? undefined,
    sector: isFii
      ? "Fundos Imobiliários"
      : (cleanText(firstString(profileData, ["sector", "setor"])) ??
        "Não disponível"),
    subsector:
      cleanText(
        firstString(profileData, ["segment", "industry", "industria"]),
      ) ?? undefined,
    logoUrl:
      firstString(quoteData, ["logourl"]) ??
      firstString(profileData, ["logourl", "logo"]) ??
      undefined,
    source: "Base Mapa do Ativo",
    updatedAt: formatDateTime(updatedAt),
    quote: {
      price,
      changeValue: change,
      changePercent,
      open,
      dayHigh: high,
      dayLow: low,
      previousClose,
      volume,
      marketCap,
    },
    dividendSummary: {
      yield12m:
        formatAlreadyPercentValue(dividendYield, isFii ? 35 : 25) ??
        "Não disponível",
      cash12m:
        dividendRate === null
          ? "Não disponível"
          : `${formatCurrency(dividendRate)}/${isFii ? "cota" : "ação"}`,
    },
    indicators: keyIndicators,
    dayQuoteRows,
    companyInfo,
    history,
    oscillations: buildOscillations(history, price, changePercent),
    fundamentalAnalysis,
    dividends: extractDividends(input.dividends, input.classicQuote),
    related: [],
    warnings,
  };
}
