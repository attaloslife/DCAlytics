import { cookies } from "next/headers";

import { requireAuthenticatedContext } from "@/lib/auth";

export const ACTIVE_PORTFOLIO_COOKIE = "prismfolio-active-portfolio";

export type PortfolioRecord = {
  id: string;
  name: string;
  base_currency: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
};

export type PortfolioActivitySummary = {
  tradeCount: number;
  walletCount: number;
  latestOccurredAt: string | null;
};

export async function getAccessiblePortfolios(includeArchived = true) {
  const { supabase } = await requireAuthenticatedContext();
  let query = supabase
    .from("portfolios")
    .select("id, name, base_currency, description, is_archived, created_at")
    .order("created_at", { ascending: true });

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return (data ?? []) as PortfolioRecord[];
}

export async function getPortfolioActivitySummaries() {
  const { supabase } = await requireAuthenticatedContext();
  const [ledgerResult, walletResult] = await Promise.all([
    supabase
      .from("ledger_entries")
      .select("portfolio_id, occurred_at")
      .order("occurred_at", { ascending: false }),
    supabase.from("wallet_addresses").select("portfolio_id")
  ]);

  const summaryMap = new Map<string, PortfolioActivitySummary>();

  for (const row of ledgerResult.data ?? []) {
    const portfolioId = row.portfolio_id as string;
    const summary = summaryMap.get(portfolioId) || {
      tradeCount: 0,
      walletCount: 0,
      latestOccurredAt: null
    };

    summary.tradeCount += 1;

    if (!summary.latestOccurredAt) {
      summary.latestOccurredAt = row.occurred_at as string;
    }

    summaryMap.set(portfolioId, summary);
  }

  for (const row of walletResult.data ?? []) {
    const portfolioId = row.portfolio_id as string;
    const summary = summaryMap.get(portfolioId) || {
      tradeCount: 0,
      walletCount: 0,
      latestOccurredAt: null
    };

    summary.walletCount += 1;
    summaryMap.set(portfolioId, summary);
  }

  return summaryMap;
}

export async function getActivePortfolioState() {
  const portfolios = await getAccessiblePortfolios(true);
  const cookieStore = await cookies();
  const requestedPortfolioId = cookieStore.get(ACTIVE_PORTFOLIO_COOKIE)?.value || "";
  const activePortfolio =
    portfolios.find((portfolio) => portfolio.id === requestedPortfolioId && !portfolio.is_archived) ||
    portfolios.find((portfolio) => !portfolio.is_archived) ||
    portfolios[0] ||
    null;

  return {
    portfolios,
    activePortfolio,
    activePortfolioId: activePortfolio?.id || ""
  };
}

export async function setActivePortfolioCookie(portfolioId: string) {
  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_PORTFOLIO_COOKIE, portfolioId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}
