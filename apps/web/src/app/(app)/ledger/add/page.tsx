import Link from "next/link";

import {
  createManualLedgerEntryAction,
  createTxidLedgerEntryAction,
  updateManualLedgerEntryAction
} from "@/app/(app)/ledger/actions";
import { ManualLedgerForm } from "@/components/manual-ledger-form";
import { TxidLedgerForm } from "@/components/txid-ledger-form";
import { getActiveChains } from "@/lib/catalog";
import { getFlashMessages, getSingleSearchParam, resolveSearchParams } from "@/lib/flash";
import { formatCurrencyValue, formatDateTime, formatQuantity } from "@/lib/format";
import { getLedgerEntriesForPortfolio, getLedgerEntryForEdit, getManualEntryDefaults } from "@/lib/ledger";
import { getActivePortfolioState } from "@/lib/portfolios";
import { getSupportedTxidNetworks } from "@/lib/txid";

type AddTransactionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function AddTransactionPage({ searchParams }: AddTransactionPageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const [{ activePortfolio }, { message, error }] = await Promise.all([
    getActivePortfolioState(),
    getFlashMessages(resolvedSearchParams)
  ]);

  const entryId = getSingleSearchParam(resolvedSearchParams, "entryId");
  const requestedMode = getSingleSearchParam(resolvedSearchParams, "mode");

  if (!activePortfolio) {
    return (
      <section className="content-card">
        <header className="page-header">
          <div>
            <span className="eyebrow">Ledger Entry</span>
            <h1>Add transaction</h1>
            <p className="page-subtitle">
              Transactions are saved inside the currently active portfolio, so create one first.
            </p>
          </div>
        </header>

        <article className="list-card empty-state-card">
          <span className="eyebrow">Portfolio Required</span>
          <h2>Create or activate a portfolio</h2>
          <p className="section-copy">
            Once a portfolio is active, this page will let you add trades manually or prepare them from
            a TXID review.
          </p>
          <Link href="/portfolios" className="button-secondary">
            Manage Portfolios
          </Link>
        </article>
      </section>
    );
  }

  const [editingEntry, recentEntries, activeChains] = await Promise.all([
    entryId ? getLedgerEntryForEdit(entryId, activePortfolio.id) : Promise.resolve(null),
    getLedgerEntriesForPortfolio(activePortfolio.id).then((entries) => entries.slice(0, 5)),
    getActiveChains()
  ]);

  const defaults = getManualEntryDefaults(editingEntry);
  const isEditing = Boolean(editingEntry);
  const mode = !isEditing && requestedMode === "txid" ? "txid" : "manual";
  const txidNetworks = getSupportedTxidNetworks()
    .filter((network) => activeChains.some((chain) => chain.slug === network.chainSlug))
    .map((network) => ({
      key: network.key,
      label: network.label
    }));

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">Ledger Entry</span>
          <h1>{isEditing ? "Edit transaction" : "Add transaction"}</h1>
          <p className="page-subtitle">
            {isEditing
              ? "Update the saved trade, then the log and dashboard will pick up the change from the database."
              : `Choose whether ${activePortfolio.name} should receive a manual trade entry or a TXID-reviewed transaction.`}
          </p>
        </div>

        <Link href="/ledger" className="button-secondary">
          View Trade Log
        </Link>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      {entryId && !editingEntry ? (
        <div className="banner banner-error">
          That transaction could not be found in the active portfolio.
        </div>
      ) : null}

      <div className="two-column">
        <article className="list-card">
          <span className="eyebrow">{activePortfolio.base_currency.toUpperCase()}</span>
          <h2>{isEditing ? "Update the saved trade" : "Choose how you want to add it"}</h2>
          <p className="section-copy">
            Manual entry stays fast and flexible, while TXID mode fetches on-chain data first and still
            asks the user to review it before anything hits the ledger.
          </p>

          {!isEditing ? (
            <div className="entry-mode-toggle" role="tablist" aria-label="Add transaction mode">
              <Link
                href="/ledger/add?mode=manual"
                className={`entry-mode-tab${mode === "manual" ? " entry-mode-tab-active" : ""}`}
              >
                Manual
              </Link>
              <Link
                href="/ledger/add?mode=txid"
                className={`entry-mode-tab${mode === "txid" ? " entry-mode-tab-active" : ""}`}
              >
                Add by TXID
              </Link>
            </div>
          ) : null}

          {mode === "txid" && !isEditing ? (
            <TxidLedgerForm
              portfolioId={activePortfolio.id}
              portfolioCurrency={activePortfolio.base_currency}
              networks={txidNetworks}
              action={createTxidLedgerEntryAction}
            />
          ) : (
            <ManualLedgerForm
              portfolioId={activePortfolio.id}
              portfolioCurrency={activePortfolio.base_currency}
              defaults={defaults}
              isEditing={isEditing}
              action={isEditing ? updateManualLedgerEntryAction : createManualLedgerEntryAction}
            />
          )}
        </article>

        <article className="list-card">
          <span className="eyebrow">Recent Activity</span>
          <h2>{recentEntries.length} latest transactions</h2>
          <p className="section-copy">
            This gives you quick context while you add or edit trades inside the active portfolio.
          </p>

          {recentEntries.length === 0 ? (
            <div className="empty-state">
              <strong>No trades yet</strong>
              <span>The first saved transaction will show up here right away.</span>
            </div>
          ) : (
            <div className="activity-list">
              {recentEntries.map((entry) => (
                <article key={entry.id} className="activity-item">
                  <div className="activity-item-header">
                    <strong>{entry.asset?.symbol || "Unknown"}</strong>
                    <span className={`type-pill type-pill-${entry.entryType}`}>
                      {entry.entryType.toUpperCase()}
                    </span>
                  </div>

                  <div className="activity-copy">
                    <span>{entry.chain?.name || "No network set"}</span>
                    <span>{formatQuantity(entry.quantity)}</span>
                    <span>{formatCurrencyValue(entry.grossValue, entry.currencyCode)}</span>
                  </div>

                  <div className="activity-copy">
                    <span>{formatDateTime(entry.occurredAt)}</span>
                    <Link href={`/ledger/add?entryId=${entry.id}`}>Edit</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
