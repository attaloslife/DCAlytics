"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getManualLedgerCatalog } from "@/lib/catalog";
import { requireAuthenticatedContext } from "@/lib/auth";
import { buildPathWithNotice } from "@/lib/flash";
import { detectImportFormat, parseImportFile, prepareImportRows } from "@/lib/imports";
import { buildManualDedupeHash, buildOccurredAtIso } from "@/lib/ledger";

const importTradesSchema = z.object({
  portfolioId: z.string().uuid("Choose a portfolio before importing trades."),
  format: z.enum(["auto", "csv", "json"]).default("auto")
});

function redirectToImportsWithError(message: string): never {
  redirect(
    buildPathWithNotice("/imports", {
      error: message
    })
  );
}

async function getPortfolioAccess(portfolioId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("portfolios")
    .select("id, name, base_currency")
    .eq("id", portfolioId)
    .maybeSingle();

  return {
    supabase,
    portfolio: error || !data ? null : data
  };
}

export async function importTradesAction(formData: FormData) {
  const parsed = importTradesSchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    format: formData.get("format")
  });

  if (!parsed.success) {
    redirectToImportsWithError(parsed.error.issues[0]?.message || "Unable to start the import.");
  }

  const upload = formData.get("file");

  if (!(upload instanceof File) || upload.size === 0) {
    redirectToImportsWithError("Choose a CSV or JSON file to import.");
  }

  const { supabase, portfolio } = await getPortfolioAccess(parsed.data.portfolioId);

  if (!portfolio) {
    redirectToImportsWithError("The active portfolio could not be accessed.");
  }

  const fileText = await upload.text();
  const resolvedFormat = detectImportFormat(upload.name, parsed.data.format);

  const { data: importRecord, error: importRecordError } = await supabase
    .from("imports")
    .insert({
      portfolio_id: portfolio.id,
      file_name: upload.name || `trades.${resolvedFormat}`,
      file_type: resolvedFormat,
      status: "uploaded"
    })
    .select("id")
    .single();

  if (importRecordError || !importRecord) {
    redirectToImportsWithError(importRecordError?.message || "Unable to create the import session.");
  }

  let parsedFileRows: ReturnType<typeof parseImportFile>;

  try {
    parsedFileRows = parseImportFile(upload.name, fileText, parsed.data.format);
  } catch (error) {
    await supabase
      .from("imports")
      .update({
        status: "failed",
        row_count: 0,
        success_count: 0,
        error_count: 1,
        error_summary: error instanceof Error ? error.message : "The import file could not be parsed.",
        completed_at: new Date().toISOString()
      })
      .eq("id", importRecord.id);

    redirectToImportsWithError(error instanceof Error ? error.message : "The import file could not be parsed.");
  }

  const { chains, assets } = await getManualLedgerCatalog();
  const preparedRows = prepareImportRows(parsedFileRows.rows, portfolio.base_currency, chains, assets);

  if (preparedRows.length === 0) {
    await supabase
      .from("imports")
      .update({
        status: "failed",
        row_count: 0,
        success_count: 0,
        error_count: 1,
        error_summary: "The import file did not contain any rows.",
        completed_at: new Date().toISOString()
      })
      .eq("id", importRecord.id);

    redirectToImportsWithError("The import file did not contain any rows.");
  }

  await supabase.from("import_rows").insert(
    preparedRows.map((row) => ({
      import_id: importRecord.id,
      row_number: row.rowNumber,
      raw_payload: row.rawPayload,
      normalized_payload: row.normalizedPayload ?? {},
      status: row.status,
      message: row.message
    }))
  );

  let successCount = 0;
  const rowErrors: Array<{ rowNumber: number; message: string }> = [];

  for (const row of preparedRows) {
    if (row.status !== "accepted" || !row.normalizedPayload) {
      continue;
    }

    const normalized = row.normalizedPayload;
    const matchedAsset =
      assets.find((asset) => asset.chainId === normalized.chainId && asset.assetId === normalized.assetId) || null;
    const occurredAt = buildOccurredAtIso(normalized.occurredDate, normalized.occurredTime);
    const dedupeHash = buildManualDedupeHash({
      portfolioId: portfolio.id,
      chainId: normalized.chainId,
      assetId: normalized.assetId,
      coinMarketId: matchedAsset?.coingeckoId || "",
      coinName: normalized.assetName,
      coinSymbol: normalized.assetSymbol,
      entryType: normalized.entryType,
      quantity: normalized.quantity,
      unitPrice: normalized.unitPrice,
      feeValue: normalized.feeValue,
      currencyCode: normalized.currencyCode,
      txHash: normalized.txHash,
      externalRef: normalized.externalRef,
      notes: normalized.notes,
      occurredDate: normalized.occurredDate,
      occurredTime: normalized.occurredTime,
      occurredAt
    });

    const { data: sourceRecord, error: sourceError } = await supabase
      .from("source_records")
      .insert({
        portfolio_id: portfolio.id,
        source_type: "import",
        source_provider: `file-${parsedFileRows.format}`,
        external_id: `${importRecord.id}:${row.rowNumber}`,
        fingerprint: dedupeHash,
        raw_payload: {
          flow: "import-ledger",
          importId: importRecord.id,
          rowNumber: row.rowNumber,
          original: row.rawPayload,
          normalized
        },
        observed_at: occurredAt
      })
      .select("id")
      .single();

    if (sourceError || !sourceRecord) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        message: sourceError?.message || "Unable to save the source record."
      });
      continue;
    }

    const { error: ledgerError } = await supabase.from("ledger_entries").insert({
      portfolio_id: portfolio.id,
      source_record_id: sourceRecord.id,
      chain_id: normalized.chainId,
      asset_id: normalized.assetId,
      entry_type: normalized.entryType,
      quantity: normalized.quantity,
      unit_price: normalized.unitPrice,
      gross_value: (Number(normalized.quantity) * Number(normalized.unitPrice)).toString(),
      fee_value: normalized.feeValue,
      currency_code: normalized.currencyCode,
      tx_hash: normalized.txHash || null,
      external_ref: normalized.externalRef || null,
      notes: normalized.notes || null,
      dedupe_hash: dedupeHash,
      occurred_at: occurredAt
    });

    if (ledgerError) {
      await supabase.from("source_records").delete().eq("id", sourceRecord.id);
      rowErrors.push({
        rowNumber: row.rowNumber,
        message: ledgerError.message || "Unable to save the ledger entry."
      });
      continue;
    }

    successCount += 1;
  }

  for (const rowError of rowErrors) {
    await supabase
      .from("import_rows")
      .update({
        status: "rejected",
        message: rowError.message
      })
      .eq("import_id", importRecord.id)
      .eq("row_number", rowError.rowNumber);
  }

  const validationErrorCount = preparedRows.filter((row) => row.status === "rejected").length;
  const errorCount = validationErrorCount + rowErrors.length;

  await supabase
    .from("imports")
    .update({
      status: successCount > 0 ? "completed" : "failed",
      row_count: preparedRows.length,
      success_count: successCount,
      error_count: errorCount,
      error_summary: errorCount
        ? `${errorCount} row${errorCount === 1 ? "" : "s"} need attention.`
        : null,
      completed_at: new Date().toISOString()
    })
    .eq("id", importRecord.id);

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/imports", {
      message:
        successCount > 0
          ? `Imported ${successCount} trade${successCount === 1 ? "" : "s"} into ${portfolio.name}.`
          : "The import finished, but every row needs attention before it can be added."
    })
  );
}
