import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { setActivePortfolioAction } from "@/app/(app)/portfolios/actions";
import { getAuthenticatedContext } from "@/lib/auth";
import { getRequestLocale } from "@/lib/i18n";
import { getPrimaryAppNav } from "@/lib/navigation";
import { getActivePortfolioState } from "@/lib/portfolios";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const [locale, authContext, portfolioState] = await Promise.all([
    getRequestLocale(),
    getAuthenticatedContext(),
    getActivePortfolioState()
  ]);
  const portfolioCount = portfolioState.portfolios.filter((portfolio) => !portfolio.is_archived).length;
  const primaryAppNav = getPrimaryAppNav(locale);
  const copy =
    locale === "tr"
      ? {
          eyebrow: "PrismFolio",
          title: "Portfoyunuz, odakta.",
          description:
            "Portfoylerinizi, islemlerinizi, cuzdanlarinizi ve bagli veri kaynaklarinizi tek bir calisma alaninda duzenli tutun.",
          accountFallback: "Dogrulanmis kullanici",
          livePortfolioSingular: "aktif portfoy",
          livePortfolioPlural: "aktif portfoy",
          activePortfolio: "Aktif Portfoy",
          selectActivePortfolio: "Aktif portfoyu sec",
          noPortfoliosYet: "Henuz portfoy yok",
          createPortfolio: "Portfoy Olustur",
          switchPortfolio: "Portfoyu Degistir",
          activePrefix: "Aktif",
          noActivePortfolio: "Devam etmek icin ilk portfoyunuzu olusturun",
          signOut: "Cikis Yap"
        }
      : {
          eyebrow: "PrismFolio",
          title: "Your portfolio, in focus.",
          description:
            "Keep your portfolios, trades, wallets, and connected data sources organized in one workspace.",
          accountFallback: "Authenticated user",
          livePortfolioSingular: "live portfolio",
          livePortfolioPlural: "live portfolios",
          activePortfolio: "Active Portfolio",
          selectActivePortfolio: "Select active portfolio",
          noPortfoliosYet: "No portfolios yet",
          createPortfolio: "Create a Portfolio",
          switchPortfolio: "Switch Portfolio",
          activePrefix: "Active",
          noActivePortfolio: "Create your first portfolio to continue",
          signOut: "Sign Out"
        };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-card">
          <Image
            src="/prismfolio-mark.svg"
            alt="PrismFolio"
            width={72}
            height={72}
            className="sidebar-brand-mark"
            priority
          />
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>

        <div className="sidebar-account">
          <strong>
            {authContext?.profile?.display_name || authContext?.email || copy.accountFallback}
          </strong>
          <span>
            {portfolioCount}{" "}
            {portfolioCount === 1 ? copy.livePortfolioSingular : copy.livePortfolioPlural}
          </span>
        </div>

        <form action={setActivePortfolioAction} className="portfolio-switcher">
          <span>{copy.activePortfolio}</span>
          <input type="hidden" name="returnTo" value="/dashboard" />
          <select
            name="portfolioId"
            defaultValue={portfolioState.activePortfolioId}
            aria-label={copy.selectActivePortfolio}
            disabled={!portfolioState.portfolios.length}
          >
            {portfolioState.portfolios.length === 0 ? (
              <option value="">{copy.noPortfoliosYet}</option>
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
              {copy.createPortfolio}
            </Link>
          ) : (
            <button
              type="submit"
              className="button-secondary sidebar-button"
              disabled={!portfolioState.portfolios.length}
            >
              {copy.switchPortfolio}
            </button>
          )}
        </form>

        {portfolioState.activePortfolio ? (
          <div className="sidebar-note">
            <span className="status-dot status-dot-ready" />
            {copy.activePrefix}: {portfolioState.activePortfolio.name}
          </div>
        ) : (
          <div className="sidebar-note">
            <span className="status-dot" />
            {copy.noActivePortfolio}
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
          <form action={signOutAction}>
            <button type="submit" className="button-secondary sidebar-button sidebar-button-full">
              {copy.signOut}
            </button>
          </form>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
