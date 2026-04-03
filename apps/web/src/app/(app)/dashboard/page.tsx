import Link from "next/link";

import { getExchangeConnectionsForPortfolio } from "@/lib/exchanges";
import { getFlashMessages } from "@/lib/flash";
import { formatCurrencyValue, formatDateTime, formatQuantity } from "@/lib/format";
import { getLedgerEntriesForPortfolio, getLedgerPositions, getLedgerSummary } from "@/lib/ledger";
import { getOrFetchSpotPrices } from "@/lib/market-data";
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
  const [entries, wallets, exchanges] = activePortfolio
    ? await Promise.all([
        getLedgerEntriesForPortfolio(activePortfolio.id),
        getWalletAddressesForPortfolio(activePortfolio.id),
        getExchangeConnectionsForPortfolio(activePortfolio.id)
      ])
    : [[], [], []];
  const summary = getLedgerSummary(entries);
  const positions = getLedgerPositions(entries);
  const marketIds = positions
    .map((position) => position.marketId)
    .filter((marketId): marketId is string => Boolean(marketId));
  const priceMap = activePortfolio
    ? await getOrFetchSpotPrices(marketIds, activePortfolio.base_currency, 300)
    : new Map<string, number>();
  const positionsWithPrices = positions.map((position) => {
    const currentPrice =
      position.marketId
        ? priceMap.get(position.marketId) ?? null
        : null;
    const currentValue =
      currentPrice !== null
        ? position.quantity * currentPrice
        : null;

    return {
      ...position,
      currentPrice,
      currentValue
    };
  });
  const pricedPositions = positionsWithPrices.filter((position) => position.currentValue !== null);
  const portfolioValue = pricedPositions.reduce((total, position) => total + (position.currentValue || 0), 0);
  const portfolioCostBasis = positionsWithPrices.reduce((total, position) => total + (position.costBasis || 0), 0);
  const priceCoverage = positions.length
    ? `${pricedPositions.length}/${positions.length}`
    : "0/0";
  const summaryCards = [
    {
      label: "Portfolios",
      value: `${portfolios.length}`,
      copy: "Portfolio switching stays live across the authenticated workspace."
    },
    {
      label: "Trades",
      value: activePortfolio ? `${summary.entryCount}` : "0",
      copy: activePortfolio
        ? `Ledger entries are loading from Postgres for ${activePortfolio.name}.`
        : "Create a portfolio to start building the unified ledger."
    },
    {
      label: "Open Coins",
      value: activePortfolio ? `${positions.length}` : "0",
      copy: activePortfolio
        ? "Open positions are aggregated from the ledger and priced through the market-data cache."
        : "Activate a portfolio to start pricing open positions."
    },
    {
      label: "Wallets",
      value: activePortfolio ? `${wallets.length}` : "0",
      copy: activePortfolio
        ? "Saved public addresses still feed the live wallet preview."
        : "Activate a portfolio to start attaching public wallet addresses."
    },
    {
      label: "Exchanges",
      value: activePortfolio ? `${exchanges.length}` : "0",
      copy: activePortfolio
        ? "Read-only exchange connection profiles are now saved per portfolio and ready for sync work."
        : "Activate a portfolio to start attaching exchange connection profiles."
    },
    {
      label: "Portfolio Value",
      value: activePortfolio ? formatCurrencyValue(portfolioValue, activePortfolio.base_currency) : "No active portfolio",
      copy: activePortfolio
        ? "This uses cached spot prices first, then only fetches missing prices into price snapshots."
        : "Create a portfolio to unlock dashboard pricing."
    },
    {
      label: "Price Coverage",
      value: priceCoverage,
      copy: activePortfolio
        ? "Coverage shows how many open positions currently have a cached or refreshed spot price."
        : "Price coverage will appear once a portfolio is active."
    }
  ];

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Portfolio overview</h1>
          <p className="page-subtitle">
            {activePortfolio
              ? `Active portfolio: ${activePortfolio.name}. The dashboard now prices open positions through the internal market-data cache instead of depending on raw live CoinGecko calls.`
              : "This route group is protected and ready for your first portfolio."}
          </p>
        </div>

        <div className="status-chip">Price Snapshots Active</div>
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
      </div>

      <div className="two-column dashboard-secondary-grid">
        <article className="list-card">
          <span className="eyebrow">Ledger State</span>
          <h2>
            {activePortfolio
              ? formatCurrencyValue(summary.buyVolume, activePortfolio.base_currency)
              : "No active portfolio"}
          </h2>
          <p className="section-copy">
            {activePortfolio
              ? `Buy volume and fees are loading directly from ${activePortfolio.name}, while spot pricing is now routed through price snapshots to reduce CoinGecko pressure.`
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
              <Link href="/exchanges" className="button-secondary">
                Connect Exchanges
              </Link>
            </div>
          ) : null}
        </article>

        <article className="list-card">
          <span className="eyebrow">Valuation</span>
          <h2>
            {activePortfolio
              ? formatCurrencyValue(portfolioCostBasis, activePortfolio.base_currency)
              : "No active portfolio"}
          </h2>
          <p className="section-copy">
            {activePortfolio
              ? `${pricedPositions.length} priced position${pricedPositions.length === 1 ? "" : "s"} are contributing to the current snapshot-backed portfolio value.`
              : "Current valuation appears once a portfolio is active."}
          </p>

          {activePortfolio && positionsWithPrices.some((position) => position.currentPrice === null) ? (
            <div className="inline-note">
              Some open positions still do not have a spot price. Their value is excluded until a market ID
              is available or the provider returns pricing.
            </div>
          ) : null}
        </article>
      </div>

      <article className="list-card dashboard-positions-card">
        <div className="page-header">
          <div>
            <span className="eyebrow">Open Positions</span>
            <h2>Current holdings</h2>
            <p className="section-copy">
              Open quantities are aggregated from buys and sells, then valued with the price snapshot cache.
            </p>
          </div>
        </div>

        {!activePortfolio ? (
          <div className="empty-state">
            <strong>No active portfolio</strong>
            <span>Create or activate a portfolio first to see current holdings.</span>
          </div>
        ) : positionsWithPrices.length === 0 ? (
          <div className="empty-state">
            <strong>No open positions yet</strong>
            <span>Add a trade and the dashboard will start tracking open holdings here.</span>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Quantity</th>
                  <th>Avg Cost</th>
                  <th>Current Price</th>
                  <th>Cost Basis</th>
                  <th>Value</th>
                  <th>Last Trade</th>
                </tr>
              </thead>
              <tbody>
                {positionsWithPrices.map((position) => (
                  <tr key={position.assetId}>
                    <td>
                      <strong>{position.symbol}</strong>
                      <span className="table-subcopy">{position.name}</span>
                    </td>
                    <td>{formatQuantity(position.quantity)}</td>
                    <td>{formatCurrencyValue(position.averageCost, activePortfolio.base_currency)}</td>
                    <td>{formatCurrencyValue(position.currentPrice, activePortfolio.base_currency)}</td>
                    <td>{formatCurrencyValue(position.costBasis, activePortfolio.base_currency)}</td>
                    <td>{formatCurrencyValue(position.currentValue, activePortfolio.base_currency)}</td>
                    <td>{formatDateTime(position.lastOccurredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
