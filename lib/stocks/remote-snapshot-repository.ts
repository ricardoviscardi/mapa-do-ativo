import {
  buildStockDataFromSupabaseRows,
  type AssetRow,
  type DividendRow,
  type FinancialRow,
  type HistoryRow,
  type IndicatorRow,
  type QuoteRow,
} from "@/lib/stocks/supabase-stock-repository";
import type { StockData } from "@/types/stock";
import { isProductionBuildPhase } from "@/lib/utils/build-env";

type SnapshotPayload = {
  version?: string;
  generatedAt?: string;
  ticker: string;
  asset: AssetRow;
  quotes?: QuoteRow[];
  historyRows?: HistoryRow[];
  financials?: FinancialRow[];
  dividendRows?: DividendRow[];
  indicatorRows?: IndicatorRow[];
};

const DEFAULT_REMOTE_BASE_URL =
  "https://raw.githubusercontent.com/ricardoviscardi/mapa-do-ativo/main/public/data/snapshots/stocks";

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getRemoteBaseUrl(): string {
  return (
    process.env.STOCK_SNAPSHOT_BASE_URL ||
    process.env.NEXT_PUBLIC_STOCK_SNAPSHOT_BASE_URL ||
    DEFAULT_REMOTE_BASE_URL
  ).replace(/\/+$/, "");
}

function snapshotUrlForTicker(ticker: string): string {
  return `${getRemoteBaseUrl()}/${ticker}.json`;
}

export function getRemoteSnapshotStatus() {
  return {
    configured: Boolean(getRemoteBaseUrl()),
    baseUrl: getRemoteBaseUrl(),
    message:
      "Snapshot remoto usado quando o Supabase está bloqueado na rede local e o snapshot local ainda não foi baixado.",
  };
}

export async function getStockFromRemoteSnapshot(
  ticker: string,
): Promise<StockData | null> {
  if (isProductionBuildPhase()) return null;

  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) return null;

  try {
    const response = await fetch(snapshotUrlForTicker(normalizedTicker), {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as SnapshotPayload;

    if (!payload.asset || normalizeTicker(payload.ticker) !== normalizedTicker) {
      return null;
    }

    const stock = buildStockDataFromSupabaseRows({
      asset: payload.asset,
      quotes: payload.quotes ?? [],
      historyRows: payload.historyRows ?? [],
      financials: payload.financials ?? [],
      dividendRows: payload.dividendRows ?? [],
      indicatorRows: payload.indicatorRows ?? [],
    });

    return {
      ...stock,
      source: "Snapshot remoto Mapa do Ativo",
      warnings: Array.from(
        new Set([
          ...(stock.warnings ?? []),
          "Dados lidos do snapshot remoto porque o Supabase não está acessível nesta rede.",
        ]),
      ),
    };
  } catch {
    return null;
  }
}
