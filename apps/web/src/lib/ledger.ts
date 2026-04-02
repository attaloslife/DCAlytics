import type { AssetOption, ChainOption } from "@/lib/catalog";
import { requireAuthenticatedContext } from "@/lib/auth";
import { toNumber } from "@/lib/format";

type JoinedRecord<T> = T | T[] | null;

type LedgerChainRecord = {
  id: string;
  slug: string;
  name: string;
  native_symbol: string | null;
};

type LedgerAssetRecord = {
  id: string;
  symbol: string;
  name: string;
  coingecko_id: string | null;
};

type LedgerSourceRecord = {
  id: string;
  external_id: string | null;
  raw_payload: Record<string, unknown> | null;
};

type RawLedgerEntryRecord = {
  id: string;
  portfolio_id: string;
  source_record_id: string | null;
  chain_id: string | null;
  asset_id: string;
  entry_type: "buy" | "sell" | "transfer_in" | "transfer_out" | "income" | "fee" | "adjustment";
  quantity: string;
  unit_price: string | null;
  gross_value: string | null;
  fee_value: string;
  currency_code: string;
  tx_hash: string | null;
  external_ref: string | null;
  notes: string | null;
  occurred_at: string;
  created_at: string;
  chains: JoinedRecord<LedgerChainRecord>;
  assets: JoinedRecord<LedgerAssetRecord>;
  source_records: JoinedRecord<LedgerSourceRecord>;
};

export type LedgerEntryRecord = {
  id: string;
  portfolioId: string;
  sourceRecordId: string | null;
  chainId: string | null;
  assetId: string;
  entryType: RawLedgerEntryRecord["entry_type"];
  quantity: string;
  unitPrice: string | null;
  grossValue: string | null;
  feeValue: string;
  currencyCode: string;
  txHash: string | null;
  externalRef: string | null;
  notes: string | null;
  occurredAt: string;
  createdAt: string;
  chain: {
    id: string;
    slug: string;
    name: string;
    nativeSymbol: string | null;
  } | null;
  asset: {
    id: string;
    symbol: string;
    name: string;
    coingeckoId: string | null;
  } | null;
  sourceRecord: {
    id: string;
    externalId: string | null;
    rawPayload: Record<string, unknown> | null;
  } | null;
};

export type LedgerSummary = {
  entryCount: number;
  buyCount: number;
  sellCount: number;
  buyVolume: number;
  sellVolume: number;
  totalFees: number;
};

export type ManualLedgerMutationInput = {
  portfolioId: string;
  chainId: string | null;
  assetId: string;
  coinMarketId: string;
  coinName: string;
  coinSymbol: string;
  entryType: "buy" | "sell";
  quantity: string;
  unitPrice: string;
  feeValue: string;
  currencyCode: string;
  txHash: string;
  externalRef: string;
  notes: string;
  occurredDate: string;
  occurredTime: string;
  occurredAt: string;
};

export type ManualEntryDefaults = {
  entryId: string;
  assetId: string;
  coinMarketId: string;
  coinName: string;
  coinSymbol: string;
  entryType: "buy" | "sell";
  occurredDate: string;
  occurredTime: string;
  quantity: string;
  unitPrice: string | null;
  feeValue: string;
  txHash: string;
  externalRef: string;
  notes: string;
};

function unwrapJoin<T>(value: JoinedRecord<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeLedgerEntry(row: RawLedgerEntryRecord): LedgerEntryRecord {
  const chain = unwrapJoin(row.chains);
  const asset = unwrapJoin(row.assets);
  const sourceRecord = unwrapJoin(row.source_records);

  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    sourceRecordId: row.source_record_id,
    chainId: row.chain_id,
    assetId: row.asset_id,
    entryType: row.entry_type,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    grossValue: row.gross_value,
    feeValue: row.fee_value,
    currencyCode: row.currency_code,
    txHash: row.tx_hash,
    externalRef: row.external_ref,
    notes: row.notes,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    chain: chain
      ? {
          id: chain.id,
          slug: chain.slug,
          name: chain.name,
          nativeSymbol: chain.native_symbol
        }
      : null,
    asset: asset
      ? {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          coingeckoId: asset.coingecko_id
        }
      : null,
    sourceRecord: sourceRecord
      ? {
          id: sourceRecord.id,
          externalId: sourceRecord.external_id,
          rawPayload: sourceRecord.raw_payload
        }
      : null
  };
}

export function getLedgerSummary(entries: LedgerEntryRecord[]): LedgerSummary {
  return entries.reduce<LedgerSummary>(
    (summary, entry) => {
      const grossValue = toNumber(entry.grossValue) ?? 0;
      const feeValue = toNumber(entry.feeValue) ?? 0;

      summary.entryCount += 1;
      summary.totalFees += feeValue;

      if (entry.entryType === "buy") {
        summary.buyCount += 1;
        summary.buyVolume += grossValue;
      }

      if (entry.entryType === "sell") {
        summary.sellCount += 1;
        summary.sellVolume += grossValue;
      }

      return summary;
    },
    {
      entryCount: 0,
      buyCount: 0,
      sellCount: 0,
      buyVolume: 0,
      sellVolume: 0,
      totalFees: 0
    }
  );
}

export function buildManualSourcePayload(
  input: ManualLedgerMutationInput,
  chain: ChainOption | null,
  asset: {
    id?: string;
    symbol: string;
    name: string;
    coingeckoId: string | null;
  } | null
) {
  return {
    flow: "manual-ledger",
    portfolioId: input.portfolioId,
    chainId: input.chainId,
    chainSlug: chain?.slug || null,
    chainName: chain?.name || null,
    assetId: input.assetId,
    assetSymbol: asset?.symbol || input.coinSymbol || null,
    assetName: asset?.name || input.coinName || null,
    assetMarketId: asset?.coingeckoId || input.coinMarketId || null,
    entryType: input.entryType,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    feeValue: input.feeValue,
    currencyCode: input.currencyCode.toLowerCase(),
    txHash: input.txHash || null,
    externalRef: input.externalRef || null,
    notes: input.notes || null,
    occurredDate: input.occurredDate,
    occurredTime: input.occurredTime || null,
    occurredAt: input.occurredAt
  };
}

export function buildManualDedupeHash(input: ManualLedgerMutationInput) {
  return [
    "manual",
    input.portfolioId,
    input.chainId || "",
    input.assetId,
    input.coinMarketId || input.coinName.toLowerCase(),
    input.entryType,
    input.quantity,
    input.unitPrice,
    input.feeValue,
    input.currencyCode.toLowerCase(),
    input.occurredAt,
    input.txHash || "",
    input.externalRef || ""
  ].join("|");
}

export function getManualEntryDefaults(entry: LedgerEntryRecord | null) {
  const sourcePayload =
    entry?.sourceRecord?.rawPayload && typeof entry.sourceRecord.rawPayload === "object"
      ? entry.sourceRecord.rawPayload
      : null;

  const occurredDate =
    typeof sourcePayload?.occurredDate === "string"
      ? sourcePayload.occurredDate
      : entry?.occurredAt
        ? entry.occurredAt.slice(0, 10)
        : "";

  const occurredTime =
    typeof sourcePayload?.occurredTime === "string"
      ? sourcePayload.occurredTime
      : "";

  return {
    entryId: entry?.id || "",
    assetId: entry?.assetId || "",
    coinMarketId: entry?.asset?.coingeckoId || "",
    coinName: entry?.asset?.name || "",
    coinSymbol: entry?.asset?.symbol || "",
    entryType: entry?.entryType === "sell" ? "sell" : "buy",
    occurredDate,
    occurredTime,
    quantity: entry?.quantity || "",
    unitPrice: entry?.unitPrice || "",
    feeValue: entry?.feeValue || "0",
    txHash: entry?.txHash || "",
    externalRef: entry?.externalRef || "",
    notes: entry?.notes || ""
  } satisfies ManualEntryDefaults;
}

export function buildOccurredAtIso(occurredDate: string, occurredTime: string) {
  const [year, month, day] = occurredDate.split("-").map(Number);
  const [hours, minutes] = (occurredTime || "12:00").split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0)).toISOString();
}

export async function getLedgerEntriesForPortfolio(portfolioId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(`
      id,
      portfolio_id,
      source_record_id,
      chain_id,
      asset_id,
      entry_type,
      quantity,
      unit_price,
      gross_value,
      fee_value,
      currency_code,
      tx_hash,
      external_ref,
      notes,
      occurred_at,
      created_at,
      chains!ledger_entries_chain_id_fkey (
        id,
        slug,
        name,
        native_symbol
      ),
      assets!ledger_entries_asset_id_fkey (
        id,
        symbol,
        name,
        coingecko_id
      ),
      source_records!ledger_entries_source_record_id_fkey (
        id,
        external_id,
        raw_payload
      )
    `)
    .eq("portfolio_id", portfolioId)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load ledger entries for portfolio", { portfolioId, error });
    return [];
  }

  return ((data ?? []) as RawLedgerEntryRecord[]).map(normalizeLedgerEntry);
}

export async function getLedgerEntryForEdit(entryId: string, portfolioId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("ledger_entries")
    .select(`
      id,
      portfolio_id,
      source_record_id,
      chain_id,
      asset_id,
      entry_type,
      quantity,
      unit_price,
      gross_value,
      fee_value,
      currency_code,
      tx_hash,
      external_ref,
      notes,
      occurred_at,
      created_at,
      chains!ledger_entries_chain_id_fkey (
        id,
        slug,
        name,
        native_symbol
      ),
      assets!ledger_entries_asset_id_fkey (
        id,
        symbol,
        name,
        coingecko_id
      ),
      source_records!ledger_entries_source_record_id_fkey (
        id,
        external_id,
        raw_payload
      )
    `)
    .eq("id", entryId)
    .eq("portfolio_id", portfolioId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Failed to load ledger entry for edit", { entryId, portfolioId, error });
    }
    return null;
  }

  return normalizeLedgerEntry(data as RawLedgerEntryRecord);
}
