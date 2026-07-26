import { NextResponse } from "next/server";
import { debugBrapiTicker } from "@/lib/stocks/brapi-client";

type RouteContext = {
  params: Promise<{
    ticker: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { ticker } = await context.params;
  const result = await debugBrapiTicker(ticker);

  return NextResponse.json({
    ticker: ticker.toUpperCase(),
    endpoints: result
  });
}
