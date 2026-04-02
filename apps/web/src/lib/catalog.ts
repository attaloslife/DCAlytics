import { requireAuthenticatedContext } from "@/lib/auth";

type JoinedRecord<T> = T | T[] | null;

type RawChainRecord = {
  id: string;
  slug: string;
  name: string;
  family: "bitcoin" | "evm" | "solana" | "cosmos" | "other";
  native_symbol: string | null;
  is_active?: boolean;
};

type RawAssetRecord = {
  id: string;
  symbol: string;
  name: string;
  asset_type: "coin" | "token" | "nft" | "lp_token" | "other";
  coingecko_id: string | null;
  is_active?: boolean;
};

type RawDeploymentRecord = {
  asset_id: string;
  chain_id: string;
  contract_address: string | null;
  decimals: number | null;
  provider_symbol: string | null;
  provider_name: string | null;
  is_native: boolean;
  assets: JoinedRecord<RawAssetRecord>;
  chains: JoinedRecord<RawChainRecord>;
};

export type ChainOption = {
  id: string;
  slug: string;
  name: string;
  family: "bitcoin" | "evm" | "solana" | "cosmos" | "other";
  nativeSymbol: string | null;
};

export type AssetOption = {
  assetId: string;
  chainId: string;
  chainSlug: string;
  chainName: string;
  symbol: string;
  name: string;
  assetType: "coin" | "token" | "nft" | "lp_token" | "other";
  coingeckoId: string | null;
  contractAddress: string | null;
  decimals: number | null;
  providerSymbol: string | null;
  providerName: string | null;
  isNative: boolean;
};

function unwrapJoin<T>(value: JoinedRecord<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export function formatAssetOptionLabel(asset: AssetOption) {
  return `${asset.symbol} | ${asset.name}`;
}

export async function getActiveChains() {
  const { supabase } = await requireAuthenticatedContext();
  const { data } = await supabase
    .from("chains")
    .select("id, slug, name, family, native_symbol")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return ((data ?? []) as RawChainRecord[])
    .map((chain) => ({
      id: chain.id,
      slug: chain.slug,
      name: chain.name,
      family: chain.family,
      nativeSymbol: chain.native_symbol
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getManualLedgerCatalog() {
  const { supabase } = await requireAuthenticatedContext();
  const [chains, deploymentsResult] = await Promise.all([
    getActiveChains(),
    supabase
      .from("asset_deployments")
      .select(`
        asset_id,
        chain_id,
        contract_address,
        decimals,
        provider_symbol,
        provider_name,
        is_native,
        assets (
          id,
          symbol,
          name,
          asset_type,
          coingecko_id,
          is_active
        ),
        chains (
          id,
          slug,
          name,
          family,
          native_symbol,
          is_active
        )
      `)
      .eq("is_active", true)
  ]);

  const seenAssets = new Set<string>();
  const assets: AssetOption[] = [];

  for (const deployment of (deploymentsResult.data ?? []) as RawDeploymentRecord[]) {
    const asset = unwrapJoin(deployment.assets);
    const chain = unwrapJoin(deployment.chains);

    if (!asset || !chain || asset.is_active === false || chain.is_active === false) {
      continue;
    }

    const dedupeKey = `${deployment.chain_id}:${deployment.asset_id}`;

    if (seenAssets.has(dedupeKey)) {
      continue;
    }

    seenAssets.add(dedupeKey);
    assets.push({
      assetId: asset.id,
      chainId: chain.id,
      chainSlug: chain.slug,
      chainName: chain.name,
      symbol: deployment.provider_symbol || asset.symbol,
      name: deployment.provider_name || asset.name,
      assetType: asset.asset_type,
      coingeckoId: asset.coingecko_id,
      contractAddress: deployment.contract_address,
      decimals: deployment.decimals,
      providerSymbol: deployment.provider_symbol,
      providerName: deployment.provider_name,
      isNative: deployment.is_native
    });
  }

  assets.sort((left, right) => {
    if (left.chainName !== right.chainName) {
      return left.chainName.localeCompare(right.chainName);
    }

    if (left.symbol !== right.symbol) {
      return left.symbol.localeCompare(right.symbol);
    }

    return left.name.localeCompare(right.name);
  });

  return {
    chains,
    assets
  };
}
