import { existsSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { evaluateAssetQuality } from "@/lib/stocks/asset-quality";
import { getStockByTicker } from "@/lib/stocks/stock-service";
import { popularFIIs, popularStocks, rankingFIIs, rankingStocks } from "@/lib/stocks/stock-list";
import { checkSupabaseTable, getSupabaseConnectionStatus, supabaseSelect } from "@/lib/supabase/server";
import { getSnapshotStatus } from "@/lib/stocks/local-snapshot-repository";
import { getRemoteSnapshotStatus } from "@/lib/stocks/remote-snapshot-repository";
import type { StockData } from "@/types/stock";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AssetQualityRow = {
  ticker: string;
  kind: "stock" | "fii";
  cnpj: string | null;
};

type QuoteQualityRow = {
  ticker: string;
  price: number | null;
  market_cap: number | null;
  quote_date: string | null;
};

type HistoryQualityRow = {
  ticker: string;
  date: string;
};

type IndicatorQualityRow = {
  ticker: string;
  reference_date: string;
  dividend_yield: number | null;
  pvp: number | null;
  pe: number | null;
  roe: number | null;
};

type FinancialQualityRow = {
  ticker: string;
  period_type: "annual" | "quarterly";
  reference_date: string | null;
};

type AssetStatus = "OK" | "parcial" | "limitado" | "inconsistente";
type DataOrigin = "supabase" | "snapshot_local" | "snapshot_remoto" | "complemento_publico" | "mock" | "indisponivel";

type CriticalAssetAudit = {
  ticker: string;
  kind: "stock" | "fii";
  status: AssetStatus;
  qualityScore: number;
  qualityLabel: string;
  origin: DataOrigin;
  source: string;
  checks: {
    price: boolean;
    history: boolean;
    indicators: boolean;
    dividends: boolean;
    marketCap: boolean;
    localSnapshot: boolean;
  };
  issues: string[];
  strengths: string[];
};

function uniqueCount(values: Array<string | null | undefined>): number {
  return new Set(values.filter(Boolean).map((value) => String(value).toUpperCase())).size;
}

function upperSet(values: Array<string | null | undefined>): Set<string> {
  return new Set(values.filter(Boolean).map((value) => String(value).toUpperCase()));
}

function missingFrom(universe: string[], available: Set<string>): string[] {
  return Array.from(new Set(universe.map((ticker) => ticker.toUpperCase()))).filter((ticker) => !available.has(ticker));
}

function chunks<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function inFilter(tickers: string[]): string {
  return `in.(${tickers.join(",")})`;
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function localSnapshotExists(ticker: string): boolean {
  const filePath = path.join(process.cwd(), "public", "data", "snapshots", "stocks", `${normalizeTicker(ticker)}.json`);
  return existsSync(filePath);
}

function detectOrigin(stock: StockData): DataOrigin {
  const source = stock.source.toLowerCase();
  if (source.includes("snapshot local")) return "snapshot_local";
  if (source.includes("snapshot remoto")) return "snapshot_remoto";
  if (source.includes("complemento público") || source.includes("complemento publico")) return "complemento_publico";
  if (source.includes("mock")) return "mock";
  if (source.includes("base mapa do ativo") || source.includes("supabase")) return "supabase";
  if (stock.quote.price === null && stock.history.length === 0) return "indisponivel";
  return "supabase";
}

function classifyAsset(stock: StockData): AssetStatus {
  const quality = evaluateAssetQuality(stock);
  if (!quality.hasPrice) return "inconsistente";
  if (quality.score >= 80 && quality.hasUsableHistory && quality.hasIndicators) return "OK";
  if (quality.score >= 60) return "parcial";
  if (quality.score >= 40) return "limitado";
  return "inconsistente";
}

async function monitoredTickerSet<T extends { ticker: string | null }>(
  table: string,
  monitored: string[],
  options: { select: string; filters?: Record<string, string>; limit?: number },
): Promise<Set<string>> {
  const rows: T[] = [];

  for (const group of chunks(Array.from(new Set(monitored.map(normalizeTicker))).filter(Boolean), 60)) {
    rows.push(...await supabaseSelect<T>(table, {
      select: options.select,
      filters: {
        ...(options.filters ?? {}),
        ticker: inFilter(group),
      },
      limit: options.limit ?? 5000,
    }));
  }

  return upperSet(rows.map((row) => row.ticker));
}

async function auditCriticalAssets(tickers: string[]): Promise<CriticalAssetAudit[]> {
  const uniqueTickers = Array.from(new Set(tickers.map(normalizeTicker))).filter(Boolean);
  const audits: CriticalAssetAudit[] = [];

  for (const group of chunks(uniqueTickers, 10)) {
    const settled = await Promise.allSettled(group.map((ticker) => getStockByTicker(ticker)));

    settled.forEach((result, index) => {
      const ticker = group[index];

      if (result.status !== "fulfilled") {
        audits.push({
          ticker,
          kind: ticker.endsWith("11") ? "fii" : "stock",
          status: "inconsistente",
          qualityScore: 0,
          qualityLabel: "Limitada",
          origin: localSnapshotExists(ticker) ? "snapshot_local" : "indisponivel",
          source: "Erro ao consolidar ativo",
          checks: {
            price: false,
            history: false,
            indicators: false,
            dividends: false,
            marketCap: false,
            localSnapshot: localSnapshotExists(ticker),
          },
          issues: ["erro ao consolidar ativo na auditoria"],
          strengths: [],
        });
        return;
      }

      const stock = result.value;
      const quality = evaluateAssetQuality(stock);
      const origin = detectOrigin(stock);
      const localSnapshot = localSnapshotExists(ticker);
      const status = classifyAsset(stock);

      audits.push({
        ticker: stock.ticker,
        kind: stock.assetKind === "fii" || stock.ticker.endsWith("11") ? "fii" : "stock",
        status,
        qualityScore: quality.score,
        qualityLabel: quality.label,
        origin,
        source: stock.source,
        checks: {
          price: quality.hasPrice,
          history: quality.hasUsableHistory || stock.history.length >= 30,
          indicators: quality.hasIndicators,
          dividends: quality.hasDividends,
          marketCap: quality.hasMarketCap,
          localSnapshot,
        },
        issues: quality.issues,
        strengths: quality.strengths,
      });
    });
  }

  return audits.sort((a, b) => a.ticker.localeCompare(b.ticker));
}

function auditMissingByCheck(audits: CriticalAssetAudit[], check: keyof CriticalAssetAudit["checks"]): string[] {
  return audits.filter((audit) => !audit.checks[check]).map((audit) => audit.ticker);
}

function countByOrigin(audits: CriticalAssetAudit[]): Record<DataOrigin, number> {
  return audits.reduce<Record<DataOrigin, number>>((acc, audit) => {
    acc[audit.origin] = (acc[audit.origin] ?? 0) + 1;
    return acc;
  }, {
    supabase: 0,
    snapshot_local: 0,
    snapshot_remoto: 0,
    complemento_publico: 0,
    mock: 0,
    indisponivel: 0,
  });
}

function countByStatus(audits: CriticalAssetAudit[]): Record<AssetStatus, number> {
  return audits.reduce<Record<AssetStatus, number>>((acc, audit) => {
    acc[audit.status] = (acc[audit.status] ?? 0) + 1;
    return acc;
  }, {
    OK: 0,
    parcial: 0,
    limitado: 0,
    inconsistente: 0,
  });
}

function getCriticalUniverse(): string[] {
  return Array.from(new Set([
    ...popularStocks,
    ...popularFIIs,
    "RAIZ4",
    "HGPO11",
  ].map(normalizeTicker))).filter(Boolean);
}

function buildRealAudit(criticalAssets: CriticalAssetAudit[]) {
  return {
    missingQuote: auditMissingByCheck(criticalAssets, "price"),
    missingHistory: auditMissingByCheck(criticalAssets, "history"),
    missingIndicators: auditMissingByCheck(criticalAssets, "indicators"),
    missingMarketCap: auditMissingByCheck(criticalAssets, "marketCap"),
    statusCount: countByStatus(criticalAssets),
    originCount: countByOrigin(criticalAssets),
    note: "Auditoria real por ticker crítico consolidando banco principal, snapshot local, snapshot remoto e complemento público. Esta é a auditoria principal para evitar falsos positivos em páginas que funcionam.",
  };
}

async function fallbackQualityResponse(reason: string, error?: unknown) {
  const criticalUniverse = getCriticalUniverse();
  const criticalAssets = await auditCriticalAssets(criticalUniverse);
  const realAudit = buildRealAudit(criticalAssets);

  return NextResponse.json({
    ok: true,
    degraded: true,
    reason,
    connection: getSupabaseConnectionStatus(),
    snapshot: getSnapshotStatus(),
    remoteSnapshot: getRemoteSnapshotStatus(),
    summary: {
      assetsTotal: null,
      stocks: null,
      fiis: null,
      assetsWithQuote: null,
      assetsWithHistory: null,
      assetsWithIndicators: null,
      assetsWithMarketCap: null,
      assetsWithCnpj: null,
      assetsWithAnnualFinancials: null,
      assetsWithQuarterlyFinancials: null,
      plannedCoverage: {
        monitoredStocks: new Set(rankingStocks).size,
        monitoredFIIs: new Set(rankingFIIs).size,
        criticalAssets: criticalUniverse.length,
        note: "Base monitorada inicial. Contagens completas dependem do Supabase configurado.",
      },
      audit: realAudit,
      sourceAudit: {
        bancoPrincipal: {
          missingQuote: [],
          missingHistory: [],
          missingIndicators: [],
          missingMarketCap: [],
          note: "Banco principal não consultado nesta resposta. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY localmente ou na Vercel para ativar a auditoria completa.",
        },
        snapshots: {
          localConfigured: existsSync(path.join(process.cwd(), "public", "data", "snapshots", "stocks")),
          criticalWithLocalSnapshot: criticalAssets.filter((asset) => asset.checks.localSnapshot).map((asset) => asset.ticker),
          criticalWithoutLocalSnapshot: criticalAssets.filter((asset) => !asset.checks.localSnapshot).map((asset) => asset.ticker),
          note: "Snapshot local/remoto usado como fallback de auditoria quando o Supabase não está configurado ou falha.",
        },
      },
    },
    criticalAssets,
    tables: [],
    error: error instanceof Error ? error.message : undefined,
    note: "Relatório técnico em modo degradado. O endpoint continua retornando JSON para não quebrar a validação local, mas a auditoria completa exige Supabase configurado.",
  }, { status: 200 });
}

export async function GET() {
  const connection = getSupabaseConnectionStatus();

  if (!connection.configured) {
    return fallbackQualityResponse("Supabase não configurado no ambiente local.");
  }

  try {
    const tables = await Promise.all([
      checkSupabaseTable("assets"),
      checkSupabaseTable("asset_quotes"),
      checkSupabaseTable("asset_price_history"),
      checkSupabaseTable("asset_financials"),
      checkSupabaseTable("asset_dividends"),
      checkSupabaseTable("asset_indicators"),
    ]);

  const [assets, quotes, history, indicators, financials] = await Promise.all([
    supabaseSelect<AssetQualityRow>("assets", { select: "ticker,kind,cnpj", limit: 1200 }),
    supabaseSelect<QuoteQualityRow>("asset_quotes", { select: "ticker,price,market_cap,quote_date", order: "quote_date.desc", limit: 12000 }),
    supabaseSelect<HistoryQualityRow>("asset_price_history", { select: "ticker,date", order: "date.desc", limit: 20000 }),
    supabaseSelect<IndicatorQualityRow>("asset_indicators", { select: "ticker,reference_date,dividend_yield,pvp,pe,roe", order: "reference_date.desc", limit: 12000 }),
    supabaseSelect<FinancialQualityRow>("asset_financials", { select: "ticker,period_type,reference_date", order: "reference_date.desc", limit: 5000 }),
  ]);

  const stockCount = assets.filter((asset) => asset.kind === "stock").length;
  const fiiCount = assets.filter((asset) => asset.kind === "fii").length;
  const assetsWithQuote = uniqueCount(quotes.filter((quote) => quote.price !== null).map((quote) => quote.ticker));
  const assetsWithHistory = uniqueCount(history.map((row) => row.ticker));
  const assetsWithIndicators = uniqueCount(indicators.map((row) => row.ticker));
  const assetsWithMarketCap = uniqueCount(quotes.filter((quote) => quote.market_cap !== null).map((quote) => quote.ticker));
  const assetsWithCnpj = uniqueCount(assets.filter((asset) => asset.cnpj).map((asset) => asset.ticker));
  const assetsWithAnnualFinancials = uniqueCount(financials.filter((row) => row.period_type === "annual").map((row) => row.ticker));
  const assetsWithQuarterlyFinancials = uniqueCount(financials.filter((row) => row.period_type === "quarterly").map((row) => row.ticker));

    const monitored = Array.from(new Set([...rankingStocks, ...rankingFIIs].map(normalizeTicker))).filter(Boolean);
    const criticalUniverse = getCriticalUniverse();

  const [tickersWithQuote, tickersWithHistory, tickersWithIndicators, tickersWithMarketCap, criticalAssets] = await Promise.all([
    monitoredTickerSet<QuoteQualityRow>("asset_quotes", monitored, {
      select: "ticker,price,market_cap,quote_date",
      filters: { price: "not.is.null" },
    }),
    monitoredTickerSet<HistoryQualityRow>("asset_price_history", monitored, {
      select: "ticker,date",
    }),
    monitoredTickerSet<IndicatorQualityRow>("asset_indicators", monitored, {
      select: "ticker,reference_date,dividend_yield,pvp,pe,roe",
    }),
    monitoredTickerSet<QuoteQualityRow>("asset_quotes", monitored, {
      select: "ticker,price,market_cap,quote_date",
      filters: { market_cap: "not.is.null" },
    }),
    auditCriticalAssets(criticalUniverse),
  ]);

    const realAudit = buildRealAudit(criticalAssets);

  return NextResponse.json({
    ok: true,
    summary: {
      assetsTotal: assets.length,
      stocks: stockCount,
      fiis: fiiCount,
      assetsWithQuote,
      assetsWithHistory,
      assetsWithIndicators,
      assetsWithMarketCap,
      assetsWithCnpj,
      assetsWithAnnualFinancials,
      assetsWithQuarterlyFinancials,
      plannedCoverage: {
        monitoredStocks: new Set(rankingStocks).size,
        monitoredFIIs: new Set(rankingFIIs).size,
        criticalAssets: criticalUniverse.length,
        note: "Base monitorada inicial. Não representa ainda todos os ativos existentes na B3.",
      },
      audit: realAudit,
      sourceAudit: {
        bancoPrincipal: {
          missingQuote: missingFrom(monitored, tickersWithQuote).slice(0, 30),
          missingHistory: missingFrom(monitored, tickersWithHistory).slice(0, 30),
          missingIndicators: missingFrom(monitored, tickersWithIndicators).slice(0, 30),
          missingMarketCap: missingFrom(monitored, tickersWithMarketCap).slice(0, 30),
          note: "Cobertura bruta do banco principal para a base monitorada. Pode ser diferente da página final quando há snapshot ou complemento público.",
        },
        snapshots: {
          localConfigured: existsSync(path.join(process.cwd(), "public", "data", "snapshots", "stocks")),
          criticalWithLocalSnapshot: criticalAssets.filter((asset) => asset.checks.localSnapshot).map((asset) => asset.ticker),
          criticalWithoutLocalSnapshot: criticalAssets.filter((asset) => !asset.checks.localSnapshot).map((asset) => asset.ticker),
          note: "Snapshot local é usado como fallback quando o banco principal não responde ou quando o repositório foi atualizado pelos workflows.",
        },
      },
    },
    criticalAssets,
    tables,
    note: "Relatório técnico de validação da base. Use para auditoria interna antes do deploy. Para decisão de indexação, priorize criticalAssets e summary.audit. sourceAudit separa banco principal de snapshots para não gerar falso positivo quando a página final possui fallback saudável.",
    });
  } catch (error) {
    return fallbackQualityResponse("Falha ao consultar o Supabase durante a auditoria completa.", error);
  }
}
