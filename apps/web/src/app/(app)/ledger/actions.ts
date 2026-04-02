"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedContext } from "@/lib/auth";
import { resolveOrCreateLedgerAsset } from "@/lib/asset-resolution";
import { getActiveChains } from "@/lib/catalog";
import { buildPathWithNotice } from "@/lib/flash";
import {
  buildManualDedupeHash,
  buildManualSourcePayload,
  buildOccurredAtIso,
  type ManualLedgerMutationInput
} from "@/lib/ledger";
import { getTxidNetworkByKey } from "@/lib/txid";

const decimalPattern = /^\d+(?:\.\d+)?$/;

const optionalUuidSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : trimmedValue;
}, z.string().uuid().optional());

const coinSelectionSchema = z.object({
  assetId: optionalUuidSchema,
  coinMarketId: z.string().trim().optional().default(""),
  coinName: z.string().trim().min(1, "Choose a coin before saving."),
  coinSymbol: z.string().trim().max(32).optional().default("")
});

const manualEntrySchema = coinSelectionSchema.extend({
  portfolioId: z.string().uuid("Choose a portfolio before saving a transaction."),
  entryId: optionalUuidSchema,
  entryType: z.enum(["buy", "sell"]),
  occurredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid transaction date."),
  occurredTime: z
    .string()
    .optional()
    .default("")
    .refine((value) => value === "" || /^\d{2}:\d{2}$/.test(value), "Time must use HH:MM format."),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required.")
    .regex(decimalPattern, "Quantity must be a valid positive number.")
    .refine((value) => Number(value) > 0, "Quantity must be greater than 0."),
  unitPrice: z
    .string()
    .trim()
    .min(1, "Unit price is required.")
    .regex(decimalPattern, "Unit price must be a valid number.")
    .refine((value) => Number(value) >= 0, "Unit price must be 0 or greater."),
  feeValue: z
    .string()
    .trim()
    .optional()
    .default("0")
    .transform((value) => (value === "" ? "0" : value))
    .refine((value) => decimalPattern.test(value), "Fee must be a valid number.")
    .refine((value) => Number(value) >= 0, "Fee must be 0 or greater."),
  currencyCode: z
    .string()
    .trim()
    .min(3, "A portfolio currency is required.")
    .max(10),
  txHash: z.string().trim().max(255).optional().default(""),
  externalRef: z.string().trim().max(255).optional().default(""),
  notes: z.string().trim().max(1000).optional().default("")
});

const txidEntrySchema = manualEntrySchema.extend({
  networkKey: z.string().trim().min(1, "Choose a network before saving."),
  transactionHash: z.string().trim().min(1, "Enter a transaction hash before saving.")
});

type ParsedManualEntry = z.infer<typeof manualEntrySchema>;
type ParsedTxidEntry = z.infer<typeof txidEntrySchema>;

function getGrossValue(quantity: string, unitPrice: string) {
  return (Number(quantity) * Number(unitPrice)).toString();
}

function buildMutationInput(
  parsed: ParsedManualEntry | ParsedTxidEntry,
  resolvedAsset: {
    id: string;
    symbol: string;
    name: string;
    coingeckoId: string | null;
  },
  chainId: string | null,
  txHashValue?: string
): ManualLedgerMutationInput {
  return {
    portfolioId: parsed.portfolioId,
    chainId,
    assetId: resolvedAsset.id,
    coinMarketId: resolvedAsset.coingeckoId || parsed.coinMarketId || "",
    coinName: resolvedAsset.name,
    coinSymbol: resolvedAsset.symbol,
    entryType: parsed.entryType,
    quantity: parsed.quantity,
    unitPrice: parsed.unitPrice,
    feeValue: parsed.feeValue,
    currencyCode: parsed.currencyCode.toLowerCase(),
    txHash: txHashValue || parsed.txHash,
    externalRef: parsed.externalRef,
    notes: parsed.notes,
    occurredDate: parsed.occurredDate,
    occurredTime: parsed.occurredTime,
    occurredAt: buildOccurredAtIso(parsed.occurredDate, parsed.occurredTime)
  };
}

async function validatePortfolioAccess(portfolioId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("portfolios")
    .select("id")
    .eq("id", portfolioId)
    .maybeSingle();

  return {
    supabase,
    hasAccess: Boolean(data && !error)
  };
}

function redirectToLedgerWithError(message: string, path = "/ledger/add"): never {
  redirect(
    buildPathWithNotice(path, {
      error: message
    })
  );
}

async function insertSourceAndLedgerEntry(args: {
  supabase: Awaited<ReturnType<typeof requireAuthenticatedContext>>["supabase"];
  input: ManualLedgerMutationInput;
  sourceType: "manual" | "txid";
  sourceProvider: string;
  sourceExternalId: string;
  sourcePayload: Record<string, unknown>;
}) {
  const dedupeHash = buildManualDedupeHash(args.input);
  const { data: sourceRecord, error: sourceError } = await args.supabase
    .from("source_records")
    .insert({
      portfolio_id: args.input.portfolioId,
      source_type: args.sourceType,
      source_provider: args.sourceProvider,
      external_id: args.sourceExternalId,
      fingerprint: dedupeHash,
      raw_payload: args.sourcePayload,
      observed_at: args.input.occurredAt
    })
    .select("id")
    .single();

  if (sourceError || !sourceRecord) {
    throw new Error(sourceError?.message || "Unable to save the source record.");
  }

  const { error: ledgerError } = await args.supabase.from("ledger_entries").insert({
    portfolio_id: args.input.portfolioId,
    source_record_id: sourceRecord.id,
    chain_id: args.input.chainId,
    asset_id: args.input.assetId,
    entry_type: args.input.entryType,
    quantity: args.input.quantity,
    unit_price: args.input.unitPrice,
    gross_value: getGrossValue(args.input.quantity, args.input.unitPrice),
    fee_value: args.input.feeValue,
    currency_code: args.input.currencyCode,
    tx_hash: args.input.txHash || null,
    external_ref: args.input.externalRef || null,
    notes: args.input.notes || null,
    dedupe_hash: dedupeHash,
    occurred_at: args.input.occurredAt
  });

  if (ledgerError) {
    await args.supabase.from("source_records").delete().eq("id", sourceRecord.id);
    throw new Error(ledgerError.message || "Unable to save the ledger entry.");
  }
}

export async function createManualLedgerEntryAction(formData: FormData) {
  const parsed = manualEntrySchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    assetId: formData.get("assetId"),
    coinMarketId: formData.get("coinMarketId"),
    coinName: formData.get("coinName"),
    coinSymbol: formData.get("coinSymbol"),
    entryType: formData.get("entryType"),
    occurredDate: formData.get("occurredDate"),
    occurredTime: formData.get("occurredTime"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    feeValue: formData.get("feeValue"),
    currencyCode: formData.get("currencyCode"),
    txHash: formData.get("txHash"),
    externalRef: formData.get("externalRef"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    redirectToLedgerWithError(parsed.error.issues[0]?.message || "Unable to save that transaction.", "/ledger/add?mode=manual");
  }

  const [{ supabase, hasAccess }, resolvedAsset] = await Promise.all([
    validatePortfolioAccess(parsed.data.portfolioId),
    resolveOrCreateLedgerAsset({
      assetId: parsed.data.assetId,
      coinMarketId: parsed.data.coinMarketId,
      coinName: parsed.data.coinName,
      coinSymbol: parsed.data.coinSymbol
    })
  ]);

  if (!hasAccess) {
    redirectToLedgerWithError("The active portfolio could not be accessed.", "/ledger/add?mode=manual");
  }

  const input = buildMutationInput(parsed.data, resolvedAsset.asset, null);

  try {
    await insertSourceAndLedgerEntry({
      supabase,
      input,
      sourceType: "manual",
      sourceProvider: "manual-ledger",
      sourceExternalId: crypto.randomUUID(),
      sourcePayload: buildManualSourcePayload(input, null, resolvedAsset.asset)
    });
  } catch (error) {
    redirectToLedgerWithError(
      error instanceof Error ? error.message : "Unable to save the ledger entry.",
      "/ledger/add?mode=manual"
    );
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/ledger", {
      message: "Transaction added to the active portfolio."
    })
  );
}

export async function updateManualLedgerEntryAction(formData: FormData) {
  const parsed = manualEntrySchema.safeParse({
    entryId: formData.get("entryId"),
    portfolioId: formData.get("portfolioId"),
    assetId: formData.get("assetId"),
    coinMarketId: formData.get("coinMarketId"),
    coinName: formData.get("coinName"),
    coinSymbol: formData.get("coinSymbol"),
    entryType: formData.get("entryType"),
    occurredDate: formData.get("occurredDate"),
    occurredTime: formData.get("occurredTime"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    feeValue: formData.get("feeValue"),
    currencyCode: formData.get("currencyCode"),
    txHash: formData.get("txHash"),
    externalRef: formData.get("externalRef"),
    notes: formData.get("notes")
  });

  if (!parsed.success || !parsed.data.entryId) {
    redirectToLedgerWithError(
      parsed.success ? "Choose a valid transaction to update." : parsed.error.issues[0]?.message || "Unable to update that transaction.",
      "/ledger/add?mode=manual"
    );
  }

  const [{ supabase, hasAccess }, resolvedAsset] = await Promise.all([
    validatePortfolioAccess(parsed.data.portfolioId),
    resolveOrCreateLedgerAsset({
      assetId: parsed.data.assetId,
      coinMarketId: parsed.data.coinMarketId,
      coinName: parsed.data.coinName,
      coinSymbol: parsed.data.coinSymbol
    })
  ]);

  if (!hasAccess) {
    redirectToLedgerWithError("The active portfolio could not be accessed.", "/ledger");
  }

  const { data: existingEntry, error: existingEntryError } = await supabase
    .from("ledger_entries")
    .select("id, source_record_id")
    .eq("id", parsed.data.entryId)
    .eq("portfolio_id", parsed.data.portfolioId)
    .maybeSingle();

  if (existingEntryError || !existingEntry) {
    redirectToLedgerWithError(existingEntryError?.message || "That transaction could not be found.", "/ledger");
  }

  const input = buildMutationInput(parsed.data, resolvedAsset.asset, null);
  const dedupeHash = buildManualDedupeHash(input);
  const sourcePayload = buildManualSourcePayload(input, null, resolvedAsset.asset);
  const { error: ledgerError } = await supabase
    .from("ledger_entries")
    .update({
      chain_id: null,
      asset_id: input.assetId,
      entry_type: input.entryType,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      gross_value: getGrossValue(input.quantity, input.unitPrice),
      fee_value: input.feeValue,
      currency_code: input.currencyCode,
      tx_hash: input.txHash || null,
      external_ref: input.externalRef || null,
      notes: input.notes || null,
      dedupe_hash: dedupeHash,
      occurred_at: input.occurredAt
    })
    .eq("id", parsed.data.entryId)
    .eq("portfolio_id", parsed.data.portfolioId);

  if (ledgerError) {
    redirectToLedgerWithError(ledgerError.message || "Unable to update that transaction.", "/ledger");
  }

  if (existingEntry.source_record_id) {
    await supabase
      .from("source_records")
      .update({
        fingerprint: dedupeHash,
        raw_payload: sourcePayload,
        observed_at: input.occurredAt
      })
      .eq("id", existingEntry.source_record_id);
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/ledger", {
      message: "Transaction updated."
    })
  );
}

export async function createTxidLedgerEntryAction(formData: FormData) {
  const parsed = txidEntrySchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    assetId: formData.get("assetId"),
    coinMarketId: formData.get("coinMarketId"),
    coinName: formData.get("coinName"),
    coinSymbol: formData.get("coinSymbol"),
    networkKey: formData.get("networkKey"),
    transactionHash: formData.get("transactionHash"),
    entryType: formData.get("entryType"),
    occurredDate: formData.get("occurredDate"),
    occurredTime: formData.get("occurredTime"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    feeValue: formData.get("feeValue"),
    currencyCode: formData.get("currencyCode"),
    notes: formData.get("notes"),
    txHash: formData.get("transactionHash"),
    externalRef: formData.get("networkKey")
  });

  if (!parsed.success) {
    redirectToLedgerWithError(parsed.error.issues[0]?.message || "Unable to save that TXID transaction.", "/ledger/add?mode=txid");
  }

  const networkConfig = getTxidNetworkByKey(parsed.data.networkKey);

  if (!networkConfig) {
    redirectToLedgerWithError("Choose a supported network before saving.", "/ledger/add?mode=txid");
  }

  const [{ supabase, hasAccess }, resolvedAsset, activeChains] = await Promise.all([
    validatePortfolioAccess(parsed.data.portfolioId),
    resolveOrCreateLedgerAsset({
      assetId: parsed.data.assetId,
      coinMarketId: parsed.data.coinMarketId,
      coinName: parsed.data.coinName,
      coinSymbol: parsed.data.coinSymbol
    }),
    getActiveChains()
  ]);

  if (!hasAccess) {
    redirectToLedgerWithError("The active portfolio could not be accessed.", "/ledger/add?mode=txid");
  }

  const chain = activeChains.find((activeChain) => activeChain.slug === networkConfig.chainSlug) || null;

  if (!chain) {
    redirectToLedgerWithError(`${networkConfig.label} is not configured as an active chain yet.`, "/ledger/add?mode=txid");
  }

  const input = buildMutationInput(parsed.data, resolvedAsset.asset, chain.id, parsed.data.transactionHash);

  try {
    await insertSourceAndLedgerEntry({
      supabase,
      input,
      sourceType: "txid",
      sourceProvider: networkConfig.key,
      sourceExternalId: parsed.data.transactionHash,
      sourcePayload: {
        ...buildManualSourcePayload(input, chain, resolvedAsset.asset),
        flow: "txid-ledger",
        networkKey: networkConfig.key,
        networkLabel: networkConfig.label,
        lookupMethod: "review-before-save"
      }
    });
  } catch (error) {
    redirectToLedgerWithError(
      error instanceof Error ? error.message : "Unable to save that TXID transaction.",
      "/ledger/add?mode=txid"
    );
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/ledger", {
      message: "Transaction added from TXID review."
    })
  );
}

export async function deleteManualLedgerEntryAction(formData: FormData) {
  const entryId = z.string().uuid().safeParse(formData.get("entryId"));
  const portfolioId = z.string().uuid().safeParse(formData.get("portfolioId"));

  if (!entryId.success || !portfolioId.success) {
    redirect(
      buildPathWithNotice("/ledger", {
        error: "Choose a valid transaction to delete."
      })
    );
  }

  const { supabase, hasAccess } = await validatePortfolioAccess(portfolioId.data);

  if (!hasAccess) {
    redirect(
      buildPathWithNotice("/ledger", {
        error: "The active portfolio could not be accessed."
      })
    );
  }

  const { data: existingEntry, error: existingEntryError } = await supabase
    .from("ledger_entries")
    .select("id, source_record_id")
    .eq("id", entryId.data)
    .eq("portfolio_id", portfolioId.data)
    .maybeSingle();

  if (existingEntryError || !existingEntry) {
    redirect(
      buildPathWithNotice("/ledger", {
        error: existingEntryError?.message || "That transaction could not be found."
      })
    );
  }

  const { error: deleteError } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("id", entryId.data)
    .eq("portfolio_id", portfolioId.data);

  if (deleteError) {
    redirect(
      buildPathWithNotice("/ledger", {
        error: deleteError.message || "Unable to delete that transaction."
      })
    );
  }

  if (existingEntry.source_record_id) {
    await supabase.from("source_records").delete().eq("id", existingEntry.source_record_id);
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/ledger", {
      message: "Transaction deleted."
    })
  );
}
