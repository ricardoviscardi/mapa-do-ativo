import { NextResponse } from "next/server";
import { getStockByTicker } from "@/lib/stocks/stock-service";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

type AssetData = Awaited<ReturnType<typeof getStockByTicker>>;

function isUnavailableAsset(stock: AssetData): boolean {
  const sector = stock.sector.trim().toLowerCase();
  const hasNoVisibleBase =
    stock.quote.price === null &&
    stock.history.length === 0 &&
    stock.dividends.length === 0 &&
    stock.fundamentalAnalysis.indicators.annual.rows.length === 0 &&
    stock.fundamentalAnalysis.balanceSheet.annual.rows.length === 0 &&
    stock.fundamentalAnalysis.incomeStatement.annual.rows.length === 0 &&
    stock.fundamentalAnalysis.cashFlow.annual.rows.length === 0;

  return hasNoVisibleBase && (sector === "não disponível" || sector === "nao disponivel");
}

export async function GET(_request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const stock = await getStockByTicker(ticker);

  if (isUnavailableAsset(stock)) {
    return NextResponse.json(
      { error: "Ticker não encontrado na cobertura disponível." },
      { status: 404 },
    );
  }

  return NextResponse.json(stock);
}
