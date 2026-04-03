import "server-only";

import { cache } from "react";

import { getCoinGeckoApiBaseUrl, getCoinGeckoHeaders } from "@/lib/coingecko-config";

const COIN_CATALOG_REVALIDATE_SECONDS = 60 * 60 * 12;
const HISTORICAL_PRICE_REVALIDATE_SECONDS = 60 * 60 * 24;

type CoinGeckoErrorPayload = {
  error?: string;
  status?: {
    error_message?: string;
  };
};

type CoinGeckoPricePoint = [number, number];

type CoinGeckoHistoricalPayload = {
  prices?: CoinGeckoPricePoint[];
} & CoinGeckoErrorPayload;

export type CoinCatalogEntry = {
  marketId: string;
  symbol: string;
  name: string;
  platforms: Record<string, string>;
};

export type CoinSearchResult = CoinCatalogEntry & {
  score: number;
};

export type ResolvedCoinSelection = {
  entry: CoinCatalogEntry | null;
  ambiguousMatches: CoinCatalogEntry[];
};

export type HistoricalPriceResult = {
  status: "ready" | "unavailable";
  code: string;
  price: string;
  matchedAt: number | null;
  note: string;
};

function normalizeQuery(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function slugifyValue(value: string | null | undefined) {
  return normalizeQuery(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function roundDecimalString(value: number | string, fractionDigits = 8) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toFixed(fractionDigits);
}

async function fetchJson<T>(url: string, init?: RequestInit & { next?: { revalidate: number } }) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...getCoinGeckoHeaders(),
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    let errorMessage = `Request failed with ${response.status} ${response.statusText}`;

    try {
      const payload = (await response.json()) as CoinGeckoErrorPayload;
      errorMessage =
        payload?.status?.error_message ||
        payload?.error ||
        errorMessage;
    } catch {
      // Keep the fallback message.
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

const getCoinCatalog = cache(async () => {
  const coinGeckoApiBaseUrl = getCoinGeckoApiBaseUrl();
  const payload = await fetchJson<Array<{
    id: string;
    symbol: string;
    name: string;
    platforms?: Record<string, string>;
  }>>(`${coinGeckoApiBaseUrl}/coins/list?include_platform=true`, {
    next: {
      revalidate: COIN_CATALOG_REVALIDATE_SECONDS
    }
  });

  return payload
    .filter((entry) => entry?.id && entry?.symbol && entry?.name)
    .map<CoinCatalogEntry>((entry) => ({
      marketId: entry.id,
      symbol: entry.symbol.toUpperCase(),
      name: entry.name,
      platforms: entry.platforms || {}
    }));
});

function scoreCoinMatch(entry: CoinCatalogEntry, normalizedQuery: string, querySlug: string) {
  if (!normalizedQuery) {
    return 0;
  }

  const name = normalizeQuery(entry.name);
  const symbol = normalizeQuery(entry.symbol);
  const marketId = entry.marketId.toLowerCase();
  let score = 0;

  if (marketId === querySlug) {
    score = 150;
  } else if (symbol === normalizedQuery) {
    score = 145;
  } else if (name === normalizedQuery) {
    score = 140;
  } else if (symbol.startsWith(normalizedQuery)) {
    score = 125;
  } else if (name.startsWith(normalizedQuery)) {
    score = 120;
  } else if (marketId.startsWith(querySlug)) {
    score = 112;
  } else if (symbol.includes(normalizedQuery)) {
    score = 96;
  } else if (name.includes(normalizedQuery)) {
    score = 90;
  } else if (marketId.includes(querySlug)) {
    score = 84;
  }

  if (!score) {
    return 0;
  }

  return score - Math.min(entry.name.length, 40) / 100 - Math.min(entry.symbol.length, 12) / 100;
}

export async function searchCoinCatalog(query: string, limit = 8) {
  const normalizedQuery = normalizeQuery(query);
  const querySlug = slugifyValue(query);

  if (!normalizedQuery) {
    return [] as CoinSearchResult[];
  }

  const catalog = await getCoinCatalog();

  return catalog
    .map((entry) => ({
      ...entry,
      score: scoreCoinMatch(entry, normalizedQuery, querySlug)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.symbol !== right.symbol) {
        return left.symbol.localeCompare(right.symbol);
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

export async function resolveCoinSelection(input: {
  marketId?: string | null;
  coinName?: string | null;
  coinSymbol?: string | null;
}) {
  const catalog = await getCoinCatalog();
  const normalizedMarketId = (input.marketId || "").trim().toLowerCase();

  if (normalizedMarketId) {
    const entry = catalog.find((coin) => coin.marketId.toLowerCase() === normalizedMarketId) || null;

    return {
      entry,
      ambiguousMatches: []
    } satisfies ResolvedCoinSelection;
  }

  const normalizedName = normalizeQuery(input.coinName);
  const normalizedSymbol = normalizeQuery(input.coinSymbol);
  const exactMatches = catalog.filter((entry) => {
    const name = normalizeQuery(entry.name);
    const symbol = normalizeQuery(entry.symbol);

    return Boolean(
      (normalizedName && name === normalizedName) ||
      (normalizedSymbol && symbol === normalizedSymbol)
    );
  });

  const uniqueExactMatches = [...new Map(exactMatches.map((entry) => [entry.marketId, entry])).values()];

  if (uniqueExactMatches.length === 1) {
    return {
      entry: uniqueExactMatches[0],
      ambiguousMatches: []
    } satisfies ResolvedCoinSelection;
  }

  if (uniqueExactMatches.length > 1) {
    return {
      entry: null,
      ambiguousMatches: uniqueExactMatches.slice(0, 6)
    } satisfies ResolvedCoinSelection;
  }

  const query = input.coinName || input.coinSymbol || "";
  const rankedMatches = await searchCoinCatalog(query, 6);

  if (rankedMatches.length === 1) {
    return {
      entry: rankedMatches[0],
      ambiguousMatches: []
    } satisfies ResolvedCoinSelection;
  }

  if (rankedMatches.length > 1 && rankedMatches[0].score >= rankedMatches[1].score + 18) {
    return {
      entry: rankedMatches[0],
      ambiguousMatches: []
    } satisfies ResolvedCoinSelection;
  }

  return {
    entry: null,
    ambiguousMatches: rankedMatches
  } satisfies ResolvedCoinSelection;
}

export async function getCoinDetail(marketId: string) {
  const normalizedMarketId = marketId.trim().toLowerCase();
  const coinGeckoApiBaseUrl = getCoinGeckoApiBaseUrl();

  if (!normalizedMarketId) {
    return null;
  }

  return fetchJson<Record<string, unknown>>(
    `${coinGeckoApiBaseUrl}/coins/${encodeURIComponent(normalizedMarketId)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
    {
      next: {
        revalidate: COIN_CATALOG_REVALIDATE_SECONDS
      }
    }
  );
}

function getTimestampMs(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const rawValue = typeof value === "number" ? `${value}` : String(value).trim();

  if (!rawValue) {
    return 0;
  }

  if (/^\d+$/.test(rawValue)) {
    const timestamp = Number(rawValue) * (rawValue.length <= 10 ? 1000 : 1);
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
  }

  const timestamp = new Date(rawValue).getTime();
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
}

function getHistoricalRange(timestampMs: number) {
  const halfDayMs = 12 * 60 * 60 * 1000;

  return {
    fromSeconds: Math.floor((timestampMs - halfDayMs) / 1000),
    toSeconds: Math.ceil((timestampMs + halfDayMs) / 1000)
  };
}

function getClosestPricePoint(points: CoinGeckoPricePoint[] | undefined, targetTimestampMs: number) {
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }

  let closestPoint: CoinGeckoPricePoint | null = null;
  let closestDelta = Number.POSITIVE_INFINITY;

  for (const point of points) {
    if (!Array.isArray(point) || point.length < 2) {
      continue;
    }

    const [timestamp, price] = point;

    if (!Number.isFinite(timestamp) || !Number.isFinite(price)) {
      continue;
    }

    const delta = Math.abs(timestamp - targetTimestampMs);

    if (delta < closestDelta) {
      closestPoint = [timestamp, price];
      closestDelta = delta;
    }
  }

  return closestPoint;
}

export async function fetchHistoricalCoinPrice(
  marketId: string,
  timestampValue: string | number,
  currencyCode: string
) {
  const normalizedMarketId = marketId.trim().toLowerCase();
  const normalizedCurrencyCode = currencyCode.trim().toLowerCase();
  const timestampMs = getTimestampMs(timestampValue);
  const coinGeckoApiBaseUrl = getCoinGeckoApiBaseUrl();

  if (!normalizedMarketId) {
    return {
      status: "unavailable",
      code: "missing-market-id",
      price: "",
      matchedAt: null,
      note: "Historical price needs review because this coin does not have a CoinGecko market ID yet."
    } satisfies HistoricalPriceResult;
  }

  if (!timestampMs) {
    return {
      status: "unavailable",
      code: "missing-timestamp",
      price: "",
      matchedAt: null,
      note: "Historical price needs review because the transaction timestamp is missing."
    } satisfies HistoricalPriceResult;
  }

  const { fromSeconds, toSeconds } = getHistoricalRange(timestampMs);
  const requestUrl = new URL(
    `${coinGeckoApiBaseUrl}/coins/${encodeURIComponent(normalizedMarketId)}/market_chart/range`
  );

  requestUrl.searchParams.set("vs_currency", normalizedCurrencyCode);
  requestUrl.searchParams.set("from", `${fromSeconds}`);
  requestUrl.searchParams.set("to", `${toSeconds}`);
  requestUrl.searchParams.set("precision", "full");

  let payload: CoinGeckoHistoricalPayload;

  try {
    payload = await fetchJson<CoinGeckoHistoricalPayload>(requestUrl.toString(), {
      next: {
        revalidate: HISTORICAL_PRICE_REVALIDATE_SECONDS
      }
    });
  } catch (error) {
    return {
      status: "unavailable",
      code: "request-failed",
      price: "",
      matchedAt: null,
      note:
        error instanceof Error
          ? `Historical price needs review because the CoinGecko lookup failed: ${error.message}`
          : "Historical price needs review because the CoinGecko lookup failed."
    } satisfies HistoricalPriceResult;
  }

  const closestPoint = getClosestPricePoint(payload.prices, timestampMs);

  if (!closestPoint) {
    return {
      status: "unavailable",
      code: "no-sample",
      price: "",
      matchedAt: null,
      note: "Historical price needs review because CoinGecko did not return a price sample for that transaction day."
    } satisfies HistoricalPriceResult;
  }

  return {
    status: "ready",
    code: "ready",
    price: roundDecimalString(closestPoint[1], 8),
    matchedAt: closestPoint[0],
    note: `Historical ${normalizedCurrencyCode.toUpperCase()} price was prefilled from CoinGecko.`
  } satisfies HistoricalPriceResult;
}

export const getHistoricalCoinPrice = fetchHistoricalCoinPrice;
