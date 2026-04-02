import Link from "next/link";

import { formatCurrencyValue } from "@/lib/format";
import { getFlashMessages } from "@/lib/flash";
import { getLedgerEntriesForPortfolio, getLedgerSummary } from "@/lib/ledger";
import { getActivePortfolioState } from "@/lib/portfolios";
import { getWalletAddressesForPortfolio } from "@/lib/wallets";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [{ activePortfolio, portfolios }, { message, error }] = await Promise.all([
    getActivePortfolioState(),
    getFlashMessages(searchParams)
  ]);
  const [entries, wallets] = activePortfolio
    ? await Promise.all([
        getLedgerEntriesForPortfolio(activePortfolio.id),
        getWalletAddressesForPortfolio(activePortfolio.id)
      ])
    : [[], []];
  const summary = getLedgerSummary(entries);
  const summaryCards = [
    {
      label: "Auth",
      value: "Protected",
      copy: "Supabase SSR auth is now driving the protected app shell."
    },
    {
      label: "Portfolios",
      value: `${portfolios.length}`,
      copy: "Portfolio switching is live, so every workflow now runs inside an active workspace."
    },
    {
      label: "Trades",
      value: activePortfolio ? `${summary.entryCount}` : "0",
      copy: activePortfolio
        ? `Manual trades are now stored in Postgres for ${activePortfolio.name}.`
        : "Create a portfolio to start building the unified ledger."
    },
    {
      label: "Wallets",
      value: activePortfolio ? `${wallets.length}` : "0",
      copy: activePortfolio
        ? "Saved public addresses now feed the live read-only wallet preview."
        : "Activate a portfolio to start attaching public wallet addresses."
    }
  ];

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">App Shell</span>
          <h1>Dashboard foundation</h1>
          <p className="page-subtitle">
            {activePortfolio
              ? `Active portfolio: ${activePortfolio.name}. This dashboard is now protected by Supabase auth and wired to the portfolio model.`
              : "This route group is now protected and ready for your first real portfolio."}
          </p>
        </div>

        <div className="status-chip">M1 - Foundation Shell</div>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      <div className="content-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="list-card">
            <span className="eyebrow">{card.label}</span>
            <h2>{card.value}</h2>
            <p>{card.copy}</p>
          </article>
        ))}

        <article className="list-card">
          <span className="eyebrow">Ledger State</span>
          <h2>
            {activePortfolio
              ? formatCurrencyValue(summary.buyVolume, activePortfolio.base_currency)
              : "No active portfolio"}
          </h2>
          <p>
            {activePortfolio
              ? `Buy volume is now live for ${activePortfolio.name}. The next step is combining wallet balances, exchange sync, and richer portfolio summaries on top of the same ledger data.`
              : "Create your first portfolio to unlock the live ledger workflow."}
          </p>

          {activePortfolio ? (
            <div className="inline-actions">
              <Link href="/ledger/add" className="button-primary">
                Add Transaction
              </Link>
              <Link href="/ledger" className="button-secondary">
                Open Trade Log
              </Link>
              <Link href="/wallets" className="button-secondary">
                Track Wallets
              </Link>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
