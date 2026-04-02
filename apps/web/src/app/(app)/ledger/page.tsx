import Link from "next/link";

import { deleteManualLedgerEntryAction } from "@/app/(app)/ledger/actions";
import { formatCompactHash, formatCurrencyValue, formatDateTime, formatQuantity } from "@/lib/format";
import { getFlashMessages } from "@/lib/flash";
import { getLedgerEntriesForPortfolio, getLedgerSummary } from "@/lib/ledger";
import { getActivePortfolioState } from "@/lib/portfolios";

type TradeLogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function TradeLogPage({ searchParams }: TradeLogPageProps) {
  const [{ activePortfolio }, { message, error }] = await Promise.all([
    getActivePortfolioState(),
    getFlashMessages(searchParams)
  ]);

  const entries = activePortfolio ? await getLedgerEntriesForPortfolio(activePortfolio.id) : [];
  const summary = getLedgerSummary(entries);
  const portfolioCurrency = activePortfolio?.base_currency || "usd";

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">Manual Ledger</span>
          <h1>Trade log</h1>
          <p className="page-subtitle">
            {activePortfolio
              ? `Every saved manual trade now lives in ${activePortfolio.name}, backed by Postgres instead of browser storage.`
              : "Create an active portfolio first, then every trade you add here will attach to that portfolio."}
          </p>
        </div>

        <Link href="/ledger/add" className="button-primary">
          Add Transaction
        </Link>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      {!activePortfolio ? (
        <article className="list-card empty-state-card">
          <span className="eyebrow">No Active Portfolio</span>
          <h2>Create a portfolio first</h2>
          <p className="section-copy">
            The ledger is portfolio-aware, so it needs an active portfolio before it can save or show
            any trades.
          </p>
          <Link href="/portfolios" className="button-secondary">
            Manage Portfolios
          </Link>
        </article>
      ) : (
        <>
          <div className="summary-grid">
            <article className="metric-card">
              <span>Entries</span>
              <strong>{summary.entryCount}</strong>
            </article>
            <article className="metric-card">
              <span>Buy Volume</span>
              <strong>{formatCurrencyValue(summary.buyVolume, portfolioCurrency)}</strong>
            </article>
            <article className="metric-card">
              <span>Sell Volume</span>
              <strong>{formatCurrencyValue(summary.sellVolume, portfolioCurrency)}</strong>
            </article>
            <article className="metric-card">
              <span>Total Fees</span>
              <strong>{formatCurrencyValue(summary.totalFees, portfolioCurrency)}</strong>
            </article>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Coin</th>
                  <th>Chain</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Gross Value</th>
                  <th>Fee</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">
                        <strong>No transactions yet</strong>
                        <span>
                          Add the first trade for {activePortfolio.name} and it will start building this
                          database-backed log.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.occurredAt)}</td>
                      <td>
                        <strong>{entry.asset?.symbol || "Unknown"}</strong>
                        <span className="table-subcopy">{entry.asset?.name || "Asset unavailable"}</span>
                      </td>
                      <td>{entry.chain?.name || "Unknown"}</td>
                      <td>
                        <span className={`type-pill type-pill-${entry.entryType}`}>
                          {entry.entryType.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatQuantity(entry.quantity)}</td>
                      <td>{formatCurrencyValue(entry.unitPrice, entry.currencyCode)}</td>
                      <td>{formatCurrencyValue(entry.grossValue, entry.currencyCode)}</td>
                      <td>{formatCurrencyValue(entry.feeValue, entry.currencyCode)}</td>
                      <td>
                        <strong>{formatCompactHash(entry.txHash || entry.externalRef)}</strong>
                        <span className="table-subcopy">{entry.notes || "No notes"}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/ledger/add?entryId=${entry.id}`}
                            className="button-secondary table-action-button"
                          >
                            Edit
                          </Link>

                          <form action={deleteManualLedgerEntryAction}>
                            <input type="hidden" name="entryId" value={entry.id} />
                            <input type="hidden" name="portfolioId" value={activePortfolio.id} />
                            <button type="submit" className="button-secondary table-action-button table-action-danger">
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
