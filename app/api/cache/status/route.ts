import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/stocks/api-cache";

export async function GET() {
  return NextResponse.json({
    cache: getCacheStats(),
    policy: {
      stockTtlMinutes: 15,
      stockStaleHours: 6,
      searchTtlMinutes: 60,
      searchStaleHours: 12
    }
  });
}
