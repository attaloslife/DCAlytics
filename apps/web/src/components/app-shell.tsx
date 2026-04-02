import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { setActivePortfolioAction } from "@/app/(app)/portfolios/actions";
import { getAuthenticatedContext } from "@/lib/auth";
import { primaryAppNav } from "@/lib/navigation";
import { getActivePortfolioState } from "@/lib/portfolios";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const [authContext, portfolioState] = await Promise.all([
    getAuthenticatedContext(),
    getActivePortfolioState()
  ]);
  const portfolioCount = portfolioState.portfolios.filter((portfolio) => !portfolio.is_archived).length;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-card">
          <span className="eyebrow">DCAlytics</span>
          <h1>Portfolio Workspace</h1>
          <p>
            The authenticated shell now includes portfolio switching plus the first real database-backed
            ledger workflow for manual trades.
          </p>
        </div>

        <div className="sidebar-account">
          <strong>{authContext?.profile?.display_name || authContext?.email || "Authenticated user"}</strong>
          <span>{portfolioCount} live portfolio{portfolioCount === 1 ? "" : "s"}</span>
        </div>

        <form action={setActivePortfolioAction} className="portfolio-switcher">
          <span>Active Portfolio</span>
          <input type="hidden" name="returnTo" value="/dashboard" />
          <select
            name="portfolioId"
            defaultValue={portfolioState.activePortfolioId}
            aria-label="Select active portfolio"
            disabled={!portfolioState.portfolios.length}
          >
            {portfolioState.portfolios.length === 0 ? (
              <option value="">No portfolios yet</option>
            ) : (
              portfolioState.portfolios
                .filter((portfolio) => !portfolio.is_archived)
                .map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))
            )}
          </select>
          {portfolioState.portfolios.length === 0 ? (
            <Link href="/portfolios" className="button-secondary sidebar-button">
              Create a Portfolio
            </Link>
          ) : (
            <button
              type="submit"
              className="button-secondary sidebar-button"
              disabled={!portfolioState.portfolios.length}
            >
              Switch Portfolio
            </button>
          )}
        </form>

        {portfolioState.activePortfolio ? (
          <div className="sidebar-note">
            <span className="status-dot status-dot-ready" />
            Active: {portfolioState.activePortfolio.name}
          </div>
        ) : (
          <div className="sidebar-note">
            <span className="status-dot" />
            Create your first portfolio to continue
          </div>
        )}

        <nav className="sidebar-nav" aria-label="Primary">
          {primaryAppNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-actions">
          <Link href="/portfolios" className="button-secondary sidebar-button">
            Manage Portfolios
          </Link>

          <form action={signOutAction}>
            <button type="submit" className="button-secondary sidebar-button sidebar-button-full">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
