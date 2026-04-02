import {
  createWalletAddressAction,
  deleteWalletAddressAction,
  toggleWalletAddressStatusAction
} from "@/app/(app)/wallets/actions";
import { getManualLedgerCatalog } from "@/lib/catalog";
import { getFlashMessages } from "@/lib/flash";
import {
  formatCompactHash,
  formatCurrencyValue,
  formatDateTime,
  formatQuantity
} from "@/lib/format";
import { getActivePortfolioState } from "@/lib/portfolios";
import { getWalletLivePreviewSummary, getWalletLivePreviews } from "@/lib/wallet-preview";
import {
  formatWalletAddress,
  getWalletAddressesForPortfolio,
  getWalletSummary
} from "@/lib/wallets";

type WalletsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function WalletsPage({ searchParams }: WalletsPageProps) {
  const [{ activePortfolio }, { message, error }] = await Promise.all([
    getActivePortfolioState(),
    getFlashMessages(searchParams)
  ]);

  if (!activePortfolio) {
    return (
      <section className="content-card">
        <header className="page-header">
          <div>
            <span className="eyebrow">Wallet Tracking</span>
            <h1>Track public addresses</h1>
            <p className="page-subtitle">
              Wallet tracking is portfolio-aware, so it needs an active portfolio before it can save an
              address.
            </p>
          </div>
        </header>

        <article className="list-card empty-state-card">
          <span className="eyebrow">Portfolio Required</span>
          <h2>Create or activate a portfolio</h2>
          <p className="section-copy">
            Once a portfolio is active, this page will let you paste public wallet addresses and attach
            them to that specific strategy bucket.
          </p>
        </article>
      </section>
    );
  }

  const [{ chains }, wallets] = await Promise.all([
    getManualLedgerCatalog(),
    getWalletAddressesForPortfolio(activePortfolio.id)
  ]);
  const summary = getWalletSummary(wallets);
  const previews = await getWalletLivePreviews(wallets, "usd");
  const previewSummary = getWalletLivePreviewSummary(previews);
  const previewByWalletId = new Map(previews.map((preview) => [preview.walletId, preview]));

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">Wallet Tracking</span>
          <h1>Track public addresses</h1>
          <p className="page-subtitle">
            {activePortfolio.name} can now hold public wallet addresses and fetch a read-only live
            preview for balances and rough USD value without wallet connect.
          </p>
        </div>

        <div className="status-chip">Read-only Live Preview</div>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      <div className="summary-grid">
        <article className="metric-card">
          <span>Total Wallets</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="metric-card">
          <span>Active</span>
          <strong>{summary.active}</strong>
        </article>
        <article className="metric-card">
          <span>Owned</span>
          <strong>{summary.owned}</strong>
        </article>
        <article className="metric-card">
          <span>Watched</span>
          <strong>{summary.watched}</strong>
        </article>
        <article className="metric-card">
          <span>Live Previewed</span>
          <strong>{previewSummary.previewedWalletCount}</strong>
        </article>
        <article className="metric-card">
          <span>Rough USD Value</span>
          <strong>{formatCurrencyValue(previewSummary.totalValue, "usd")}</strong>
        </article>
      </div>

      <div className="two-column">
        <article className="list-card">
          <span className="eyebrow">Add Wallet</span>
          <h2>Attach a public address</h2>
          <p className="section-copy">
            This saves the wallet into the active portfolio and validates the address against the chosen
            chain family before it is stored.
          </p>

          <form className="ledger-form" action={createWalletAddressAction}>
            <input type="hidden" name="portfolioId" value={activePortfolio.id} />

            <label className="field-group">
              <span>Chain</span>
              <select name="chainId" required defaultValue="">
                <option value="" disabled>
                  Select a chain
                </option>
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>Public Address</span>
              <input
                type="text"
                name="address"
                placeholder="Paste a wallet address"
                autoComplete="off"
                required
              />
            </label>

            <label className="field-group">
              <span>Label</span>
              <input
                type="text"
                name="label"
                placeholder="Optional label like Ledger, Trading Hot Wallet, or Treasury"
              />
            </label>

            <label className="field-group">
              <span>Ownership</span>
              <select name="ownershipType" defaultValue="owned">
                <option value="owned">Owned</option>
                <option value="watched">Watched</option>
              </select>
            </label>

            <div className="inline-note">
              Live previews are read-only and non-persistent for now, so you can inspect balances
              safely before we wire in background sync.
            </div>

            <div className="inline-actions">
              <button type="submit" className="button-primary">
                Add Wallet
              </button>
            </div>
          </form>
        </article>

        <article className="list-card">
          <span className="eyebrow">Supported Now</span>
          <h2>Chain-aware validation</h2>
          <p className="section-copy">
            Wallet validation understands the chain family, so EVM, Bitcoin, and Solana addresses are
            checked differently before they ever hit the database.
          </p>

          <div className="pill-row">
            {chains.map((chain) => (
              <span key={chain.id} className="pill">
                {chain.name}
              </span>
            ))}
          </div>

          <div className="inline-note">
            Bitcoin, EVM, and Solana addresses now fetch a live preview. Values are rough and USD-based
            for this first pass, and long-tail token pricing should be treated carefully until scam
            filtering lands.
          </div>
        </article>
      </div>

      <article className="list-card wallet-preview-overview">
        <span className="eyebrow">Coverage</span>
        <h2>Live wallet preview status</h2>
        <p className="section-copy">
          This first version is intentionally read-only. It fetches live balances when the page loads,
          does not write provider data into the database yet, and keeps unsupported chains attached to
          the portfolio for later sync work.
        </p>

        <div className="wallet-preview-meta-grid">
          <div className="inline-note">
            <strong>{previewSummary.readyWalletCount}</strong>
            <span> wallets have full live preview coverage.</span>
          </div>
          <div className="inline-note">
            <strong>{previewSummary.partialWalletCount}</strong>
            <span> wallets returned partial data and may need manual review.</span>
          </div>
          <div className="inline-note">
            <strong>{previewSummary.errorWalletCount}</strong>
            <span> wallets hit provider errors but stay saved safely.</span>
          </div>
          <div className="inline-note">
            <strong>{previewSummary.unsupportedWalletCount}</strong>
            <span> wallets are waiting on future chain support.</span>
          </div>
        </div>
      </article>

      <div className="portfolio-stack">
        {wallets.length === 0 ? (
          <article className="list-card">
            <span className="eyebrow">No Wallets Yet</span>
            <h2>Add the first address</h2>
            <p className="section-copy">
              Once you save a wallet here, it becomes the base record we can grow into balances, NFTs,
              DeFi positions, and transfer-aware wallet sync.
            </p>
          </article>
        ) : (
          wallets.map((wallet) => {
            const preview = previewByWalletId.get(wallet.id);
            const topHoldings = preview?.holdings.slice(0, 8) ?? [];
            const hiddenHoldingsCount = Math.max((preview?.holdings.length ?? 0) - topHoldings.length, 0);
            const previewStatusLabel =
              preview?.status === "ready"
                ? "Live"
                : preview?.status === "partial"
                  ? "Partial"
                  : preview?.status === "error"
                    ? "Error"
                    : preview?.status === "inactive"
                      ? "Paused"
                      : "Unsupported";
            const previewStatusClass =
              preview?.status === "ready"
                ? "status-chip status-chip-success"
                : preview?.status === "partial"
                  ? "status-chip status-chip-warning"
                  : preview?.status === "error"
                    ? "status-chip status-chip-danger"
                    : "status-chip status-chip-muted";

            return (
              <article key={wallet.id} className="list-card portfolio-card wallet-card">
                <div className="portfolio-card-header">
                  <div>
                    <span className="eyebrow">{wallet.chain?.name || "Unknown Chain"}</span>
                    <h2>{wallet.label || formatWalletAddress(wallet.address)}</h2>
                    <p className="section-copy address-block">{wallet.address}</p>
                    <p className="wallet-meta">
                      Added {formatDateTime(wallet.createdAt)}
                      {wallet.chain?.nativeSymbol ? ` - Native ${wallet.chain.nativeSymbol}` : ""}
                    </p>
                  </div>

                  <div className="portfolio-badges">
                    <span className={`status-chip${wallet.isActive ? "" : " status-chip-muted"}`}>
                      {wallet.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="status-chip status-chip-muted">
                      {wallet.ownershipType === "owned" ? "Owned" : "Watched"}
                    </span>
                    <span className={previewStatusClass}>{previewStatusLabel}</span>
                  </div>
                </div>

                {preview ? (
                  <section className="wallet-preview-block">
                    <div className="wallet-preview-header">
                      <div>
                        <span className="eyebrow">Live Preview</span>
                        <h3>{formatCurrencyValue(preview.totalValue, preview.currencyCode)}</h3>
                        <p className="wallet-meta">
                          {preview.provider} refreshed {formatDateTime(preview.fetchedAt)}
                        </p>
                      </div>

                      <div className="wallet-preview-metrics">
                        <div className="wallet-preview-stat">
                          <span>Balances</span>
                          <strong>{preview.holdings.length}</strong>
                        </div>
                        <div className="wallet-preview-stat">
                          <span>Priced</span>
                          <strong>{preview.pricedHoldingsCount}</strong>
                        </div>
                      </div>
                    </div>

                    {preview.note ? <div className="inline-note">{preview.note}</div> : null}
                    {preview.errorMessage ? (
                      <div className="banner banner-error wallet-preview-banner">{preview.errorMessage}</div>
                    ) : null}

                    {topHoldings.length === 0 ? (
                      <div className="inline-note">
                        No positive balances are showing yet for this wallet. The address is still saved
                        and ready for future sync passes.
                      </div>
                    ) : (
                      <div className="wallet-holdings">
                        {topHoldings.map((holding) => (
                          <article key={holding.id} className="activity-item wallet-holding-item">
                            <div className="activity-item-header">
                              <div>
                                <strong>{holding.symbol}</strong>
                                <span>
                                  {holding.name}
                                  {holding.isNative
                                    ? " - Native asset"
                                    : holding.contractAddress
                                      ? ` - ${formatCompactHash(holding.contractAddress)}`
                                      : ""}
                                </span>
                              </div>
                              <strong>{formatCurrencyValue(holding.value, holding.currencyCode)}</strong>
                            </div>

                            <div className="activity-copy">
                              <span>
                                {formatQuantity(holding.balance)} {holding.symbol}
                              </span>
                              <span>
                                {holding.price !== null
                                  ? `${formatCurrencyValue(holding.price, holding.currencyCode)} each`
                                  : "Price unavailable"}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}

                    {hiddenHoldingsCount > 0 ? (
                      <div className="wallet-preview-footnote">
                        Showing the top {topHoldings.length} balances by rough value. {hiddenHoldingsCount}{" "}
                        additional balances are still attached to this wallet.
                      </div>
                    ) : null}
                  </section>
                ) : null}

                <div className="wallet-actions">
                  <form action={toggleWalletAddressStatusAction}>
                    <input type="hidden" name="walletId" value={wallet.id} />
                    <input type="hidden" name="portfolioId" value={activePortfolio.id} />
                    <input type="hidden" name="isActive" value={wallet.isActive ? "false" : "true"} />
                    <button type="submit" className="button-secondary">
                      {wallet.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </form>

                  <form action={deleteWalletAddressAction}>
                    <input type="hidden" name="walletId" value={wallet.id} />
                    <input type="hidden" name="portfolioId" value={activePortfolio.id} />
                    <button type="submit" className="button-secondary table-action-danger">
                      Remove
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
