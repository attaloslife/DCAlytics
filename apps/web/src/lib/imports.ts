import type { AssetOption, ChainOption } from "@/lib/catalog";
import type { LedgerEntryRecord } from "@/lib/ledger";
import { requireAuthenticatedContext } from "@/lib/auth";

export type ImportRecord = {
  id: string;
  file_name: string;
  file_type: "csv" | "json";
  status: "uploaded" | "parsed" | "validated" | "completed" | "failed";
  row_count: number;
  success_count: number;
  error_count: number;
  error_summary: string | null;
  created_at: string;
  completed_at: string | null;
};

export type PreparedImportRow = {
  rowNumber: number;
  rawPayload: Record<string, unknown>;
  status: "accepted" | "rejected";
  message: string | null;
  normalizedPayload: {
    chainId: string;
    chainSlug: string;
    chainName: string;
    assetId: string;
    assetSymbol: string;
    assetName: string;
    entryType: "buy" | "sell";
    quantity: string;
    unitPrice: string;
    feeValue: string;
    currencyCode: string;
    occurredDate: string;
    occurredTime: string;
    txHash: string;
    externalRef: string;
    notes: string;
  } | null;
};

type ImportFileRow = Record<string, unknown>;

function normalizeLookup(value: string) {
  return value.trim().toLowerCase();
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

function parseCsvText(text: string) {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === "\"") {
        if (nextChar === "\"") {
          currentCell += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }

      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentCell = "";
      currentRow = [];
      continue;
    }

    if (char === "\r") {
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function parseCsvRows(text: string): ImportFileRow[] {
  const allRows = parseCsvText(text).filter((row) => row.some((cell) => cell.trim().length > 0));

  if (allRows.length === 0) {
    return [];
  }

  const [headerRow, ...valueRows] = allRows;
  const normalizedHeaders = headerRow.map(normalizeHeader);

  return valueRows.map((row) => {
    const record: ImportFileRow = {};

    normalizedHeaders.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });

    return record;
  });
}

function parseJsonRows(text: string): ImportFileRow[] {
  const parsed = JSON.parse(text) as unknown;
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown[] }).rows)
      ? (parsed as { rows: unknown[] }).rows
      : null;

  if (!rows) {
    throw new Error("JSON imports must be an array of trade objects or an object with a rows array.");
  }

  return rows.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
    );
  });
}

export function detectImportFormat(fileName: string, selectedFormat: string) {
  if (selectedFormat === "csv" || selectedFormat === "json") {
    return selectedFormat;
  }

  if (fileName.toLowerCase().endsWith(".json")) {
    return "json";
  }

  return "csv";
}

export function parseImportFile(
  fileName: string,
  fileText: string,
  selectedFormat: string
): { format: "csv" | "json"; rows: ImportFileRow[] } {
  const format = detectImportFormat(fileName, selectedFormat) as "csv" | "json";

  return {
    format,
    rows: format === "json" ? parseJsonRows(fileText) : parseCsvRows(fileText)
  };
}

function getStringValue(row: ImportFileRow, keys: string[]) {
  for (const key of keys) {
    const value = row[normalizeHeader(key)];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function getDateParts(row: ImportFileRow) {
  const occurredAt = getStringValue(row, ["occurred_at", "datetime", "timestamp"]);

  if (occurredAt) {
    const date = new Date(occurredAt);

    if (!Number.isNaN(date.getTime())) {
      return {
        occurredDate: date.toISOString().slice(0, 10),
        occurredTime: date.toISOString().slice(11, 16)
      };
    }
  }

  return {
    occurredDate: getStringValue(row, ["date", "occurred_date", "entry_date"]),
    occurredTime: getStringValue(row, ["time", "occurred_time"])
  };
}

function resolveChain(chains: ChainOption[], rawValue: string) {
  const normalizedValue = normalizeLookup(rawValue);

  return (
    chains.find((chain) => normalizeLookup(chain.slug) === normalizedValue) ||
    chains.find((chain) => normalizeLookup(chain.name) === normalizedValue) ||
    null
  );
}

function resolveAsset(assets: AssetOption[], chainId: string, rawValue: string) {
  const normalizedValue = normalizeLookup(rawValue);
  const scopedAssets = assets.filter((asset) => asset.chainId === chainId);

  return (
    scopedAssets.find((asset) => normalizeLookup(asset.symbol) === normalizedValue) ||
    scopedAssets.find((asset) => normalizeLookup(asset.name) === normalizedValue) ||
    scopedAssets.find((asset) => normalizeLookup(asset.coingeckoId || "") === normalizedValue) ||
    null
  );
}

export function prepareImportRows(
  rows: ImportFileRow[],
  portfolioCurrency: string,
  chains: ChainOption[],
  assets: AssetOption[]
) {
  return rows.map<PreparedImportRow>((row, index) => {
    const rowNumber = index + 1;
    const chainValue = getStringValue(row, ["chain", "chain_slug", "network"]);
    const assetValue =
      getStringValue(row, ["asset", "symbol", "coin", "asset_symbol"]) ||
      getStringValue(row, ["asset_name", "name"]);
    const entryType = normalizeLookup(getStringValue(row, ["type", "entry_type", "side"]));
    const quantity = getStringValue(row, ["quantity", "amount"]);
    const unitPrice = getStringValue(row, ["unit_price", "price", "coin_price"]);
    const feeValue = getStringValue(row, ["fee", "commission", "fee_value"]) || "0";
    const currencyCode = getStringValue(row, ["currency", "currency_code"]) || portfolioCurrency;
    const txHash = getStringValue(row, ["tx_hash", "hash"]);
    const externalRef = getStringValue(row, ["external_ref", "reference", "ref", "external_id"]);
    const notes = getStringValue(row, ["notes", "note"]);
    const { occurredDate, occurredTime } = getDateParts(row);

    if (!chainValue) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: "Chain is required.",
        normalizedPayload: null
      };
    }

    const chain = resolveChain(chains, chainValue);

    if (!chain) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: `Chain "${chainValue}" is not in the catalog.`,
        normalizedPayload: null
      };
    }

    if (!assetValue) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: "Coin is required.",
        normalizedPayload: null
      };
    }

    const asset = resolveAsset(assets, chain.id, assetValue);

    if (!asset) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: `Coin "${assetValue}" is not available on ${chain.name}.`,
        normalizedPayload: null
      };
    }

    if (entryType !== "buy" && entryType !== "sell") {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: "Type must be buy or sell.",
        normalizedPayload: null
      };
    }

    if (!occurredDate || !/^\d{4}-\d{2}-\d{2}$/.test(occurredDate)) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: "Date must use YYYY-MM-DD or a valid timestamp.",
        normalizedPayload: null
      };
    }

    if (occurredTime && !/^\d{2}:\d{2}$/.test(occurredTime)) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: "Time must use HH:MM if provided.",
        normalizedPayload: null
      };
    }

    if (!quantity || Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: "Quantity must be a positive number.",
        normalizedPayload: null
      };
    }

    if (!unitPrice || Number.isNaN(Number(unitPrice)) || Number(unitPrice) < 0) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: "Unit price must be 0 or greater.",
        normalizedPayload: null
      };
    }

    if (Number.isNaN(Number(feeValue)) || Number(feeValue) < 0) {
      return {
        rowNumber,
        rawPayload: row,
        status: "rejected",
        message: "Fee must be 0 or greater.",
        normalizedPayload: null
      };
    }

    return {
      rowNumber,
      rawPayload: row,
      status: "accepted",
      message: null,
      normalizedPayload: {
        chainId: chain.id,
        chainSlug: chain.slug,
        chainName: chain.name,
        assetId: asset.assetId,
        assetSymbol: asset.symbol,
        assetName: asset.name,
        entryType,
        quantity,
        unitPrice,
        feeValue,
        currencyCode: currencyCode.toLowerCase(),
        occurredDate,
        occurredTime,
        txHash,
        externalRef,
        notes
      }
    };
  });
}

export async function getImportSessionsForPortfolio(portfolioId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("imports")
    .select("id, file_name, file_type, status, row_count, success_count, error_count, error_summary, created_at, completed_at")
    .eq("portfolio_id", portfolioId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return [];
  }

  return (data ?? []) as ImportRecord[];
}

export function serializeLedgerEntriesToCsv(entries: LedgerEntryRecord[]) {
  const headers = [
    "date",
    "time",
    "chain",
    "asset_symbol",
    "asset_name",
    "type",
    "quantity",
    "unit_price",
    "gross_value",
    "fee",
    "currency",
    "tx_hash",
    "external_ref",
    "notes"
  ];

  const lines = [headers.join(",")];

  for (const entry of entries) {
    const occurredDate = entry.occurredAt.slice(0, 10);
    const occurredTime = entry.occurredAt.slice(11, 16);
    const values = [
      occurredDate,
      occurredTime,
      entry.chain?.slug || "",
      entry.asset?.symbol || "",
      entry.asset?.name || "",
      entry.entryType,
      entry.quantity,
      entry.unitPrice || "",
      entry.grossValue || "",
      entry.feeValue,
      entry.currencyCode,
      entry.txHash || "",
      entry.externalRef || "",
      entry.notes || ""
    ].map((value) => escapeCsvCell(String(value)));

    lines.push(values.join(","));
  }

  return lines.join("\n");
}
