import { NextResponse } from "next/server";

import { searchCoinCatalogWithCache } from "@/lib/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({
      results: []
    });
  }

  const results = await searchCoinCatalogWithCache(query, 8);

  return NextResponse.json({
    results: results.map((entry) => ({
      marketId: entry.marketId,
      symbol: entry.symbol,
      name: entry.name
    }))
  });
}
