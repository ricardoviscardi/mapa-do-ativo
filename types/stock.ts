export type StockQuote = {
  price: number | null;
  changeValue: number | null;
  changePercent: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  previousClose: number | null;
  volume: number | null;
  marketCap: number | null;
};

export type StockIndicator = {
  label: string;
  value: string;
  description: string;
  status: "api" | "calculado" | "indisponível" | "mock";
};

export type StockFinancialRow = {
  label: string;
  value: string;
  note: string;
};

export type StockHistoryPoint = {
  date: string;
  close: number;
  volume?: number | null;
};

export type StockOscillation = {
  label: string;
  value: string;
  status: "positive" | "negative" | "neutral" | "unavailable";
  description: string;
};

export type DividendEvent = {
  type: string;
  value: string;
  comDate: string;
  paymentDate: string;
  status: string;
};

export type CompanyInfoRow = {
  label: string;
  value: string;
};

export type AnalysisRow = {
  label: string;
  values: string[];
};

export type AnalysisTable = {
  columns: string[];
  rows: AnalysisRow[];
  emptyMessage?: string;
};

export type FundamentalAnalysisData = {
  indicators: {
    annual: AnalysisTable;
    quarterly: AnalysisTable;
  };
  balanceSheet: {
    annual: AnalysisTable;
    quarterly: AnalysisTable;
  };
  incomeStatement: {
    annual: AnalysisTable;
    quarterly: AnalysisTable;
  };
  cashFlow: {
    annual: AnalysisTable;
    quarterly: AnalysisTable;
  };
};

export type DividendSummary = {
  yield12m: string;
  cash12m: string;
};

export type RelatedAsset = {
  ticker: string;
  name?: string;
};

export type StockData = {
  ticker: string;
  assetKind?: "stock" | "fii";
  companyName: string;
  fullName?: string;
  sector: string;
  subsector?: string;
  logoUrl?: string;
  source: string;
  updatedAt: string;
  quote: StockQuote;
  dividendSummary: DividendSummary;
  indicators: StockIndicator[];
  dayQuoteRows: StockFinancialRow[];
  companyInfo: CompanyInfoRow[];
  history: StockHistoryPoint[];
  oscillations: StockOscillation[];
  fundamentalAnalysis: FundamentalAnalysisData;
  dividends: DividendEvent[];
  related: RelatedAsset[];
  warnings: string[];
};
