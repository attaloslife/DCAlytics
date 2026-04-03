import { cache } from "react";

import { getCoinGeckoApiBaseUrl, getCoinGeckoHeaders } from "@/lib/coingecko-config";
import { toNumber } from "@/lib/format";
import { getOrFetchSpotPrices } from "@/lib/market-data";
import type { WalletAddressRecord } from "@/lib/wallets";

const BLOCKSCOUT_API_BY_CHAIN: Record<string, string> = {
  arbitrum: "https://arbitrum.blockscout.com/api/v2",
  base: "https://base.blockscout.com/api/v2",
  ethereum: "https://eth.blockscout.com/api/v2",
  gnosis: "https://gnosis.blockscout.com/api/v2",
  optimism: "https://optimism.blockscout.com/api/v2",
  polygon: "https://polygon.blockscout.com/api/v2",
  scroll: "https://scroll.blockscout.com/api/v2"
};

const MEMPOOL_API_BASE = "https://mempool.space/api";
const SOLANA_RPC_URL = "https://solana-rpc.publicnode.com";
const SOLANA_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const DEFAULT_PREVIEW_CURRENCY = "usd";
const LIVE_PRICE_REVALIDATE_SECONDS = 60;
const CATALOG_REVALIDATE_SECONDS = 60 * 60 * 12;

type WalletPreviewStatus = "ready" | "partial" | "unsupported" | "inactive" | "error";

type BlockscoutAddressResponse = {
  coin_balance: string;
  exchange_rate: string | null;
  is_scam?: boolean;
};

type BlockscoutTokenRecord = {
  value: string;
  token: {
    address_hash: string | null;
    decimals: string | null;
    exchange_rate: string | null;
    icon_url: string | null;
    name: string | null;
    reputation?: string | null;
    symbol: string | null;
    type: string | null;
  } | null;
};

type BlockscoutTokensResponse = {
  items?: BlockscoutTokenRecord[];
  next_page_params?: Record<string, unknown> | null;
};

type MempoolAddressResponse = {
  chain_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
  mempool_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
};

type CoinGeckoSimplePriceResponse = Record<
  string,
  Record<string, number | null | undefined> & { last_updated_at?: number | null }
>;

type CoinGeckoCoinListItem = {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
};

type SolanaRpcResponse<T> = {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

type SolanaBalanceResult = {
  context: {
    apiVersion: string;
    slot: number;
  };
  value: number;
};

type SolanaTokenAccountsResult = {
  context: {
    apiVersion: string;
    slot: number;
  };
  value: Array<{
    pubkey: string;
    account: {
      data?: {
        parsed?: {
          info?: {
            mint?: string;
            tokenAmount?: {
              amount?: string;
              decimals?: number;
              uiAmount?: number | null;
              uiAmountString?: string;
            };
          };
        };
      };
    };
  }>;
};

export type WalletHoldingPreview = {
  id: string;
  symbol: string;
  name: string;
  balance: number | null;
  price: number | null;
  value: number | null;
  currencyCode: string;
  contractAddress: string | null;
  iconUrl: string | null;
  isNative: boolean;
};

export type WalletLivePreview = {
  walletId: string;
  provider: string;
  status: WalletPreviewStatus;
  currencyCode: string;
  fetchedAt: string;
  totalValue: number | null;
  holdings: WalletHoldingPreview[];
  pricedHoldingsCount: number;
  note: string | null;
  errorMessage: string | null;
};

export type WalletLivePreviewSummary = {
  previewedWalletCount: number;
  readyWalletCount: number;
  partialWalletCount: number;
  errorWalletCount: number;
  unsupportedWalletCount: number;
  totalValue: number | null;
};

type PreviewDraft = {
  walletId: string;
  provider: string;
  status: WalletPreviewStatus;
  currencyCode: string;
  fetchedAt: string;
  holdings: WalletHoldingPreview[];
  note: string | null;
  errorMessage: string | null;
};

type SolanaCatalogRecord = {
  id: string;
  symbol: string;
  name: string;
  mint: string;
};

function buildFetchedAt() {
  return new Date().toISOString();
}

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {})
    },
    cache: init?.cache || "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function parseIntegerAmount(
  rawValue: string | number | null | undefined,
  decimalsValue: string | number | null | undefined
) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const raw = String(rawValue).trim();

  if (!/^-?\d+$/.test(raw)) {
    return toNumber(raw);
  }

  const decimals = Math.max(0, Math.trunc(toNumber(decimalsValue) ?? 0));
  const isNegative = raw.startsWith("-");
  const digits = isNegative ? raw.slice(1) : raw;
  const normalizedDigits = digits.replace(/^0+(?=\d)/, "") || "0";

  if (decimals === 0) {
    const numericValue = Number(`${isNegative ? "-" : ""}${normalizedDigits}`);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  const paddedDigits = normalizedDigits.padStart(decimals + 1, "0");
  const wholePart = paddedDigits.slice(0, -decimals) || "0";
  const fractionPart = paddedDigits.slice(-decimals).replace(/0+$/, "");
  const decimalText = `${isNegative ? "-" : ""}${wholePart}${fractionPart ? `.${fractionPart}` : ""}`;
  const numericValue = Number(decimalText);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function sumValues(values: Array<number | null | undefined>) {
  const numericValues = values.filter((value): value is number => typeof value === "number");

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((total, value) => total + value, 0);
}

function sortHoldings(holdings: WalletHoldingPreview[]) {
  return [...holdings].sort((left, right) => {
    const leftValue = left.value ?? -1;
    const rightValue = right.value ?? -1;

    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }

    const leftBalance = left.balance ?? -1;
    const rightBalance = right.balance ?? -1;

    if (rightBalance !== leftBalance) {
      return rightBalance - leftBalance;
    }

    return left.symbol.localeCompare(right.symbol);
  });
}

function finalizePreview(draft: PreviewDraft): WalletLivePreview {
  const holdings = sortHoldings(draft.holdings);
  const totalValue = sumValues(holdings.map((holding) => holding.value));
  const pricedHoldingsCount = holdings.filter((holding) => holding.value !== null).length;

  return {
    walletId: draft.walletId,
    provider: draft.provider,
    status: draft.status,
    currencyCode: draft.currencyCode,
    fetchedAt: draft.fetchedAt,
    totalValue,
    holdings,
    pricedHoldingsCount,
    note: draft.note,
    errorMessage: draft.errorMessage
  };
}

async function getCoinGeckoSimplePrices(coinIds: string[], currencyCode: string) {
  return getOrFetchSpotPrices(coinIds, currencyCode, LIVE_PRICE_REVALIDATE_SECONDS);
}

async function getCoinGeckoTokenPrices(
  platformId: string,
  contractAddresses: string[],
  currencyCode: string
) {
  const uniqueAddresses = Array.from(new Set(contractAddresses.filter(Boolean)));
  const coinGeckoApiBaseUrl = getCoinGeckoApiBaseUrl();

  if (uniqueAddresses.length === 0) {
    return new Map<string, number>();
  }

  const params = new URLSearchParams({
    contract_addresses: uniqueAddresses.join(","),
    vs_currencies: currencyCode,
    include_last_updated_at: "true"
  });

  const response = await fetchJson<CoinGeckoSimplePriceResponse>(
    `${coinGeckoApiBaseUrl}/simple/token_price/${platformId}?${params.toString()}`,
    {
      headers: getCoinGeckoHeaders(),
      next: {
        revalidate: LIVE_PRICE_REVALIDATE_SECONDS
      }
    }
  );
  const priceMap = new Map<string, number>();

  for (const address of uniqueAddresses) {
    const record = response[address] || response[address.toLowerCase()];
    const price = toNumber(record?.[currencyCode]);

    if (price !== null) {
      priceMap.set(address, price);
    }
  }

  return priceMap;
}

const getCoinGeckoSolanaCatalog = cache(async () => {
  const coinGeckoApiBaseUrl = getCoinGeckoApiBaseUrl();
  const response = await fetchJson<CoinGeckoCoinListItem[]>(
    `${coinGeckoApiBaseUrl}/coins/list?include_platform=true`,
    {
      headers: getCoinGeckoHeaders(),
      next: {
        revalidate: CATALOG_REVALIDATE_SECONDS
      }
    }
  );
  const mintMap = new Map<string, SolanaCatalogRecord>();

  for (const coin of response) {
    const mint = coin.platforms?.solana;

    if (!mint || mintMap.has(mint)) {
      continue;
    }

    mintMap.set(mint, {
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      mint
    });
  }

  return mintMap;
});

async function getEvmWalletPreview(
  wallet: WalletAddressRecord,
  currencyCode: string
): Promise<WalletLivePreview> {
  const blockscoutBaseUrl = wallet.chain ? BLOCKSCOUT_API_BY_CHAIN[wallet.chain.slug] : null;

  if (!blockscoutBaseUrl) {
    return finalizePreview({
      walletId: wallet.id,
      provider: "Blockscout",
      status: "unsupported",
      currencyCode,
      fetchedAt: buildFetchedAt(),
      holdings: [],
      note: `${wallet.chain?.name || "This chain"} is not wired to a live Blockscout preview yet.`,
      errorMessage: null
    });
  }

  const addressUrl = `${blockscoutBaseUrl}/addresses/${wallet.address}`;
  const tokensUrl = `${blockscoutBaseUrl}/addresses/${wallet.address}/tokens?type=ERC-20`;
  const [addressResult, tokensResult] = await Promise.allSettled([
    fetchJson<BlockscoutAddressResponse>(addressUrl),
    fetchJson<BlockscoutTokensResponse>(tokensUrl)
  ]);

  if (addressResult.status === "rejected" && tokensResult.status === "rejected") {
    return finalizePreview({
      walletId: wallet.id,
      provider: "Blockscout",
      status: "error",
      currencyCode,
      fetchedAt: buildFetchedAt(),
      holdings: [],
      note: "The wallet is still saved, but the live explorer request failed for this address.",
      errorMessage: "Unable to load live EVM balances right now."
    });
  }

  const notes: string[] = [];
  const holdings: WalletHoldingPreview[] = [];
  let status: WalletPreviewStatus = "ready";

  if (addressResult.status === "fulfilled") {
    const nativeBalance = parseIntegerAmount(addressResult.value.coin_balance, 18);
    const nativePrice = toNumber(addressResult.value.exchange_rate);

    if ((nativeBalance ?? 0) > 0) {
      holdings.push({
        id: `${wallet.id}:native`,
        symbol: wallet.chain?.nativeSymbol || "ETH",
        name: wallet.chain?.name || "Native Asset",
        balance: nativeBalance,
        price: nativePrice,
        value:
          nativeBalance !== null && nativePrice !== null ? nativeBalance * nativePrice : null,
        currencyCode,
        contractAddress: null,
        iconUrl: null,
        isNative: true
      });
    }
  } else {
    status = "partial";
    notes.push("Native balance is unavailable right now.");
  }

  if (tokensResult.status === "fulfilled") {
    const tokenItems = tokensResult.value.items ?? [];
    const hasMore = Boolean(tokensResult.value.next_page_params);

    for (const item of tokenItems) {
      const token = item.token;

      if (!token) {
        continue;
      }

      const reputation = typeof token.reputation === "string" ? token.reputation.toLowerCase() : null;

      if (reputation && reputation !== "ok") {
        continue;
      }

      const balance = parseIntegerAmount(item.value, token.decimals);

      if (balance === null || balance <= 0) {
        continue;
      }

      const price = toNumber(token.exchange_rate);

      holdings.push({
        id: `${wallet.id}:${token.address_hash || token.symbol || holdings.length}`,
        symbol: token.symbol || "TOKEN",
        name: token.name || "Unlabeled token",
        balance,
        price,
        value: price !== null ? balance * price : null,
        currencyCode,
        contractAddress: token.address_hash,
        iconUrl: token.icon_url,
        isNative: false
      });
    }

    if (hasMore) {
      status = "partial";
      notes.push("Showing the first page of ERC-20 balances. More tokens exist on-chain.");
    }
  } else {
    status = "partial";
    notes.push("ERC-20 balances are unavailable right now.");
  }

  const pricedHoldingsCount = holdings.filter((holding) => holding.value !== null).length;

  if (holdings.length > 0 && pricedHoldingsCount < holdings.length) {
    status = "partial";
    notes.push(`Rough value is available for ${pricedHoldingsCount} of ${holdings.length} balances.`);
  }

  if (holdings.length === 0) {
    notes.push("No positive live balances were discovered for this address.");
  }

  return finalizePreview({
    walletId: wallet.id,
    provider: "Blockscout",
    status,
    currencyCode,
    fetchedAt: buildFetchedAt(),
    holdings,
    note: notes.join(" "),
    errorMessage: null
  });
}

async function getBitcoinWalletPreview(
  wallet: WalletAddressRecord,
  currencyCode: string
): Promise<WalletLivePreview> {
  let balanceSats: number | null = null;
  let price: number | null = null;
  const notes: string[] = [];
  let status: WalletPreviewStatus = "ready";

  try {
    const response = await fetchJson<MempoolAddressResponse>(
      `${MEMPOOL_API_BASE}/address/${wallet.address}`
    );

    balanceSats =
      response.chain_stats.funded_txo_sum -
      response.chain_stats.spent_txo_sum +
      response.mempool_stats.funded_txo_sum -
      response.mempool_stats.spent_txo_sum;
  } catch {
    return finalizePreview({
      walletId: wallet.id,
      provider: "mempool.space",
      status: "error",
      currencyCode,
      fetchedAt: buildFetchedAt(),
      holdings: [],
      note: "The wallet is still saved, but the live Bitcoin request failed for this address.",
      errorMessage: "Unable to load live Bitcoin balance right now."
    });
  }

  try {
    const priceMap = await getCoinGeckoSimplePrices(["bitcoin"], currencyCode);
    price = priceMap.get("bitcoin") ?? null;
  } catch {
    status = "partial";
    notes.push("Balance loaded, but live BTC pricing is unavailable right now.");
  }

  const balance = balanceSats !== null ? balanceSats / 100_000_000 : null;
  const holdings: WalletHoldingPreview[] =
    balance !== null && balance > 0
      ? [
          {
            id: `${wallet.id}:btc`,
            symbol: "BTC",
            name: "Bitcoin",
            balance,
            price,
            value: balance !== null && price !== null ? balance * price : null,
            currencyCode,
            contractAddress: null,
            iconUrl: null,
            isNative: true
          }
        ]
      : [];

  if (holdings.length === 0) {
    notes.push("No BTC balance is currently associated with this address.");
  }

  return finalizePreview({
    walletId: wallet.id,
    provider: "mempool.space + CoinGecko",
    status,
    currencyCode,
    fetchedAt: buildFetchedAt(),
    holdings,
    note: notes.join(" "),
    errorMessage: null
  });
}

async function getSolanaWalletPreview(
  wallet: WalletAddressRecord,
  currencyCode: string
): Promise<WalletLivePreview> {
  const notes: string[] = [];
  let status: WalletPreviewStatus = "ready";
  let nativeLamports: number | null = null;
  let nativePrice: number | null = null;
  const holdings: WalletHoldingPreview[] = [];

  const [nativeResult, tokenAccountsResult] = await Promise.allSettled([
    postJson<SolanaRpcResponse<SolanaBalanceResult>>(SOLANA_RPC_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [wallet.address, { commitment: "finalized" }]
    }),
    postJson<SolanaRpcResponse<SolanaTokenAccountsResult>>(SOLANA_RPC_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        wallet.address,
        {
          programId: SOLANA_TOKEN_PROGRAM_ID
        },
        {
          commitment: "finalized",
          encoding: "jsonParsed"
        }
      ]
    })
  ]);

  if (nativeResult.status === "rejected" && tokenAccountsResult.status === "rejected") {
    return finalizePreview({
      walletId: wallet.id,
      provider: "Solana RPC + CoinGecko",
      status: "error",
      currencyCode,
      fetchedAt: buildFetchedAt(),
      holdings: [],
      note: "The wallet is still saved, but the live Solana request failed for this address.",
      errorMessage: "Unable to load live Solana balances right now."
    });
  }

  if (nativeResult.status === "fulfilled" && !nativeResult.value.error) {
    nativeLamports = nativeResult.value.result?.value ?? null;
  } else {
    status = "partial";
    notes.push("Native SOL balance is unavailable right now.");
  }

  try {
    const priceMap = await getCoinGeckoSimplePrices(["solana"], currencyCode);
    nativePrice = priceMap.get("solana") ?? null;
  } catch {
    status = "partial";
    notes.push("Native SOL balance loaded, but live SOL pricing is unavailable right now.");
  }

  const nativeBalance = nativeLamports !== null ? nativeLamports / 1_000_000_000 : null;

  if (nativeBalance !== null && nativeBalance > 0) {
    holdings.push({
      id: `${wallet.id}:sol`,
      symbol: "SOL",
      name: "Solana",
      balance: nativeBalance,
      price: nativePrice,
      value: nativeBalance !== null && nativePrice !== null ? nativeBalance * nativePrice : null,
      currencyCode,
      contractAddress: null,
      iconUrl: null,
      isNative: true
    });
  }

  if (tokenAccountsResult.status === "fulfilled" && !tokenAccountsResult.value.error) {
    const tokenAccounts = tokenAccountsResult.value.result?.value ?? [];
    const tokenBalancesByMint = new Map<string, number>();

    for (const account of tokenAccounts) {
      const info = account.account.data?.parsed?.info;
      const mint = typeof info?.mint === "string" ? info.mint : null;
      const uiAmountString = info?.tokenAmount?.uiAmountString;
      const amount = uiAmountString ? toNumber(uiAmountString) : null;
      const parsedAmount =
        amount ??
        parseIntegerAmount(info?.tokenAmount?.amount, info?.tokenAmount?.decimals);

      if (!mint || parsedAmount === null || parsedAmount <= 0) {
        continue;
      }

      tokenBalancesByMint.set(mint, (tokenBalancesByMint.get(mint) ?? 0) + parsedAmount);
    }

    const solanaMints = Array.from(tokenBalancesByMint.keys());

    if (solanaMints.length > 0) {
      let tokenPriceMap = new Map<string, number>();
      let tokenCatalog = new Map<string, SolanaCatalogRecord>();

      try {
        const [prices, catalog] = await Promise.all([
          getCoinGeckoTokenPrices("solana", solanaMints, currencyCode),
          getCoinGeckoSolanaCatalog()
        ]);

        tokenPriceMap = prices;
        tokenCatalog = catalog;
      } catch {
        status = "partial";
        notes.push("SPL token balances loaded, but token pricing metadata is partially unavailable.");
      }

      for (const mint of solanaMints) {
        const balance = tokenBalancesByMint.get(mint) ?? 0;
        const catalogRecord = tokenCatalog.get(mint);
        const price = tokenPriceMap.get(mint) ?? null;

        holdings.push({
          id: `${wallet.id}:${mint}`,
          symbol: catalogRecord?.symbol || "SPL",
          name: catalogRecord?.name || "Unmapped SPL Token",
          balance,
          price,
          value: price !== null ? balance * price : null,
          currencyCode,
          contractAddress: mint,
          iconUrl: null,
          isNative: false
        });
      }

      const pricedTokenCount = solanaMints.filter((mint) => tokenPriceMap.has(mint)).length;

      if (pricedTokenCount < solanaMints.length) {
        status = "partial";
        notes.push(
          `Rough value is available for ${pricedTokenCount} of ${solanaMints.length} SPL balances.`
        );
      }
    }
  } else {
    status = "partial";
    notes.push("SPL token balances are unavailable right now.");
  }

  if (holdings.length === 0) {
    notes.push("No positive SOL or SPL balances were discovered for this address.");
  }

  return finalizePreview({
    walletId: wallet.id,
    provider: "Solana RPC + CoinGecko",
    status,
    currencyCode,
    fetchedAt: buildFetchedAt(),
    holdings,
    note: notes.join(" "),
    errorMessage: null
  });
}

export async function getWalletLivePreview(
  wallet: WalletAddressRecord,
  currencyCode = DEFAULT_PREVIEW_CURRENCY
) {
  const normalizedCurrency = currencyCode.toLowerCase();

  if (!wallet.isActive) {
    return finalizePreview({
      walletId: wallet.id,
      provider: "Saved wallet record",
      status: "inactive",
      currencyCode: normalizedCurrency,
      fetchedAt: buildFetchedAt(),
      holdings: [],
      note: "Inactive wallets stay attached to the portfolio, but they do not fetch live previews.",
      errorMessage: null
    });
  }

  if (!wallet.chain) {
    return finalizePreview({
      walletId: wallet.id,
      provider: "Saved wallet record",
      status: "unsupported",
      currencyCode: normalizedCurrency,
      fetchedAt: buildFetchedAt(),
      holdings: [],
      note: "This wallet is missing chain metadata, so the live preview cannot start yet.",
      errorMessage: null
    });
  }

  if (wallet.chain.family === "evm") {
    return getEvmWalletPreview(wallet, normalizedCurrency);
  }

  if (wallet.chain.family === "bitcoin") {
    return getBitcoinWalletPreview(wallet, normalizedCurrency);
  }

  if (wallet.chain.family === "solana") {
    return getSolanaWalletPreview(wallet, normalizedCurrency);
  }

  return finalizePreview({
    walletId: wallet.id,
    provider: "Saved wallet record",
    status: "unsupported",
    currencyCode: normalizedCurrency,
    fetchedAt: buildFetchedAt(),
    holdings: [],
    note: `${wallet.chain.name} live preview is not wired yet. This wallet record is ready for a future provider.`,
    errorMessage: null
  });
}

export async function getWalletLivePreviews(
  wallets: WalletAddressRecord[],
  currencyCode = DEFAULT_PREVIEW_CURRENCY
) {
  return Promise.all(wallets.map((wallet) => getWalletLivePreview(wallet, currencyCode)));
}

export function getWalletLivePreviewSummary(previews: WalletLivePreview[]): WalletLivePreviewSummary {
  const previewedWalletCount = previews.filter(
    (preview) => preview.status === "ready" || preview.status === "partial"
  ).length;
  const readyWalletCount = previews.filter((preview) => preview.status === "ready").length;
  const partialWalletCount = previews.filter((preview) => preview.status === "partial").length;
  const errorWalletCount = previews.filter((preview) => preview.status === "error").length;
  const unsupportedWalletCount = previews.filter(
    (preview) => preview.status === "unsupported"
  ).length;
  const totalValue = sumValues(previews.map((preview) => preview.totalValue));

  return {
    previewedWalletCount,
    readyWalletCount,
    partialWalletCount,
    errorWalletCount,
    unsupportedWalletCount,
    totalValue
  };
}
