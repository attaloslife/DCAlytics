import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCoinSelection } from "@/lib/coingecko";

export type ResolvedLedgerAsset = {
  id: string;
  symbol: string;
  name: string;
  coingeckoId: string | null;
};

type AssetRow = {
  id: string;
  symbol: string;
  name: string;
  coingecko_id: string | null;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").trim();
}

export async function resolveOrCreateLedgerAsset(input: {
  assetId?: string | null;
  coinMarketId?: string | null;
  coinName?: string | null;
  coinSymbol?: string | null;
}) {
  const admin = createAdminClient();

  if (input.assetId) {
    const { data: existingById } = await admin
      .from("assets")
      .select("id, symbol, name, coingecko_id")
      .eq("id", input.assetId)
      .maybeSingle<AssetRow>();

    if (existingById) {
      return {
        asset: {
          id: existingById.id,
          symbol: existingById.symbol,
          name: existingById.name,
          coingeckoId: existingById.coingecko_id
        } satisfies ResolvedLedgerAsset,
        coinSelection: {
          marketId: existingById.coingecko_id,
          name: existingById.name,
          symbol: existingById.symbol
        }
      };
    }
  }

  const resolvedCoin = await resolveCoinSelection({
    marketId: input.coinMarketId,
    coinName: input.coinName,
    coinSymbol: input.coinSymbol
  });

  if (!resolvedCoin.entry) {
    const ambiguousLabel = resolvedCoin.ambiguousMatches
      .slice(0, 3)
      .map((entry) => `${entry.symbol} - ${entry.name}`)
      .join(", ");

    throw new Error(
      ambiguousLabel
        ? `Choose a coin from the suggestions so the app can match it correctly. Try one of: ${ambiguousLabel}.`
        : "Choose a valid coin from the suggestions before saving."
    );
  }

  const resolvedName = normalizeText(resolvedCoin.entry.name);
  const resolvedSymbol = normalizeText(resolvedCoin.entry.symbol).toUpperCase();
  const resolvedMarketId = normalizeText(resolvedCoin.entry.marketId).toLowerCase();

  let existingAsset: AssetRow | null = null;

  const { data: existingByMarketId } = await admin
    .from("assets")
    .select("id, symbol, name, coingecko_id")
    .eq("coingecko_id", resolvedMarketId)
    .limit(1)
    .maybeSingle<AssetRow>();

  if (existingByMarketId) {
    existingAsset = existingByMarketId;
  } else {
    const { data: existingByName } = await admin
      .from("assets")
      .select("id, symbol, name, coingecko_id")
      .ilike("name", resolvedName)
      .ilike("symbol", resolvedSymbol)
      .limit(1)
      .maybeSingle<AssetRow>();

    if (existingByName) {
      existingAsset = existingByName;
    }
  }

  if (!existingAsset) {
    const { data: createdAsset, error: createError } = await admin
      .from("assets")
      .insert({
        symbol: resolvedSymbol,
        name: resolvedName,
        asset_type: "coin",
        coingecko_id: resolvedMarketId,
        is_active: true
      })
      .select("id, symbol, name, coingecko_id")
      .single<AssetRow>();

    if (createError || !createdAsset) {
      throw new Error(createError?.message || "Unable to create the selected coin record.");
    }

    existingAsset = createdAsset;
  }

  return {
    asset: {
      id: existingAsset.id,
      symbol: existingAsset.symbol,
      name: existingAsset.name,
      coingeckoId: existingAsset.coingecko_id
    } satisfies ResolvedLedgerAsset,
    coinSelection: {
      marketId: resolvedMarketId,
      name: resolvedName,
      symbol: resolvedSymbol
    }
  };
}
