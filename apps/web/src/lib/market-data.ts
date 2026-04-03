import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchHistoricalCoinPrice,
  searchCoinCatalog,
  type CoinCatalogEntry,
  type CoinSearchResult,
  type HistoricalPriceResult
} from "@/lib/coingecko";
import { getCoinGeckoApiBaseUrl, getCoinGeckoHeaders } from "@/lib/coingecko-config";
import { toNumber } from "@/lib/format";

type AssetSearchRow = {
  id: string;
  symbol: string;
  name: string;
  coingecko_id: string | null;
};

type AssetMapRow = {
  id: string;
  coingecko_id: string | null;
};

type PriceSnapshotRow = {
  asset_id: string;
  price: string;
  captured_at: string;
};

type HistoricalPriceSnapshotRow = {
  asset_id: string;
  status: HistoricalPriceResult["status"];
  code: string;
  price: string | null;
  matched_at: string | null;
  note: string;
  requested_day: string;
};

type CoinGeckoSimplePriceResponse = Record<
  string,
  Record<string, number | null | undefined> & { last_updated_at?: number | null }
>;

export type CachedCoinSearchResult = {
  assetId: string | null;
  marketId: string;
  symbol: string;
  name: string;
  source: "cache" | "coingecko";
};

type HistoricalCoinLookup = Pick<CoinCatalogEntry, "marketId" | "symbol" | "name">;

function normalizeQuery(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeCurrencyCode(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function slugifyValue(value: string | null | undefined) {
  return normalizeQuery(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function formatUtcDay(value: string | number | null | undefined) {
  const timestampMs = getTimestampMs(value);

  if (!timestampMs) {
    return "";
  }

  const date = new Date(timestampMs);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatHistoricalPriceValue(value: string | number | null | undefined) {
  const numericPrice = toNumber(value);

  return numericPrice === null ? "" : numericPrice.toFixed(8);
}

function shouldPersistHistoricalPrice(result: HistoricalPriceResult) {
  return result.status === "ready" || result.code === "no-sample";
}

function toHistoricalPriceResult(row: HistoricalPriceSnapshotRow) {
  return {
    status: row.status,
    code: row.code,
    price: row.status === "ready" ? formatHistoricalPriceValue(row.price) : "",
    matchedAt: row.matched_at ? getTimestampMs(row.matched_at) : null,
    note: row.note
  } satisfies HistoricalPriceResult;
}

function scoreCachedMatch(entry: { marketId: string; symbol: string; name: string }, query: string) {
  const normalizedQuery = normalizeQuery(query);
  const querySlug = slugifyValue(query);
  const normalizedName = normalizeQuery(entry.name);
  const normalizedSymbol = normalizeQuery(entry.symbol);
  const normalizedMarketId = entry.marketId.toLowerCase();
  let score = 0;

  if (normalizedMarketId === querySlug) {
    score = 150;
  } else if (normalizedSymbol === normalizedQuery) {
    score = 145;
  } else if (normalizedName === normalizedQuery) {
    score = 140;
  } else if (normalizedSymbol.startsWith(normalizedQuery)) {
    score = 125;
  } else if (normalizedName.startsWith(normalizedQuery)) {
    score = 120;
  } else if (normalizedMarketId.startsWith(querySlug)) {
    score = 112;
  } else if (normalizedSymbol.includes(normalizedQuery)) {
    score = 96;
  } else if (normalizedName.includes(normalizedQuery)) {
    score = 90;
  } else if (normalizedMarketId.includes(querySlug)) {
    score = 84;
  }

  return score;
}

async function fetchCoinGeckoSimplePrices(coinIds: string[], currencyCode: string) {
  const uniqueCoinIds = Array.from(new Set(coinIds.filter(Boolean)));

  if (uniqueCoinIds.length === 0) {
    return new Map<string, number>();
  }

  const params = new URLSearchParams({
    ids: uniqueCoinIds.join(","),
    vs_currencies: currencyCode,
    include_last_updated_at: "true"
  });

  const response = await fetch(
    `${getCoinGeckoApiBaseUrl()}/simple/price?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        ...getCoinGeckoHeaders()
      },
      next: {
        revalidate: 60
      }
    }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko price lookup failed with ${response.status}.`);
  }

  const payload = (await response.json()) as CoinGeckoSimplePriceResponse;
  const priceMap = new Map<string, number>();

  for (const coinId of uniqueCoinIds) {
    const numericPrice = toNumber(payload?.[coinId]?.[currencyCode]);

    if (numericPrice !== null) {
      priceMap.set(coinId, numericPrice);
    }
  }

  return priceMap;
}

export async function searchCachedCoinCatalog(query: string, limit = 8) {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return [] as CachedCoinSearchResult[];
  }

  const admin = createAdminClient();
  const [symbolRows, nameRows, marketRows] = await Promise.all([
    admin
      .from("assets")
      .select("id, symbol, name, coingecko_id")
      .eq("is_active", true)
      .ilike("symbol", `${normalizedQuery}%`)
      .limit(limit * 2),
    admin
      .from("assets")
      .select("id, symbol, name, coingecko_id")
      .eq("is_active", true)
      .ilike("name", `${normalizedQuery}%`)
      .limit(limit * 2),
    admin
      .from("assets")
      .select("id, symbol, name, coingecko_id")
      .eq("is_active", true)
      .ilike("coingecko_id", `${slugifyValue(query)}%`)
      .limit(limit * 2)
  ]);

  const rows = [
    ...((symbolRows.data ?? []) as AssetSearchRow[]),
    ...((nameRows.data ?? []) as AssetSearchRow[]),
    ...((marketRows.data ?? []) as AssetSearchRow[])
  ];
  const byMarketId = new Map<string, CachedCoinSearchResult>();

  for (const row of rows) {
    const marketId = (row.coingecko_id || "").trim().toLowerCase();

    if (!marketId || byMarketId.has(marketId)) {
      continue;
    }

    byMarketId.set(marketId, {
      assetId: row.id,
      marketId,
      symbol: row.symbol,
      name: row.name,
      source: "cache"
    });
  }

  return [...byMarketId.values()]
    .map((entry) => ({
      ...entry,
      score: scoreCachedMatch(entry, query)
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
    .slice(0, limit)
    .map(({ score: _score, ...entry }) => entry);
}

export async function cacheCoinSearchResults(entries: Array<Pick<CoinSearchResult, "marketId" | "symbol" | "name">>) {
  if (!entries.length) {
    return;
  }

  const admin = createAdminClient();

  for (const entry of entries) {
    const normalizedMarketId = entry.marketId.trim().toLowerCase();
    const normalizedSymbol = entry.symbol.trim().toUpperCase();
    const normalizedName = entry.name.trim();

    if (!normalizedMarketId || !normalizedSymbol || !normalizedName) {
      continue;
    }

    let { data: existingAsset } = await admin
      .from("assets")
      .select("id, symbol, name, coingecko_id")
      .eq("coingecko_id", normalizedMarketId)
      .limit(1)
      .maybeSingle<AssetSearchRow>();

    if (!existingAsset) {
      const { data: createdAsset, error: createError } = await admin
        .from("assets")
        .insert({
          symbol: normalizedSymbol,
          name: normalizedName,
          asset_type: "coin",
          coingecko_id: normalizedMarketId,
          is_active: true
        })
        .select("id, symbol, name, coingecko_id")
        .single<AssetSearchRow>();

      if (createError || !createdAsset) {
        continue;
      }

      existingAsset = createdAsset;
    }

    const aliases = [
      { alias: normalizedName, alias_kind: "name" },
      { alias: normalizedSymbol, alias_kind: "symbol" },
      { alias: normalizedMarketId, alias_kind: "slug" }
    ];

    for (const alias of aliases) {
      await admin.from("asset_aliases").upsert(
        {
          asset_id: existingAsset.id,
          alias: alias.alias,
          alias_kind: alias.alias_kind
        },
        {
          onConflict: "asset_id,alias,alias_kind",
          ignoreDuplicates: true
        }
      );
    }
  }
}

export async function searchCoinCatalogWithCache(query: string, limit = 8) {
  const cachedResults = await searchCachedCoinCatalog(query, limit);

  if (cachedResults.length >= Math.min(5, limit)) {
    return cachedResults;
  }

  let remoteResults: CoinSearchResult[] = [];

  try {
    remoteResults = await searchCoinCatalog(query, limit);
    await cacheCoinSearchResults(remoteResults);
  } catch (error) {
    console.error("Coin search fell back to the local cache", {
      query,
      error: error instanceof Error ? error.message : "Unknown CoinGecko search error"
    });
    return cachedResults;
  }

  const merged = new Map<string, CachedCoinSearchResult>();

  for (const entry of cachedResults) {
    merged.set(entry.marketId, entry);
  }

  for (const entry of remoteResults) {
    if (!merged.has(entry.marketId)) {
      merged.set(entry.marketId, {
        assetId: null,
        marketId: entry.marketId,
        symbol: entry.symbol,
        name: entry.name,
        source: "coingecko"
      });
    }
  }

  return [...merged.values()].slice(0, limit);
}

async function getAssetMapByCoinIds(coinIds: string[]) {
  const uniqueCoinIds = Array.from(new Set(coinIds.filter(Boolean)));

  if (!uniqueCoinIds.length) {
    return new Map<string, string>();
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("assets")
    .select("id, coingecko_id")
    .in("coingecko_id", uniqueCoinIds) as {
      data: AssetMapRow[] | null;
    };

  const assetMap = new Map<string, string>();

  for (const row of data ?? []) {
    const marketId = (row.coingecko_id || "").trim().toLowerCase();

    if (marketId && !assetMap.has(marketId)) {
      assetMap.set(marketId, row.id);
    }
  }

  return assetMap;
}

async function ensureAssetIdForCoin(coin: HistoricalCoinLookup) {
  const normalizedMarketId = coin.marketId.trim().toLowerCase();

  if (!normalizedMarketId) {
    return null;
  }

  let assetMap = await getAssetMapByCoinIds([normalizedMarketId]);
  let assetId = assetMap.get(normalizedMarketId) || null;

  if (assetId) {
    return assetId;
  }

  await cacheCoinSearchResults([
    {
      marketId: normalizedMarketId,
      symbol: coin.symbol,
      name: coin.name
    }
  ]);

  assetMap = await getAssetMapByCoinIds([normalizedMarketId]);
  assetId = assetMap.get(normalizedMarketId) || null;

  return assetId;
}

async function getCachedHistoricalPriceByAssetId(assetId: string, currencyCode: string, requestedDay: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("historical_price_snapshots")
    .select("asset_id, status, code, price, matched_at, note, requested_day")
    .eq("asset_id", assetId)
    .eq("currency_code", normalizeCurrencyCode(currencyCode))
    .eq("requested_day", requestedDay)
    .limit(1)
    .maybeSingle<HistoricalPriceSnapshotRow>();

  if (error) {
    console.error("Failed to read cached historical price snapshot", {
      assetId,
      currencyCode: normalizeCurrencyCode(currencyCode),
      requestedDay,
      error: error.message
    });
    return null;
  }

  return data ? toHistoricalPriceResult(data) : null;
}

async function saveHistoricalPriceSnapshot(
  assetId: string,
  currencyCode: string,
  requestedDay: string,
  result: HistoricalPriceResult
) {
  if (!shouldPersistHistoricalPrice(result)) {
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("historical_price_snapshots")
    .upsert(
      {
        asset_id: assetId,
        currency_code: normalizeCurrencyCode(currencyCode),
        requested_day: requestedDay,
        status: result.status,
        code: result.code,
        price: result.status === "ready" ? toNumber(result.price) : null,
        matched_at: result.matchedAt ? new Date(result.matchedAt).toISOString() : null,
        note: result.note,
        source_provider: "coingecko"
      },
      {
        onConflict: "asset_id,currency_code,requested_day"
      }
    );

  if (error) {
    console.error("Failed to save historical price snapshot", {
      assetId,
      currencyCode: normalizeCurrencyCode(currencyCode),
      requestedDay,
      error: error.message
    });
  }
}

export async function getOrFetchHistoricalPrice(
  coin: HistoricalCoinLookup,
  timestampValue: string | number,
  currencyCode: string
) {
  const normalizedMarketId = coin.marketId.trim().toLowerCase();
  const requestedDay = formatUtcDay(timestampValue);
  let assetId: string | null = null;

  if (normalizedMarketId && requestedDay) {
    assetId = await ensureAssetIdForCoin(coin);

    if (assetId) {
      const cachedResult = await getCachedHistoricalPriceByAssetId(assetId, currencyCode, requestedDay);

      if (cachedResult) {
        return cachedResult;
      }
    }
  }

  const fetchedResult = await fetchHistoricalCoinPrice(normalizedMarketId, timestampValue, currencyCode);

  if (assetId && requestedDay) {
    await saveHistoricalPriceSnapshot(assetId, currencyCode, requestedDay, fetchedResult);
  }

  return fetchedResult;
}

export async function getCachedSpotPrices(coinIds: string[], currencyCode: string, maxAgeSeconds = 60) {
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode);
  const assetMap = await getAssetMapByCoinIds(coinIds);
  const assetIds = [...new Set([...assetMap.values()])];

  if (!assetIds.length) {
    return new Map<string, number>();
  }

  const cutoffIso = new Date(Date.now() - maxAgeSeconds * 1000).toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("price_snapshots")
    .select("asset_id, price, captured_at")
    .in("asset_id", assetIds)
    .eq("currency_code", normalizedCurrencyCode)
    .gte("captured_at", cutoffIso)
    .order("captured_at", { ascending: false }) as {
      data: PriceSnapshotRow[] | null;
      error?: { message?: string } | null;
    };

  if (error) {
    console.error("Failed to read cached price snapshots", {
      currencyCode: normalizedCurrencyCode,
      error: error.message
    });
    return new Map<string, number>();
  }

  const latestByAssetId = new Map<string, number>();

  for (const row of data ?? []) {
    if (latestByAssetId.has(row.asset_id)) {
      continue;
    }

    const numericPrice = toNumber(row.price);

    if (numericPrice !== null) {
      latestByAssetId.set(row.asset_id, numericPrice);
    }
  }

  const priceMap = new Map<string, number>();

  for (const [marketId, assetId] of assetMap.entries()) {
    const cachedPrice = latestByAssetId.get(assetId);

    if (typeof cachedPrice === "number") {
      priceMap.set(marketId, cachedPrice);
    }
  }

  return priceMap;
}

export async function saveSpotPrices(coinIds: string[], currencyCode: string, priceMap: Map<string, number>) {
  if (!coinIds.length || priceMap.size === 0) {
    return;
  }

  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode);
  const assetMap = await getAssetMapByCoinIds(coinIds);

  if (!assetMap.size) {
    return;
  }

  const rows = [...assetMap.entries()]
    .map(([marketId, assetId]) => {
      const price = priceMap.get(marketId);

      if (typeof price !== "number") {
        return null;
      }

      return {
        asset_id: assetId,
        currency_code: normalizedCurrencyCode,
        price,
        source_provider: "coingecko",
        captured_at: new Date().toISOString()
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (!rows.length) {
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("price_snapshots").insert(rows);

  if (error) {
    console.error("Failed to save price snapshots", {
      currencyCode: normalizedCurrencyCode,
      error: error.message
    });
  }
}

export async function getOrFetchSpotPrices(coinIds: string[], currencyCode: string, maxAgeSeconds = 60) {
  const uniqueCoinIds = Array.from(new Set(coinIds.filter(Boolean)));
  const cachedPrices = await getCachedSpotPrices(uniqueCoinIds, currencyCode, maxAgeSeconds);
  const missingCoinIds = uniqueCoinIds.filter((coinId) => !cachedPrices.has(coinId));

  if (!missingCoinIds.length) {
    return cachedPrices;
  }

  let freshPrices = new Map<string, number>();

  try {
    freshPrices = await fetchCoinGeckoSimplePrices(missingCoinIds, normalizeCurrencyCode(currencyCode));
    await saveSpotPrices(missingCoinIds, currencyCode, freshPrices);
  } catch (error) {
    console.error("Spot price lookup fell back to cached prices", {
      currencyCode: normalizeCurrencyCode(currencyCode),
      missingCoinIds,
      error: error instanceof Error ? error.message : "Unknown CoinGecko price error"
    });
    return cachedPrices;
  }

  const merged = new Map(cachedPrices);

  for (const [coinId, price] of freshPrices.entries()) {
    merged.set(coinId, price);
  }

  return merged;
}
