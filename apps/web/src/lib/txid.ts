import "server-only";

import { type CoinCatalogEntry } from "@/lib/coingecko";
import { getOrFetchHistoricalPrice } from "@/lib/market-data";

type TxidNetworkConfig = {
  key: string;
  label: string;
  chainSlug: string;
  type: "bitcoin" | "evm" | "solana";
  apiBaseUrl: string;
  aliases: string[];
  nativeSymbols: string[];
  nativeNames: string[];
  nativeMarketIds: string[];
};

const TXID_NETWORK_CONFIGS: TxidNetworkConfig[] = [
  {
    key: "bitcoin",
    label: "Bitcoin",
    chainSlug: "bitcoin",
    type: "bitcoin",
    apiBaseUrl: "https://mempool.space/api",
    aliases: ["btc", "bitcoin mainnet"],
    nativeSymbols: ["btc"],
    nativeNames: ["bitcoin"],
    nativeMarketIds: ["bitcoin"]
  },
  {
    key: "solana",
    label: "Solana",
    chainSlug: "solana",
    type: "solana",
    apiBaseUrl: "https://solana-rpc.publicnode.com",
    aliases: ["sol", "solana mainnet"],
    nativeSymbols: ["sol"],
    nativeNames: ["solana"],
    nativeMarketIds: ["solana"]
  },
  {
    key: "ethereum",
    label: "Ethereum",
    chainSlug: "ethereum",
    type: "evm",
    apiBaseUrl: "https://eth.blockscout.com",
    aliases: ["eth", "ethereum mainnet"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  },
  {
    key: "base",
    label: "Base",
    chainSlug: "base",
    type: "evm",
    apiBaseUrl: "https://base.blockscout.com",
    aliases: ["base mainnet"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  },
  {
    key: "arbitrum",
    label: "Arbitrum",
    chainSlug: "arbitrum",
    type: "evm",
    apiBaseUrl: "https://arbitrum.blockscout.com",
    aliases: ["arb", "arbitrum one"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  },
  {
    key: "optimism",
    label: "Optimism",
    chainSlug: "optimism",
    type: "evm",
    apiBaseUrl: "https://optimism.blockscout.com",
    aliases: ["op", "optimism mainnet"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  },
  {
    key: "polygon",
    label: "Polygon",
    chainSlug: "polygon",
    type: "evm",
    apiBaseUrl: "https://polygon.blockscout.com",
    aliases: ["matic", "pol", "polygon pos"],
    nativeSymbols: ["matic", "pol"],
    nativeNames: ["polygon", "matic", "polygon ecosystem token"],
    nativeMarketIds: ["matic-network", "polygon-ecosystem-token"]
  },
  {
    key: "gnosis",
    label: "Gnosis",
    chainSlug: "gnosis",
    type: "evm",
    apiBaseUrl: "https://gnosis.blockscout.com",
    aliases: ["xdai", "gnosis chain", "xdai chain"],
    nativeSymbols: ["xdai"],
    nativeNames: ["xdai"],
    nativeMarketIds: ["xdai"]
  },
  {
    key: "scroll",
    label: "Scroll",
    chainSlug: "scroll",
    type: "evm",
    apiBaseUrl: "https://scroll.blockscout.com",
    aliases: ["scroll mainnet"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  }
];

type TxidFetchError = Error & {
  code?: string;
};

type SolanaTokenBalanceEntry = {
  owner: string;
  mint: string;
  decimals: number;
  preAmount: bigint;
  postAmount: bigint;
  change: bigint;
};

export type SupportedTxidNetwork = {
  key: string;
  label: string;
  chainSlug: string;
};

export type TxidPrefillResult = {
  networkKey: string;
  networkLabel: string;
  normalizedHash: string;
  transactionDate: string;
  coinPrice: string;
  quantity: string;
  commission: string;
  reviewBadge: string;
  reviewMessage: string;
  lookupMessage: string;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function slugifyValue(value: string | null | undefined) {
  return normalizeText(value)
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

function formatDateForInput(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInputDateFromTimestampValue(value: string | number | null | undefined) {
  const timestampMs = getTimestampMs(value);
  return timestampMs ? formatDateForInput(new Date(timestampMs)) : "";
}

function parseIntegerStringToBigInt(value: string | number | bigint | null | undefined) {
  try {
    if (typeof value === "bigint") {
      return value;
    }

    return BigInt(`${value ?? 0}`.trim() || "0");
  } catch {
    return 0n;
  }
}

function formatUnitsFromIntegerString(value: string | number | bigint | null | undefined, decimals = 0) {
  const rawValue = parseIntegerStringToBigInt(value);
  const normalizedDecimals = Math.max(0, Number(decimals) || 0);

  if (normalizedDecimals === 0) {
    return rawValue.toString();
  }

  const divisor = 10n ** BigInt(normalizedDecimals);
  const whole = rawValue / divisor;
  const fractional = (rawValue % divisor)
    .toString()
    .padStart(normalizedDecimals, "0")
    .replace(/0+$/g, "");

  return fractional ? `${whole}.${fractional}` : whole.toString();
}

function roundDecimalString(value: string | number, fractionDigits = 8) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toFixed(fractionDigits);
}

function formatTxidPrefillDecimal(value: string | number) {
  return roundDecimalString(value, 8);
}

function createTxidFetchError(message: string, code = "txid-fetch") {
  const error = new Error(message) as TxidFetchError;
  error.code = code;
  return error;
}

function getCoinMatchMetadata(entry: CoinCatalogEntry) {
  return {
    marketId: entry.marketId.toLowerCase(),
    symbol: entry.symbol.toLowerCase(),
    name: normalizeText(entry.name),
    coinSlug: slugifyValue(entry.name)
  };
}

function isNativeCoinForNetwork(entry: CoinCatalogEntry, networkConfig: TxidNetworkConfig) {
  const metadata = getCoinMatchMetadata(entry);

  return (
    networkConfig.nativeMarketIds.includes(metadata.marketId) ||
    networkConfig.nativeSymbols.includes(metadata.symbol) ||
    networkConfig.nativeNames.includes(metadata.name) ||
    networkConfig.nativeMarketIds.includes(metadata.coinSlug)
  );
}

function normalizeTxidHashForNetwork(transactionHash: string, networkConfig: TxidNetworkConfig) {
  const trimmedHash = transactionHash.trim();

  if (networkConfig.type === "evm") {
    const normalizedHash = /^0x/i.test(trimmedHash) ? trimmedHash : `0x${trimmedHash}`;

    if (!/^0x[a-fA-F0-9]{64}$/.test(normalizedHash)) {
      throw createTxidFetchError(
        `${networkConfig.label} transaction hashes must be 64 hex characters.`,
        "invalid-hash"
      );
    }

    return normalizedHash;
  }

  const normalizedHash = trimmedHash.replace(/^0x/i, "");

  if (networkConfig.type === "bitcoin" && !/^[a-fA-F0-9]{64}$/.test(normalizedHash)) {
    throw createTxidFetchError("Bitcoin transaction hashes must be 64 hex characters.", "invalid-hash");
  }

  if (networkConfig.type === "solana" && !/^[1-9A-HJ-NP-Za-km-z]{32,100}$/.test(trimmedHash)) {
    throw createTxidFetchError("Solana transaction signatures must be valid base58 strings.", "invalid-hash");
  }

  return networkConfig.type === "solana" ? trimmedHash : normalizedHash.toLowerCase();
}

async function fetchJson<T>(url: string, fallbackMessage: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw createTxidFetchError(`${fallbackMessage} (${response.status}).`);
  }

  return (await response.json()) as T;
}

async function postJson<T>(url: string, body: Record<string, unknown>, fallbackMessage: string) {
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
    throw createTxidFetchError(`${fallbackMessage} (${response.status}).`);
  }

  return (await response.json()) as T;
}

function buildLookupMessage(networkLabel: string, historicalPriceReady: boolean, quantityReady: boolean, currencyCode: string) {
  const fields = ["date"];

  if (historicalPriceReady) {
    fields.push(`historical ${currencyCode.toUpperCase()} price`);
  }

  if (quantityReady) {
    fields.push("quantity");
  }

  return `${networkLabel} lookup prepared ${fields.join(", ")} for review.`;
}

function buildReviewMessage(networkLabel: string, ...notes: Array<string | null | undefined>) {
  const meaningfulNotes = notes.map((note) => (note || "").trim()).filter(Boolean);
  return meaningfulNotes.length
    ? `${networkLabel}: ${meaningfulNotes.join(" ")}`
    : `${networkLabel} transaction data was prepared for review.`;
}

function getBestMatchingTokenTransfer(entry: CoinCatalogEntry, tokenTransfers: Array<Record<string, any>>) {
  const metadata = getCoinMatchMetadata(entry);

  const rankedMatches = tokenTransfers
    .map((tokenTransfer) => {
      const tokenName = normalizeText(tokenTransfer?.token?.name || "");
      const tokenSymbol = normalizeText(tokenTransfer?.token?.symbol || "");
      const tokenSlug = slugifyValue(tokenTransfer?.token?.name || "");
      let score = 0;

      if (metadata.name && tokenName === metadata.name) {
        score = 100;
      } else if (metadata.marketId && tokenSlug === metadata.marketId) {
        score = 96;
      } else if (metadata.coinSlug && tokenSlug === metadata.coinSlug) {
        score = 94;
      } else if (metadata.symbol && tokenSymbol === metadata.symbol) {
        score = 90;
      } else if (metadata.name && tokenName.includes(metadata.name)) {
        score = 72;
      } else if (metadata.symbol && tokenSymbol.includes(metadata.symbol)) {
        score = 68;
      }

      return {
        tokenTransfer,
        score,
        rawAmount: parseIntegerStringToBigInt(tokenTransfer?.total?.value || 0)
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.rawAmount === right.rawAmount) {
        return 0;
      }

      return left.rawAmount > right.rawAmount ? -1 : 1;
    });

  if (!rankedMatches.length) {
    return null;
  }

  return {
    match: rankedMatches[0].tokenTransfer,
    multipleMatches: rankedMatches.length > 1
  };
}

function inferBitcoinTransferQuantity(transactionDetails: any) {
  const outputs = Array.isArray(transactionDetails?.vout)
    ? transactionDetails.vout.filter((output: any) => Number(output?.value) > 0)
    : [];

  if (!outputs.length) {
    return {
      quantity: "",
      note: "Quantity needs review because this Bitcoin transaction has no spendable outputs."
    };
  }

  if (outputs.length === 1) {
    return {
      quantity: formatUnitsFromIntegerString(outputs[0].value, 8),
      note: "Quantity was estimated from the single Bitcoin output."
    };
  }

  const inputAddresses = new Set(
    (Array.isArray(transactionDetails?.vin) ? transactionDetails.vin : [])
      .map((input: any) => input?.prevout?.scriptpubkey_address?.toLowerCase())
      .filter(Boolean)
  );
  const nonChangeOutputs = outputs.filter((output: any) => {
    const outputAddress = output?.scriptpubkey_address?.toLowerCase();
    return outputAddress && !inputAddresses.has(outputAddress);
  });

  if (nonChangeOutputs.length === 1) {
    return {
      quantity: formatUnitsFromIntegerString(nonChangeOutputs[0].value, 8),
      note: "Quantity was estimated from the non-change Bitcoin output."
    };
  }

  return {
    quantity: "",
    note: "Quantity needs review because this Bitcoin transaction has multiple possible outputs."
  };
}

function getSolanaAccountPubkey(account: any) {
  if (typeof account === "string") {
    return account;
  }

  return account?.pubkey || "";
}

function getSolanaPrimarySigner(transactionDetails: any) {
  const accountKeys = Array.isArray(transactionDetails?.transaction?.message?.accountKeys)
    ? transactionDetails.transaction.message.accountKeys
    : [];
  const primarySignerIndex = accountKeys.findIndex((account: any) => account?.signer);
  const fallbackIndex = primarySignerIndex >= 0 ? primarySignerIndex : 0;

  return {
    pubkey: getSolanaAccountPubkey(accountKeys[fallbackIndex]),
    index: fallbackIndex
  };
}

function getSolanaTokenBalanceChangeEntries(transactionDetails: any, mintAddress: string) {
  const normalizedMintAddress = mintAddress.trim();
  const balanceEntries = new Map<string, Omit<SolanaTokenBalanceEntry, "change">>();

  const assignSide = (entries: any[], sideKey: "preAmount" | "postAmount") => {
    (Array.isArray(entries) ? entries : []).forEach((entry, index) => {
      if ((entry?.mint || "").trim() !== normalizedMintAddress) {
        return;
      }

      const accountIndexKey =
        typeof entry.accountIndex === "number"
          ? `${entry.accountIndex}`
          : `${entry?.owner || "unknown-owner"}:${index}`;
      const existing = balanceEntries.get(accountIndexKey) || {
        owner: entry?.owner || "",
        mint: normalizedMintAddress,
        decimals: Number(entry?.uiTokenAmount?.decimals ?? 0) || 0,
        preAmount: 0n,
        postAmount: 0n
      };

      existing.owner = existing.owner || entry?.owner || "";
      existing.decimals = Number(entry?.uiTokenAmount?.decimals ?? existing.decimals ?? 0) || 0;
      existing[sideKey] = parseIntegerStringToBigInt(entry?.uiTokenAmount?.amount || 0);
      balanceEntries.set(accountIndexKey, existing);
    });
  };

  assignSide(transactionDetails?.meta?.preTokenBalances, "preAmount");
  assignSide(transactionDetails?.meta?.postTokenBalances, "postAmount");

  return [...balanceEntries.values()]
    .map((entry) => ({
      ...entry,
      change: entry.postAmount - entry.preAmount
    }))
    .filter((entry) => entry.change !== 0n);
}

function getBigIntAbsolute(value: bigint) {
  return value < 0n ? -value : value;
}

function inferSolanaTokenQuantity(transactionDetails: any, mintAddress: string) {
  const primarySigner = getSolanaPrimarySigner(transactionDetails);
  const tokenChanges = getSolanaTokenBalanceChangeEntries(transactionDetails, mintAddress);

  if (!tokenChanges.length) {
    return null;
  }

  const ownerMatches = primarySigner.pubkey
    ? tokenChanges.filter((entry) => entry.owner === primarySigner.pubkey)
    : [];
  const rankedChanges = (ownerMatches.length ? ownerMatches : tokenChanges).slice().sort((left, right) => {
    const leftAbs = getBigIntAbsolute(left.change);
    const rightAbs = getBigIntAbsolute(right.change);

    if (leftAbs === rightAbs) {
      return 0;
    }

    return leftAbs > rightAbs ? -1 : 1;
  });
  const selectedChange = rankedChanges[0];

  if (!selectedChange) {
    return null;
  }

  return {
    quantity: formatUnitsFromIntegerString(getBigIntAbsolute(selectedChange.change), selectedChange.decimals),
    note:
      ownerMatches.length > 0
        ? "Quantity was prefilled from the selected coin's token balance change for the primary signer."
        : "Quantity was prefilled from the selected coin's token balance change."
  };
}

function inferSolanaNativeQuantity(transactionDetails: any) {
  const wrappedSolQuantity = inferSolanaTokenQuantity(
    transactionDetails,
    "So11111111111111111111111111111111111111112"
  );

  if (wrappedSolQuantity) {
    return {
      quantity: wrappedSolQuantity.quantity,
      note: "Quantity was prefilled from wrapped SOL movement in the transaction."
    };
  }

  const primarySigner = getSolanaPrimarySigner(transactionDetails);
  const preBalances = Array.isArray(transactionDetails?.meta?.preBalances) ? transactionDetails.meta.preBalances : [];
  const postBalances = Array.isArray(transactionDetails?.meta?.postBalances) ? transactionDetails.meta.postBalances : [];
  const signerIndex = primarySigner.index;

  if (signerIndex < 0 || signerIndex >= preBalances.length || signerIndex >= postBalances.length) {
    return {
      quantity: "",
      note: "Quantity needs review because a signer balance change could not be determined on Solana."
    };
  }

  const fee = BigInt(Number(transactionDetails?.meta?.fee) || 0);
  const preBalance = BigInt(Number(preBalances[signerIndex]) || 0);
  const postBalance = BigInt(Number(postBalances[signerIndex]) || 0);
  const delta = postBalance - preBalance;
  let movement = 0n;

  if (delta < 0n) {
    movement = getBigIntAbsolute(delta) > fee ? getBigIntAbsolute(delta) - fee : 0n;
  } else if (delta > 0n) {
    movement = delta + fee;
  }

  if (movement <= 0n) {
    return {
      quantity: "",
      note: "Quantity needs review because this Solana transaction does not show a clear SOL movement."
    };
  }

  return {
    quantity: formatUnitsFromIntegerString(movement, 9),
    note: "Quantity was estimated from the signer's SOL balance change."
  };
}

async function fetchBitcoinTxidPrefill(networkConfig: TxidNetworkConfig, transactionHash: string, coin: CoinCatalogEntry, currencyCode: string) {
  const transactionDetails = await fetchJson<any>(
    `${networkConfig.apiBaseUrl}/tx/${transactionHash}`,
    `Could not load ${networkConfig.label} transaction data`
  );
  const isConfirmed = Boolean(transactionDetails?.status?.confirmed);
  const transactionTimestampMs = getTimestampMs(transactionDetails?.status?.block_time);
  const quantityEstimate = isNativeCoinForNetwork(coin, networkConfig)
    ? inferBitcoinTransferQuantity(transactionDetails)
    : {
        quantity: "",
        note: `${coin.name} is not the native asset on ${networkConfig.label}, so quantity needs review.`
      };
  const historicalPrice = await getOrFetchHistoricalPrice(coin, transactionTimestampMs, currencyCode);

  return {
    networkKey: networkConfig.key,
    networkLabel: networkConfig.label,
    normalizedHash: transactionHash,
    transactionDate: isConfirmed ? getInputDateFromTimestampValue(transactionDetails?.status?.block_time) : formatDateForInput(new Date()),
    coinPrice: historicalPrice.price,
    quantity: formatTxidPrefillDecimal(quantityEstimate.quantity),
    commission: formatTxidPrefillDecimal(formatUnitsFromIntegerString(transactionDetails?.fee || 0, 8)),
    reviewBadge: "Live Fetch",
    reviewMessage: buildReviewMessage(
      networkConfig.label,
      quantityEstimate.note,
      historicalPrice.note,
      isConfirmed ? "" : "This Bitcoin transaction is still unconfirmed, so please review it carefully."
    ),
    lookupMessage: buildLookupMessage(
      networkConfig.label,
      historicalPrice.status === "ready",
      Boolean(quantityEstimate.quantity),
      currencyCode
    )
  } satisfies TxidPrefillResult;
}

async function fetchEvmTxidPrefill(networkConfig: TxidNetworkConfig, transactionHash: string, coin: CoinCatalogEntry, currencyCode: string) {
  const transactionDetails = await fetchJson<any>(
    `${networkConfig.apiBaseUrl}/api/v2/transactions/${transactionHash}`,
    `Could not load ${networkConfig.label} transaction data`
  );
  let tokenTransfers = Array.isArray(transactionDetails?.token_transfers) ? transactionDetails.token_transfers : [];

  if (transactionDetails?.token_transfers_overflow) {
    const transferPayload = await fetchJson<{ items?: Array<Record<string, any>> }>(
      `${networkConfig.apiBaseUrl}/api/v2/transactions/${transactionHash}/token-transfers`,
      `Could not load ${networkConfig.label} token transfer details`
    );
    tokenTransfers = Array.isArray(transferPayload.items) ? transferPayload.items : tokenTransfers;
  }

  const matchedTokenTransfer = getBestMatchingTokenTransfer(coin, tokenTransfers);
  const isNativeCoin = isNativeCoinForNetwork(coin, networkConfig);
  let quantity = "";
  let quantityNote = "";

  if (matchedTokenTransfer?.match) {
    const tokenTransfer = matchedTokenTransfer.match;
    const tokenDecimals = Number(tokenTransfer?.total?.decimals ?? tokenTransfer?.token?.decimals ?? 18);
    quantity = formatUnitsFromIntegerString(tokenTransfer?.total?.value || 0, tokenDecimals);
    quantityNote = matchedTokenTransfer.multipleMatches
      ? `Quantity was prefilled from the strongest matching ${tokenTransfer?.token?.symbol || "token"} transfer.`
      : `Quantity was prefilled from the matching ${tokenTransfer?.token?.symbol || "token"} transfer.`;
  } else if (isNativeCoin && parseIntegerStringToBigInt(transactionDetails?.value || 0) > 0n) {
    quantity = formatUnitsFromIntegerString(transactionDetails?.value || 0, 18);
    quantityNote = `Quantity was prefilled from the native ${networkConfig.label} transfer value.`;
  } else {
    quantityNote = `${coin.name} was not matched to a clear on-chain transfer in this ${networkConfig.label} transaction.`;
  }

  const transactionTimestampMs = getTimestampMs(transactionDetails?.timestamp);
  const historicalPrice = await getOrFetchHistoricalPrice(coin, transactionTimestampMs, currencyCode);

  return {
    networkKey: networkConfig.key,
    networkLabel: networkConfig.label,
    normalizedHash: transactionHash,
    transactionDate: getInputDateFromTimestampValue(transactionDetails?.timestamp) || formatDateForInput(new Date()),
    coinPrice: historicalPrice.price,
    quantity: formatTxidPrefillDecimal(quantity),
    commission: formatTxidPrefillDecimal(formatUnitsFromIntegerString(transactionDetails?.fee?.value || 0, 18)),
    reviewBadge: "Live Fetch",
    reviewMessage: buildReviewMessage(
      networkConfig.label,
      quantityNote,
      historicalPrice.note,
      transactionDetails?.status === "ok" || transactionDetails?.result === "success"
        ? ""
        : "Explorer data marks this transaction as failed or reverted."
    ),
    lookupMessage: buildLookupMessage(
      networkConfig.label,
      historicalPrice.status === "ready",
      Boolean(quantity),
      currencyCode
    )
  } satisfies TxidPrefillResult;
}

async function fetchSolanaTxidPrefill(networkConfig: TxidNetworkConfig, transactionHash: string, coin: CoinCatalogEntry, currencyCode: string) {
  const response = await postJson<{ result?: any; error?: { message?: string } }>(
    networkConfig.apiBaseUrl,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [
        transactionHash,
        {
          encoding: "jsonParsed",
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0
        }
      ]
    },
    `Could not load ${networkConfig.label} transaction data`
  );

  if (response.error) {
    throw createTxidFetchError(response.error.message || `Could not load ${networkConfig.label} transaction data`);
  }

  if (!response.result) {
    throw createTxidFetchError(`That transaction hash was not found on ${networkConfig.label}.`, "not-found");
  }

  const transactionDetails = response.result;
  const isNativeCoin = isNativeCoinForNetwork(coin, networkConfig);
  let quantityEstimate =
    isNativeCoin
      ? inferSolanaNativeQuantity(transactionDetails)
      : null;

  if (!quantityEstimate) {
    const solanaMint = typeof coin.platforms?.solana === "string" ? coin.platforms.solana.trim() : "";

    if (solanaMint) {
      quantityEstimate = inferSolanaTokenQuantity(transactionDetails, solanaMint);
    }
  }

  if (!quantityEstimate) {
    quantityEstimate = {
      quantity: "",
      note: isNativeCoin
        ? "Quantity needs review because this Solana transaction does not show a clear SOL movement."
        : `${coin.name} could not be matched to a clear Solana mint movement in this transaction.`
    };
  }

  const transactionTimestampMs = getTimestampMs(transactionDetails?.blockTime);
  const historicalPrice = await getOrFetchHistoricalPrice(coin, transactionTimestampMs, currencyCode);

  return {
    networkKey: networkConfig.key,
    networkLabel: networkConfig.label,
    normalizedHash: transactionHash,
    transactionDate: getInputDateFromTimestampValue(transactionDetails?.blockTime) || formatDateForInput(new Date()),
    coinPrice: historicalPrice.price,
    quantity: formatTxidPrefillDecimal(quantityEstimate.quantity),
    commission: formatTxidPrefillDecimal(formatUnitsFromIntegerString(transactionDetails?.meta?.fee || 0, 9)),
    reviewBadge: "Live Fetch",
    reviewMessage: buildReviewMessage(
      networkConfig.label,
      quantityEstimate.note,
      historicalPrice.note,
      transactionDetails?.meta?.err ? "Solana marks this transaction as failed." : ""
    ),
    lookupMessage: buildLookupMessage(
      networkConfig.label,
      historicalPrice.status === "ready",
      Boolean(quantityEstimate.quantity),
      currencyCode
    )
  } satisfies TxidPrefillResult;
}

export function getSupportedTxidNetworks() {
  return TXID_NETWORK_CONFIGS.map<SupportedTxidNetwork>((config) => ({
    key: config.key,
    label: config.label,
    chainSlug: config.chainSlug
  }));
}

export function getTxidNetworkByKey(rawNetwork: string) {
  const normalizedNetwork = normalizeText(rawNetwork);
  const normalizedSlug = slugifyValue(rawNetwork);

  return (
    TXID_NETWORK_CONFIGS.find((networkConfig) => {
      const aliases = [networkConfig.key, networkConfig.label, ...(networkConfig.aliases || [])];
      return aliases.some((alias) => {
        return normalizeText(alias) === normalizedNetwork || slugifyValue(alias) === normalizedSlug;
      });
    }) || null
  );
}

export async function prepareTxidPrefill(input: {
  coin: CoinCatalogEntry;
  networkKey: string;
  transactionHash: string;
  currencyCode: string;
}) {
  const networkConfig = getTxidNetworkByKey(input.networkKey);

  if (!networkConfig) {
    throw createTxidFetchError(
      `Live fetch currently supports ${getSupportedTxidNetworks().map((network) => network.label).join(", ")}.`,
      "unsupported-network"
    );
  }

  const normalizedHash = normalizeTxidHashForNetwork(input.transactionHash, networkConfig);

  if (networkConfig.type === "bitcoin") {
    return fetchBitcoinTxidPrefill(networkConfig, normalizedHash, input.coin, input.currencyCode);
  }

  if (networkConfig.type === "evm") {
    return fetchEvmTxidPrefill(networkConfig, normalizedHash, input.coin, input.currencyCode);
  }

  if (networkConfig.type === "solana") {
    return fetchSolanaTxidPrefill(networkConfig, normalizedHash, input.coin, input.currencyCode);
  }

  throw createTxidFetchError(`Live fetch is not configured yet for ${networkConfig.label}.`);
}
