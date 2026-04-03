import {
  createPortfolioAction,
  deletePortfolioAction,
  togglePortfolioArchiveAction,
  updatePortfolioAction
} from "@/app/(app)/portfolios/actions";
import { PortfolioDeleteButton } from "@/components/portfolio-delete-button";
import { getAuthenticatedContext } from "@/lib/auth";
import { baseCurrencyOptions } from "@/lib/currencies";
import { getFlashMessages } from "@/lib/flash";
import { getActivePortfolioState, getPortfolioActivitySummaries } from "@/lib/portfolios";
import { formatDateTime } from "@/lib/format";

type PortfoliosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function PortfoliosPage({ searchParams }: PortfoliosPageProps) {
  const [authContext, { activePortfolioId, portfolios }, activitySummaries, { message, error }] = await Promise.all([
    getAuthenticatedContext(),
    getActivePortfolioState(),
    getPortfolioActivitySummaries(),
    getFlashMessages(searchParams)
  ]);
  const profileDefaultCurrency = authContext?.profile?.default_currency?.toLowerCase() || "usd";

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">Portfolio Model</span>
          <h1>Multiple portfolios per account</h1>
          <p className="page-subtitle">
            Phase 1 should let each user create separate portfolios for long-term, trading, and any
            other strategy bucket they want to track independently.
          </p>
        </div>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      <div className="two-column">
        <article className="list-card">
          <span className="eyebrow">Create</span>
          <h2>Add a new portfolio</h2>
          <p className="section-copy">
            Start separate workspaces for long-term investing, trading, or any other strategy bucket
            you want to track independently.
          </p>

          <form className="auth-form" action={createPortfolioAction}>
            <label>
              <span>Name</span>
              <input type="text" name="name" placeholder="Long-Term" required />
            </label>

            <label>
              <span>Base Currency</span>
              <select name="baseCurrency" defaultValue={profileDefaultCurrency} required>
                {baseCurrencyOptions.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
                {!baseCurrencyOptions.some((currency) => currency.value === profileDefaultCurrency) ? (
                  <option value={profileDefaultCurrency}>
                    {profileDefaultCurrency.toUpperCase()} - Profile default
                  </option>
                ) : null}
              </select>
            </label>

            <label>
              <span>Description</span>
              <input
                type="text"
                name="description"
                placeholder="Optional notes about the strategy or purpose."
              />
            </label>

            <button type="submit" className="button-primary">
              Create Portfolio
            </button>
          </form>
        </article>

        <article className="list-card">
          <span className="eyebrow">Current State</span>
          <h2>{portfolios.length} total portfolio{portfolios.length === 1 ? "" : "s"}</h2>
          <p className="section-copy">
            {activePortfolioId
              ? "One portfolio is now marked active. You can switch that active workspace any time from the left sidebar."
              : "No active portfolio is set yet. Create one, then switch it from the left sidebar."}
          </p>
        </article>
      </div>

      <div className="portfolio-stack">
        {portfolios.length === 0 ? (
          <article className="list-card">
            <span className="eyebrow">No Portfolios Yet</span>
            <h2>Create the first one</h2>
            <p className="section-copy">
              Once your first portfolio exists, the app shell can use it as the active workspace for
              dashboard and future manual ledger flows.
            </p>
          </article>
        ) : (
          portfolios.map((portfolio) => {
            const isActive = portfolio.id === activePortfolioId;
            const activity = activitySummaries.get(portfolio.id) || {
              tradeCount: 0,
              walletCount: 0,
              latestOccurredAt: null
            };

            return (
              <article key={portfolio.id} className="list-card portfolio-card">
                <div className="portfolio-card-header">
                  <div>
                    <span className="eyebrow">{portfolio.base_currency.toUpperCase()}</span>
                    <h2>{portfolio.name}</h2>
                    <p className="section-copy">
                      {portfolio.description || "No description added yet."}
                    </p>

                    <div className="portfolio-activity-row">
                      <span className="pill">{activity.tradeCount} trade{activity.tradeCount === 1 ? "" : "s"}</span>
                      <span className="pill">{activity.walletCount} wallet{activity.walletCount === 1 ? "" : "s"}</span>
                      <span className="pill">
                        {activity.latestOccurredAt
                          ? `Last trade ${formatDateTime(activity.latestOccurredAt)}`
                          : "No trade activity yet"}
                      </span>
                    </div>
                  </div>

                  <div className="portfolio-badges">
                    {isActive ? <span className="status-chip">Active</span> : null}
                    {portfolio.is_archived ? <span className="status-chip status-chip-muted">Archived</span> : null}
                  </div>
                </div>

                <div className="portfolio-actions">
                  <form action={togglePortfolioArchiveAction}>
                    <input type="hidden" name="portfolioId" value={portfolio.id} />
                    <input
                      type="hidden"
                      name="archive"
                      value={portfolio.is_archived ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className="button-secondary"
                    >
                      {portfolio.is_archived ? "Restore" : "Archive"}
                    </button>
                  </form>

                  <form action={deletePortfolioAction}>
                    <input type="hidden" name="portfolioId" value={portfolio.id} />
                    <PortfolioDeleteButton portfolioName={portfolio.name} />
                  </form>
                </div>

                <form className="portfolio-edit-form" action={updatePortfolioAction}>
                  <input type="hidden" name="portfolioId" value={portfolio.id} />

                  <label>
                    <span>Name</span>
                    <input type="text" name="name" defaultValue={portfolio.name} required />
                  </label>

                  <label>
                    <span>Base Currency</span>
                    <select name="baseCurrency" defaultValue={portfolio.base_currency.toLowerCase()} required>
                      {baseCurrencyOptions.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                      {!baseCurrencyOptions.some(
                        (currency) => currency.value === portfolio.base_currency.toLowerCase()
                      ) ? (
                        <option value={portfolio.base_currency.toLowerCase()}>
                          {portfolio.base_currency.toUpperCase()} - Existing value
                        </option>
                      ) : null}
                    </select>
                  </label>

                  <label>
                    <span>Description</span>
                    <input
                      type="text"
                      name="description"
                      defaultValue={portfolio.description || ""}
                      placeholder="Optional notes about the portfolio."
                    />
                  </label>

                  <button type="submit" className="button-primary">
                    Save Changes
                  </button>
                </form>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
