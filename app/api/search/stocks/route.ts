import { NextResponse } from "next/server";
import { searchBrapiStocks, type StockSearchResult } from "@/lib/stocks/brapi-client";
import { getCachedValue, setCachedValue } from "@/lib/stocks/api-cache";
import { stockSuggestionsFallback } from "@/lib/stocks/stock-list";
import { searchSupabaseAssets } from "@/lib/stocks/supabase-stock-repository";
import { searchLocalSnapshotAssets } from "@/lib/stocks/local-snapshot-repository";
import { resolveCurrentTicker, tickerAliasWarning } from "@/lib/stocks/ticker-aliases";

const SEARCH_CACHE_VERSION = "v15337";
const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000;
const SEARCH_STALE_TTL_MS = 12 * 60 * 60 * 1000;

function normalizeQuery(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, "");
}

function fallbackType(item: { symbol: string; sector?: string }): string {
  const symbol = item.symbol.toUpperCase();
  const sector = String(item.sector ?? "").toLowerCase();
  const stockUnits = new Set(["BPAC11", "ENGI11", "KLBN11", "SANB11", "SAPR11", "TAEE11"]);
  if ((sector.includes("fii") || sector.includes("fundo") || symbol.endsWith("11")) && !stockUnits.has(symbol)) return "fii";
  return "stock";
}

function fallbackSearch(query: string): StockSearchResult[] {
  const directQuery = query.trim().toUpperCase();
  const queryWithDefaultOn = /^[A-Z]{4}$/.test(directQuery) ? `${directQuery}3` : directQuery;
  const currentQuery = resolveCurrentTicker(directQuery);
  const aliasWarning = tickerAliasWarning(directQuery);

  return stockSuggestionsFallback
    .filter((item) => {
      const searchable = `${item.symbol} ${item.name} ${item.sector ?? ""}`.toUpperCase();
      return searchable.includes(directQuery) || searchable.includes(queryWithDefaultOn) || searchable.includes(currentQuery);
    })
    .map((item) => ({
      ...item,
      symbol: resolveCurrentTicker(item.symbol),
      name: aliasWarning && item.symbol === directQuery ? `${item.name} · atual ${resolveCurrentTicker(item.symbol)}` : item.name,
      type: fallbackType({ ...item, symbol: resolveCurrentTicker(item.symbol) }),
      source: "fallback" as const,
    }))
    .slice(0, 8);
}

function mergeResults(apiResults: StockSearchResult[], fallbackResults: StockSearchResult[]) {
  const merged = [...apiResults, ...fallbackResults];
  const seen = new Set<string>();

  return merged.filter((item) => {
    if (seen.has(item.symbol)) return false;
    seen.add(item.symbol);
    return true;
  }).slice(0, 8);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeQuery(searchParams.get("q") ?? "");

  if (query.length < 2) {
    return NextResponse.json({ query, results: [] });
  }

  const cacheKey = `${SEARCH_CACHE_VERSION}:search:${query}`;
  const cached = getCachedValue<StockSearchResult[]>(cacheKey);

  if (cached.state === "hit" && cached.value) {
    return NextResponse.json({ query, results: cached.value, cache: "hit" });
  }

  const fallbackResults = fallbackSearch(query);
  const snapshotResults = searchLocalSnapshotAssets(query, 8);
  const supabaseResults = await searchSupabaseAssets(query, 8);
  const apiResults = await searchBrapiStocks(query, 8);
  const results = mergeResults([...snapshotResults, ...supabaseResults, ...apiResults], fallbackResults);

  if (results.length) {
    setCachedValue(cacheKey, results, SEARCH_CACHE_TTL_MS, SEARCH_STALE_TTL_MS);
    return NextResponse.json({ query, results, cache: "miss" });
  }

  if (cached.value) {
    return NextResponse.json({ query, results: cached.value, cache: "stale" });
  }

  return NextResponse.json({ query, results: [] });
}
