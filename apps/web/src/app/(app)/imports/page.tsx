import Link from "next/link";

import { importTradesAction } from "@/app/(app)/imports/actions";
import { getFlashMessages } from "@/lib/flash";
import { formatDateTime } from "@/lib/format";
import { getImportSessionsForPortfolio } from "@/lib/imports";
import { getActivePortfolioState } from "@/lib/portfolios";

const sampleCsv = `date,time,chain,asset_symbol,type,quantity,unit_price,fee,currency,tx_hash,external_ref,notes
2026-01-05,14:30,ethereum,ETH,buy,1.25,2450,12.5,usd,,coinbase-fill-1,Manual import sample
2026-01-09,09:10,solana,SOL,sell,4,190,3.2,usd,5h7...,trading-bot-4,Partial take profit`;

type ImportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
  const [{ activePortfolio }, { message, error }] = await Promise.all([
    getActivePortfolioState(),
    getFlashMessages(searchParams)
  ]);

  const sessions = activePortfolio ? await getImportSessionsForPortfolio(activePortfolio.id) : [];

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">Imports & Exports</span>
          <h1>Move trades in and out</h1>
          <p className="page-subtitle">
            {activePortfolio
              ? `Back up ${activePortfolio.name} or bulk import trades using the same chain-aware ledger model as manual entry.`
              : "Create an active portfolio first so imports and exports know which workspace to target."}
          </p>
        </div>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      {!activePortfolio ? (
        <article className="list-card empty-state-card">
          <span className="eyebrow">Portfolio Required</span>
          <h2>Create or activate a portfolio</h2>
          <p className="section-copy">
            Every import and export is portfolio-scoped, so this page needs an active portfolio before
            it can do anything useful.
          </p>
          <Link href="/portfolios" className="button-secondary">
            Manage Portfolios
          </Link>
        </article>
      ) : (
        <>
          <div className="two-column">
            <article className="list-card">
              <span className="eyebrow">Import</span>
              <h2>Upload CSV or JSON trades</h2>
              <p className="section-copy">
                Rows are validated against the live chain and asset catalog before they are written into
                the ledger. Valid rows are imported right away, and failed rows stay visible in the
                import history.
              </p>

              <form className="ledger-form" action={importTradesAction} encType="multipart/form-data">
                <input type="hidden" name="portfolioId" value={activePortfolio.id} />

                <label className="field-group">
                  <span>Format</span>
                  <select name="format" defaultValue="auto">
                    <option value="auto">Detect from file extension</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </label>

                <label className="field-group">
                  <span>Trade file</span>
                  <input type="file" name="file" accept=".csv,.json,application/json,text/csv" required />
                </label>

                <div className="inline-actions">
                  <button type="submit" className="button-primary">
                    Import Trades
                  </button>
                </div>
              </form>
            </article>

            <article className="list-card">
              <span className="eyebrow">Export</span>
              <h2>Download the current trade log</h2>
              <p className="section-copy">
                Exports come from the database-backed ledger for the active portfolio and are ready for
                backups, tax prep, or moving between systems.
              </p>

              <div className="inline-actions">
                <Link
                  href={`/api/portfolios/${activePortfolio.id}/export?format=csv`}
                  className="button-primary"
                >
                  Export CSV
                </Link>
                <Link
                  href={`/api/portfolios/${activePortfolio.id}/export?format=json`}
                  className="button-secondary"
                >
                  Export JSON
                </Link>
              </div>
            </article>
          </div>

          <div className="two-column">
            <article className="list-card">
              <span className="eyebrow">CSV Shape</span>
              <h2>Expected columns</h2>
              <p className="section-copy">
                Required values are `date`, `chain`, `asset_symbol` or `asset_name`, `type`, `quantity`,
                and `unit_price`. Currency falls back to the portfolio base currency when omitted.
              </p>

              <pre className="sample-block">{sampleCsv}</pre>
            </article>

            <article className="list-card">
              <span className="eyebrow">JSON Shape</span>
              <h2>Accepted object keys</h2>
              <p className="section-copy">
                JSON imports accept an array of objects or `{`rows`}`. Common keys include `chain`,
                `asset`, `symbol`, `type`, `date`, `time`, `quantity`, `unit_price`, `fee`, `currency`,
                `tx_hash`, `external_ref`, and `notes`.
              </p>
            </article>
          </div>

          <article className="list-card import-history-card">
            <span className="eyebrow">History</span>
            <h2>Recent import sessions</h2>
            <p className="section-copy">
              Every import creates a session record, tracks row counts, and stores accepted or rejected
              rows in the database for review.
            </p>

            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Rows</th>
                    <th>Imported</th>
                    <th>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <strong>No import sessions yet</strong>
                          <span>The first upload will show up here with counts and status.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id}>
                        <td>{formatDateTime(session.created_at)}</td>
                        <td>
                          <strong>{session.file_name}</strong>
                          <span className="table-subcopy">{session.file_type.toUpperCase()}</span>
                        </td>
                        <td>
                          <span className={`type-pill ${session.status === "completed" ? "type-pill-buy" : session.status === "failed" ? "type-pill-fee" : "type-pill-transfer_in"}`}>
                            {session.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{session.row_count}</td>
                        <td>{session.success_count}</td>
                        <td>
                          <strong>{session.error_count}</strong>
                          <span className="table-subcopy">{session.error_summary || "No issues recorded."}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </section>
  );
}
