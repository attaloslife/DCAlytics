import Link from "next/link";

import {
  createExchangeConnectionAction,
  deleteExchangeConnectionAction,
  toggleExchangeConnectionStatusAction
} from "@/app/(app)/exchanges/actions";
import { ExchangeDeleteButton } from "@/components/exchange-delete-button";
import {
  getExchangeConnectionSummary,
  getExchangeConnectionsForPortfolio,
  SUPPORTED_EXCHANGES
} from "@/lib/exchanges";
import { getFlashMessages } from "@/lib/flash";
import { formatDateTime } from "@/lib/format";
import { getActivePortfolioState } from "@/lib/portfolios";

type ExchangesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function getStatusClass(status: "active" | "paused" | "error") {
  if (status === "active") {
    return "status-chip status-chip-success";
  }

  if (status === "paused") {
    return "status-chip status-chip-warning";
  }

  return "status-chip status-chip-danger";
}

function getSyncStatusClass(status: "idle" | "queued" | "running" | "completed" | "failed") {
  if (status === "completed") {
    return "status-chip status-chip-success";
  }

  if (status === "queued" || status === "running") {
    return "status-chip status-chip-warning";
  }

  if (status === "failed") {
    return "status-chip status-chip-danger";
  }

  return "status-chip status-chip-muted";
}

function formatConnectionName(label: string | null, exchangeName: string) {
  return label?.trim() || `${exchangeName} connection`;
}

export default async function ExchangesPage({ searchParams }: ExchangesPageProps) {
  const [{ activePortfolio }, { message, error }] = await Promise.all([
    getActivePortfolioState(),
    getFlashMessages(searchParams)
  ]);

  const connections = activePortfolio
    ? await getExchangeConnectionsForPortfolio(activePortfolio.id)
    : [];
  const summary = getExchangeConnectionSummary(connections);

  if (!activePortfolio) {
    return (
      <section className="content-card">
        <header className="page-header">
          <div>
            <span className="eyebrow">Exchange Sync</span>
            <h1>Connect read-only exchange accounts</h1>
            <p className="page-subtitle">
              Exchange sync is portfolio-aware, so this workspace needs an active portfolio before it can
              save connection profiles.
            </p>
          </div>
        </header>

        <article className="list-card empty-state-card">
          <span className="eyebrow">Portfolio Required</span>
          <h2>Create or activate a portfolio</h2>
          <p className="section-copy">
            Once a portfolio is active, this page will let you save read-only exchange connection
            profiles for balances and trade sync.
          </p>
          <Link href="/portfolios" className="button-secondary">
            Manage Portfolios
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">Exchange Sync</span>
          <h1>Read-only connection foundation</h1>
          <p className="page-subtitle">
            {activePortfolio.name} can now store exchange connection profiles and sync preferences. Live
            balances, fills, and background jobs come next, but this gives us the real portfolio-scoped
            base layer first.
          </p>
        </div>

        <div className="status-chip">Read-only Only</div>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      <div className="summary-grid">
        <article className="metric-card">
          <span>Total Connections</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="metric-card">
          <span>Active</span>
          <strong>{summary.active}</strong>
        </article>
        <article className="metric-card">
          <span>Balance Sync Enabled</span>
          <strong>{summary.syncBalancesEnabled}</strong>
        </article>
        <article className="metric-card">
          <span>Trade Sync Enabled</span>
          <strong>{summary.syncTradesEnabled}</strong>
        </article>
      </div>

      <div className="two-column">
        <article className="list-card">
          <span className="eyebrow">Add Connection</span>
          <h2>Save an exchange profile</h2>
          <p className="section-copy">
            This first step stores the connection profile only. We are not saving API secrets yet, and no
            live exchange calls happen from this screen.
          </p>

          <form className="ledger-form" action={createExchangeConnectionAction}>
            <input type="hidden" name="portfolioId" value={activePortfolio.id} />

            <label className="field-group">
              <span>Exchange</span>
              <select name="exchangeSlug" defaultValue="binance" required>
                {SUPPORTED_EXCHANGES.map((exchange) => (
                  <option key={exchange.slug} value={exchange.slug}>
                    {exchange.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-grid">
              <label className="field-group">
                <span>Connection Label</span>
                <input
                  type="text"
                  name="label"
                  placeholder="Optional label like Swing Account or Treasury Exchange"
                />
              </label>

              <label className="field-group">
                <span>Account Hint</span>
                <input
                  type="text"
                  name="accountHint"
                  placeholder="Optional email, UID, or sub-account note"
                />
              </label>
            </div>

            <div className="field-grid">
              <label className="field-group">
                <span>API Key Label</span>
                <input
                  type="text"
                  name="apiKeyLabel"
                  placeholder="Optional reminder for which read-only key this will use later"
                />
              </label>

              <label className="field-group">
                <span>Environment</span>
                <label className="checkbox-option">
                  <input type="checkbox" name="testnet" />
                  <span>Use testnet / sandbox environment</span>
                </label>
              </label>
            </div>

            <div className="checkbox-grid">
              <label className="checkbox-option">
                <input type="checkbox" name="syncBalances" defaultChecked />
                <span>Sync balances when the live connector is ready</span>
              </label>

              <label className="checkbox-option">
                <input type="checkbox" name="syncTrades" defaultChecked />
                <span>Sync trades and fills when the live connector is ready</span>
              </label>
            </div>

            <div className="inline-note">
              Exchange sync will stay read-only. Secrets storage, API validation, and background sync jobs
              are the next layer on top of this foundation.
            </div>

            <div className="inline-actions">
              <button type="submit" className="button-primary">
                Save Connection
              </button>
            </div>
          </form>
        </article>

        <article className="list-card">
          <span className="eyebrow">Supported Next</span>
          <h2>Connector targets</h2>
          <p className="section-copy">
            These are the exchanges this foundation is shaping for first. The page is already portfolio-
            aware and read-only, so the real connector work can plug into the same records later.
          </p>

          <div className="integration-grid">
            {SUPPORTED_EXCHANGES.map((exchange) => (
              <article key={exchange.slug} className="integration-card">
                <strong>{exchange.name}</strong>
                <span>{exchange.copy}</span>
              </article>
            ))}
          </div>
        </article>
      </div>

      <div className="portfolio-stack">
        {connections.length === 0 ? (
          <article className="list-card">
            <span className="eyebrow">No Connections Yet</span>
            <h2>Save the first exchange profile</h2>
            <p className="section-copy">
              Once a connection profile is saved here, we can layer real credential vaulting, sync runs,
              balances, fills, and transfer-aware exchange ingestion onto the same record.
            </p>
          </article>
        ) : (
          connections.map((connection) => (
            <article key={connection.id} className="list-card portfolio-card">
              <div className="portfolio-card-header">
                <div>
                  <span className="eyebrow">{connection.exchangeName}</span>
                  <h2>{formatConnectionName(connection.label, connection.exchangeName)}</h2>
                  <p className="section-copy">
                    {connection.accountHint
                      ? connection.accountHint
                      : "No account hint saved yet. Add one later if you want to distinguish multiple exchange accounts."}
                  </p>
                </div>

                <div className="portfolio-badges">
                  <span className={getStatusClass(connection.status)}>
                    {connection.status === "active"
                      ? "Active"
                      : connection.status === "paused"
                        ? "Paused"
                        : "Error"}
                  </span>
                  <span className="status-chip status-chip-muted">
                    {connection.readOnly ? "Read-only" : "Write-enabled"}
                  </span>
                  {connection.testnet ? (
                    <span className="status-chip status-chip-warning">Testnet</span>
                  ) : null}
                </div>
              </div>

              <div className="connection-meta-grid">
                <div className="inline-note">
                  <strong>API Key Label</strong>
                  <span>{connection.apiKeyLabel || "Not saved yet"}</span>
                </div>
                <div className="inline-note">
                  <strong>Sync Scope</strong>
                  <span>
                    {connection.syncBalances ? "Balances" : "No balances"}
                    {" + "}
                    {connection.syncTrades ? "Trades" : "No trades"}
                  </span>
                </div>
                <div className="inline-note">
                  <strong>Last Sync State</strong>
                  <span>{connection.lastSyncStatus}</span>
                </div>
                <div className="inline-note">
                  <strong>Saved</strong>
                  <span>{formatDateTime(connection.createdAt)}</span>
                </div>
              </div>

              <div className="portfolio-badges">
                <span className={getSyncStatusClass(connection.lastSyncStatus)}>
                  {connection.lastSyncStatus === "idle"
                    ? "Not Synced Yet"
                    : connection.lastSyncStatus.toUpperCase()}
                </span>
                {connection.lastSyncRequestedAt ? (
                  <span className="status-chip status-chip-muted">
                    Requested {formatDateTime(connection.lastSyncRequestedAt)}
                  </span>
                ) : null}
                {connection.lastSyncCompletedAt ? (
                  <span className="status-chip status-chip-muted">
                    Completed {formatDateTime(connection.lastSyncCompletedAt)}
                  </span>
                ) : null}
              </div>

              {connection.lastSyncError ? (
                <div className="banner banner-error">{connection.lastSyncError}</div>
              ) : (
                <div className="inline-note">
                  This saved profile is ready for the next phase: encrypted credential storage, API
                  verification, and real exchange sync runs.
                </div>
              )}

              <div className="wallet-actions">
                <form action={toggleExchangeConnectionStatusAction}>
                  <input type="hidden" name="connectionId" value={connection.id} />
                  <input type="hidden" name="portfolioId" value={activePortfolio.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={connection.status === "active" ? "paused" : "active"}
                  />
                  <button type="submit" className="button-secondary">
                    {connection.status === "active" ? "Pause" : "Reactivate"}
                  </button>
                </form>

                <form action={deleteExchangeConnectionAction}>
                  <input type="hidden" name="connectionId" value={connection.id} />
                  <input type="hidden" name="portfolioId" value={activePortfolio.id} />
                  <ExchangeDeleteButton
                    exchangeName={connection.exchangeName}
                    connectionLabel={formatConnectionName(connection.label, connection.exchangeName)}
                  />
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
