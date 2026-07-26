import { NextResponse } from "next/server";
import { getStockByTicker } from "@/lib/stocks/stock-service";
import { getStockFromSupabase } from "@/lib/stocks/supabase-stock-repository";
import { getStockFromLocalSnapshot } from "@/lib/stocks/local-snapshot-repository";
import { getStockFromRemoteSnapshot } from "@/lib/stocks/remote-snapshot-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const normalizedTicker = ticker.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const supabaseStock = await getStockFromSupabase(normalizedTicker);
  const localSnapshotStock = supabaseStock ? null : await getStockFromLocalSnapshot(normalizedTicker);
  const remoteSnapshotStock = supabaseStock || localSnapshotStock
    ? null
    : await getStockFromRemoteSnapshot(normalizedTicker);

  if (supabaseStock || localSnapshotStock || remoteSnapshotStock) {
    const stock = supabaseStock ?? localSnapshotStock ?? remoteSnapshotStock;
    return NextResponse.json({
      ticker: normalizedTicker,
      found: true,
      source: supabaseStock
        ? "supabase"
        : localSnapshotStock
          ? "snapshot-local"
          : "snapshot-remoto",
      historicalBaseLoaded: true,
      stock,
    });
  }

  const fallbackStock = await getStockByTicker(normalizedTicker);
  const fallbackHasData = Boolean(
    fallbackStock.quote.price ||
      fallbackStock.history.length ||
      fallbackStock.indicators.some((indicator) => indicator.value && indicator.value !== "Não disponível")
  );

  return NextResponse.json({
    ticker: normalizedTicker,
    found: fallbackHasData,
    source: fallbackHasData ? "complemento-publico-parcial" : null,
    historicalBaseLoaded: false,
    snapshotRequired: true,
    message: fallbackHasData
      ? "Dados básicos carregados por complemento público. A base histórica completa exige Supabase acessível ou snapshot publicado em public/data/snapshots."
      : "Ativo não encontrado no Supabase, snapshot local/remoto ou complemento público.",
    stock: fallbackHasData ? fallbackStock : null,
  });
}
