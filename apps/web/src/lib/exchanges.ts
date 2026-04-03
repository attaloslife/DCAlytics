import { requireAuthenticatedContext } from "@/lib/auth";

export const SUPPORTED_EXCHANGES = [
  {
    slug: "binance",
    name: "Binance",
    copy: "Global spot and trading activity with broad API coverage."
  },
  {
    slug: "coinbase-advanced",
    name: "Coinbase Advanced",
    copy: "Read-only balances and fills for Coinbase trading accounts."
  },
  {
    slug: "kraken",
    name: "Kraken",
    copy: "Strong read-only API support for balances, trades, and transfers."
  },
  {
    slug: "okx",
    name: "OKX",
    copy: "Unified account sync foundation for spot and funding wallets."
  },
  {
    slug: "bybit",
    name: "Bybit",
    copy: "Read-only trading and funding views with multi-account support."
  },
  {
    slug: "kucoin",
    name: "KuCoin",
    copy: "Portfolio sync target for spot balances and trade history."
  },
  {
    slug: "bitget",
    name: "Bitget",
    copy: "Exchange sync foundation for balances, fills, and account scopes."
  },
  {
    slug: "gate-io",
    name: "Gate.io",
    copy: "Read-only connection profile ready for future balance and trade ingestion."
  }
] as const;

export type SupportedExchangeSlug = (typeof SUPPORTED_EXCHANGES)[number]["slug"];

type ExchangeConnectionRow = {
  id: string;
  portfolio_id: string;
  exchange_slug: string;
  label: string | null;
  account_hint: string | null;
  api_key_label: string | null;
  status: "active" | "paused" | "error";
  read_only: boolean;
  sync_balances: boolean;
  sync_trades: boolean;
  testnet: boolean;
  last_sync_status: "idle" | "queued" | "running" | "completed" | "failed";
  last_sync_requested_at: string | null;
  last_sync_completed_at: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ExchangeConnectionRecord = {
  id: string;
  portfolioId: string;
  exchangeSlug: string;
  exchangeName: string;
  label: string | null;
  accountHint: string | null;
  apiKeyLabel: string | null;
  status: "active" | "paused" | "error";
  readOnly: boolean;
  syncBalances: boolean;
  syncTrades: boolean;
  testnet: boolean;
  lastSyncStatus: "idle" | "queued" | "running" | "completed" | "failed";
  lastSyncRequestedAt: string | null;
  lastSyncCompletedAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExchangeConnectionSummary = {
  total: number;
  active: number;
  paused: number;
  syncBalancesEnabled: number;
  syncTradesEnabled: number;
};

export function getSupportedExchangeBySlug(slug: string | null | undefined) {
  return SUPPORTED_EXCHANGES.find((exchange) => exchange.slug === slug) || null;
}

export function getExchangeConnectionSummary(
  connections: ExchangeConnectionRecord[]
): ExchangeConnectionSummary {
  return connections.reduce<ExchangeConnectionSummary>(
    (summary, connection) => {
      summary.total += 1;

      if (connection.status === "active") {
        summary.active += 1;
      }

      if (connection.status === "paused") {
        summary.paused += 1;
      }

      if (connection.syncBalances) {
        summary.syncBalancesEnabled += 1;
      }

      if (connection.syncTrades) {
        summary.syncTradesEnabled += 1;
      }

      return summary;
    },
    {
      total: 0,
      active: 0,
      paused: 0,
      syncBalancesEnabled: 0,
      syncTradesEnabled: 0
    }
  );
}

export async function getExchangeConnectionsForPortfolio(portfolioId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("exchange_connections")
    .select(`
      id,
      portfolio_id,
      exchange_slug,
      label,
      account_hint,
      api_key_label,
      status,
      read_only,
      sync_balances,
      sync_trades,
      testnet,
      last_sync_status,
      last_sync_requested_at,
      last_sync_completed_at,
      last_sync_error,
      created_at,
      updated_at
    `)
    .eq("portfolio_id", portfolioId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as ExchangeConnectionRow[]).map((row) => {
    const supportedExchange = getSupportedExchangeBySlug(row.exchange_slug);

    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      exchangeSlug: row.exchange_slug,
      exchangeName: supportedExchange?.name || row.exchange_slug,
      label: row.label,
      accountHint: row.account_hint,
      apiKeyLabel: row.api_key_label,
      status: row.status,
      readOnly: row.read_only,
      syncBalances: row.sync_balances,
      syncTrades: row.sync_trades,
      testnet: row.testnet,
      lastSyncStatus: row.last_sync_status,
      lastSyncRequestedAt: row.last_sync_requested_at,
      lastSyncCompletedAt: row.last_sync_completed_at,
      lastSyncError: row.last_sync_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } satisfies ExchangeConnectionRecord;
  });
}
