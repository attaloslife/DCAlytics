import Link from "next/link";

import { getExchangeConnectionsForPortfolio } from "@/lib/exchanges";
import { getFlashMessages } from "@/lib/flash";
import { formatCurrencyValue, formatDateTime, formatQuantity } from "@/lib/format";
import { getRequestLocale } from "@/lib/i18n";
import { getLedgerEntriesForPortfolio, getLedgerPositions, getLedgerSummary } from "@/lib/ledger";
import { getOrFetchSpotPrices } from "@/lib/market-data";
import { getActivePortfolioState } from "@/lib/portfolios";
import { formatMessage } from "@/lib/text";
import { getWalletAddressesForPortfolio } from "@/lib/wallets";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [locale, { activePortfolio, portfolios }, { message, error }] = await Promise.all([
    getRequestLocale(),
    getActivePortfolioState(),
    getFlashMessages(searchParams)
  ]);
  const copy =
    locale === "tr"
      ? {
          eyebrow: "Panel",
          title: "Portfoy genel gorunumu",
          activeSubtitle:
            "Aktif portfoy: {portfolioName}. Panel, acik pozisyonlari artik ham canli saglayici cagrilari yerine dahili piyasa verisi onbellekleri uzerinden fiyatliyor.",
          inactiveSubtitle: "Bu alan korunuyor ve ilk portfoyunuz icin hazir.",
          priceSnapshotsActive: "Fiyat Anlik Goruntuleri Aktif",
          noActivePortfolio: "Aktif portfoy yok",
          summaryCards: {
            portfolios: {
              label: "Portfoyler",
              copy: "Portfoy degistirme, giris yapilan calisma alaninin genelinde aktif."
            },
            trades: {
              label: "Islemler",
              activeCopy: "Kayit girdileri {portfolioName} icin Postgres'ten yukleniyor.",
              inactiveCopy: "Birlesik kaydi olusturmaya baslamak icin bir portfoy olusturun."
            },
            openCoins: {
              label: "Acik Coinler",
              activeCopy:
                "Acik pozisyonlar kayittan toplanir ve piyasa verisi onbellegi ile fiyatlanir.",
              inactiveCopy:
                "Acik pozisyonlari fiyatlamaya baslamak icin bir portfoy etkinlestirin."
            },
            wallets: {
              label: "Cuzdanlar",
              activeCopy: "Kayitli herkese acik adresler halen canli cüzdan onizlemesini besliyor.",
              inactiveCopy:
                "Herkese acik cüzdan adresleri eklemeye baslamak icin bir portfoy etkinlestirin."
            },
            exchanges: {
              label: "Borsalar",
              activeCopy:
                "Salt-okunur borsa baglanti profilleri artik portfoy bazli kaydediliyor ve senkron isleri icin hazir.",
              inactiveCopy:
                "Borsa baglanti profilleri eklemeye baslamak icin bir portfoy etkinlestirin."
            },
            portfolioValue: {
              label: "Portfoy Degeri",
              activeCopy:
                "Bu alan once onbelleklenmis anlik fiyatlari kullanir, sonra sadece eksik fiyatlari fiyat anlik goruntulerine ceker.",
              inactiveCopy: "Panel fiyatlamasini acmak icin bir portfoy olusturun."
            },
            priceCoverage: {
              label: "Fiyat Kapsami",
              activeCopy:
                "Kapsam, acik pozisyonlardan kacinin onbelleklenmis veya yenilenmis anlik fiyata sahip oldugunu gosterir.",
              inactiveCopy: "Bir portfoy aktif oldugunda fiyat kapsami burada gorunur."
            }
          },
          ledgerState: {
            eyebrow: "Kayit Durumu",
            activeCopy:
              "Alim hacmi ve komisyonlar dogrudan {portfolioName} icinden yuklenirken, anlik fiyatlar saglayici yukunu azaltmak icin fiyat anlik goruntulerine yonlendiriliyor.",
            inactiveCopy: "Canli kayit akislarini acmak icin ilk portfoyunuzu olusturun.",
            addTransaction: "Islem Ekle",
            openTradeLog: "Islem Gecmisini Ac",
            trackWallets: "Cuzdanlari Takip Et",
            connectExchanges: "Borsa Bagla"
          },
          valuation: {
            eyebrow: "Degerleme",
            activeCopy:
              "{count} fiyatlanmis pozisyon{suffix}, anlik goruntu destekli mevcut portfoy degerine katkida bulunuyor.",
            inactiveCopy: "Mevcut degerleme, bir portfoy aktif oldugunda gorunur.",
            missingPrices:
              "Bazi acik pozisyonlarin henuz anlik fiyati yok. Piyasa kimligi hazir olana veya saglayici fiyat verene kadar degerleri dahil edilmez."
          },
          positions: {
            eyebrow: "Acik Pozisyonlar",
            title: "Mevcut varliklar",
            copy:
              "Acik miktarlar alim ve satimlardan toplanir, sonra fiyat anlik goruntu onbelleği ile degerlenir.",
            noActiveTitle: "Aktif portfoy yok",
            noActiveCopy:
              "Mevcut varliklari gormek icin once bir portfoy olusturun veya etkinlestirin.",
            emptyTitle: "Henuz acik pozisyon yok",
            emptyCopy:
              "Bir islem ekleyin; panel acik varliklari burada takip etmeye baslar.",
            headers: {
              coin: "Coin",
              quantity: "Miktar",
              averageCost: "Ort. Maliyet",
              currentPrice: "Guncel Fiyat",
              costBasis: "Maliyet Bazi",
              value: "Deger",
              lastTrade: "Son Islem"
            }
          }
        }
      : {
          eyebrow: "Dashboard",
          title: "Portfolio overview",
          activeSubtitle:
            "Active portfolio: {portfolioName}. The dashboard now prices open positions through the internal market-data cache instead of depending on raw live provider calls.",
          inactiveSubtitle: "This route group is protected and ready for your first portfolio.",
          priceSnapshotsActive: "Price Snapshots Active",
          noActivePortfolio: "No active portfolio",
          summaryCards: {
            portfolios: {
              label: "Portfolios",
              copy: "Portfolio switching stays live across the authenticated workspace."
            },
            trades: {
              label: "Trades",
              activeCopy: "Ledger entries are loading from Postgres for {portfolioName}.",
              inactiveCopy: "Create a portfolio to start building the unified ledger."
            },
            openCoins: {
              label: "Open Coins",
              activeCopy:
                "Open positions are aggregated from the ledger and priced through the market-data cache.",
              inactiveCopy: "Activate a portfolio to start pricing open positions."
            },
            wallets: {
              label: "Wallets",
              activeCopy: "Saved public addresses still feed the live wallet preview.",
              inactiveCopy: "Activate a portfolio to start attaching public wallet addresses."
            },
            exchanges: {
              label: "Exchanges",
              activeCopy:
                "Read-only exchange connection profiles are now saved per portfolio and ready for sync work.",
              inactiveCopy:
                "Activate a portfolio to start attaching exchange connection profiles."
            },
            portfolioValue: {
              label: "Portfolio Value",
              activeCopy:
                "This uses cached spot prices first, then only fetches missing prices into price snapshots.",
              inactiveCopy: "Create a portfolio to unlock dashboard pricing."
            },
            priceCoverage: {
              label: "Price Coverage",
              activeCopy:
                "Coverage shows how many open positions currently have a cached or refreshed spot price.",
              inactiveCopy: "Price coverage will appear once a portfolio is active."
            }
          },
          ledgerState: {
            eyebrow: "Ledger State",
            activeCopy:
              "Buy volume and fees are loading directly from {portfolioName}, while spot pricing is now routed through price snapshots to reduce provider pressure.",
            inactiveCopy: "Create your first portfolio to unlock the live ledger workflow.",
            addTransaction: "Add Transaction",
            openTradeLog: "Open Trade Log",
            trackWallets: "Track Wallets",
            connectExchanges: "Connect Exchanges"
          },
          valuation: {
            eyebrow: "Valuation",
            activeCopy:
              "{count} priced position{suffix} currently contribute to the snapshot-backed portfolio value.",
            inactiveCopy: "Current valuation appears once a portfolio is active.",
            missingPrices:
              "Some open positions still do not have a spot price. Their value is excluded until a market ID is available or the provider returns pricing."
          },
          positions: {
            eyebrow: "Open Positions",
            title: "Current holdings",
            copy:
              "Open quantities are aggregated from buys and sells, then valued with the price snapshot cache.",
            noActiveTitle: "No active portfolio",
            noActiveCopy:
              "Create or activate a portfolio first to see current holdings.",
            emptyTitle: "No open positions yet",
            emptyCopy:
              "Add a trade and the dashboard will start tracking open holdings here.",
            headers: {
              coin: "Coin",
              quantity: "Quantity",
              averageCost: "Avg Cost",
              currentPrice: "Current Price",
              costBasis: "Cost Basis",
              value: "Value",
              lastTrade: "Last Trade"
            }
          }
        };
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
      label: copy.summaryCards.portfolios.label,
      value: `${portfolios.length}`,
      copy: copy.summaryCards.portfolios.copy
    },
    {
      label: copy.summaryCards.trades.label,
      value: activePortfolio ? `${summary.entryCount}` : "0",
      copy: activePortfolio
        ? formatMessage(copy.summaryCards.trades.activeCopy, {
            portfolioName: activePortfolio.name
          })
        : copy.summaryCards.trades.inactiveCopy
    },
    {
      label: copy.summaryCards.openCoins.label,
      value: activePortfolio ? `${positions.length}` : "0",
      copy: activePortfolio
        ? copy.summaryCards.openCoins.activeCopy
        : copy.summaryCards.openCoins.inactiveCopy
    },
    {
      label: copy.summaryCards.wallets.label,
      value: activePortfolio ? `${wallets.length}` : "0",
      copy: activePortfolio
        ? copy.summaryCards.wallets.activeCopy
        : copy.summaryCards.wallets.inactiveCopy
    },
    {
      label: copy.summaryCards.exchanges.label,
      value: activePortfolio ? `${exchanges.length}` : "0",
      copy: activePortfolio
        ? copy.summaryCards.exchanges.activeCopy
        : copy.summaryCards.exchanges.inactiveCopy
    },
    {
      label: copy.summaryCards.portfolioValue.label,
      value: activePortfolio
        ? formatCurrencyValue(portfolioValue, activePortfolio.base_currency)
        : copy.noActivePortfolio,
      copy: activePortfolio
        ? copy.summaryCards.portfolioValue.activeCopy
        : copy.summaryCards.portfolioValue.inactiveCopy
    },
    {
      label: copy.summaryCards.priceCoverage.label,
      value: priceCoverage,
      copy: activePortfolio
        ? copy.summaryCards.priceCoverage.activeCopy
        : copy.summaryCards.priceCoverage.inactiveCopy
    }
  ];

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p className="page-subtitle">
            {activePortfolio
              ? formatMessage(copy.activeSubtitle, {
                  portfolioName: activePortfolio.name
                })
              : copy.inactiveSubtitle}
          </p>
        </div>

        <div className="status-chip">{copy.priceSnapshotsActive}</div>
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
          <span className="eyebrow">{copy.ledgerState.eyebrow}</span>
          <h2>
            {activePortfolio
              ? formatCurrencyValue(summary.buyVolume, activePortfolio.base_currency)
              : copy.noActivePortfolio}
          </h2>
          <p className="section-copy">
            {activePortfolio
              ? formatMessage(copy.ledgerState.activeCopy, {
                  portfolioName: activePortfolio.name
                })
              : copy.ledgerState.inactiveCopy}
          </p>

          {activePortfolio ? (
            <div className="inline-actions">
              <Link href="/ledger/add" className="button-primary">
                {copy.ledgerState.addTransaction}
              </Link>
              <Link href="/ledger" className="button-secondary">
                {copy.ledgerState.openTradeLog}
              </Link>
              <Link href="/wallets" className="button-secondary">
                {copy.ledgerState.trackWallets}
              </Link>
              <Link href="/exchanges" className="button-secondary">
                {copy.ledgerState.connectExchanges}
              </Link>
            </div>
          ) : null}
        </article>

        <article className="list-card">
          <span className="eyebrow">{copy.valuation.eyebrow}</span>
          <h2>
            {activePortfolio
              ? formatCurrencyValue(portfolioCostBasis, activePortfolio.base_currency)
              : copy.noActivePortfolio}
          </h2>
          <p className="section-copy">
            {activePortfolio
              ? formatMessage(copy.valuation.activeCopy, {
                  count: pricedPositions.length,
                  suffix: locale === "en" && pricedPositions.length !== 1 ? "s" : ""
                })
              : copy.valuation.inactiveCopy}
          </p>

          {activePortfolio && positionsWithPrices.some((position) => position.currentPrice === null) ? (
            <div className="inline-note">
              {copy.valuation.missingPrices}
            </div>
          ) : null}
        </article>
      </div>

      <article className="list-card dashboard-positions-card">
        <div className="page-header">
          <div>
            <span className="eyebrow">{copy.positions.eyebrow}</span>
            <h2>{copy.positions.title}</h2>
            <p className="section-copy">{copy.positions.copy}</p>
          </div>
        </div>

        {!activePortfolio ? (
          <div className="empty-state">
            <strong>{copy.positions.noActiveTitle}</strong>
            <span>{copy.positions.noActiveCopy}</span>
          </div>
        ) : positionsWithPrices.length === 0 ? (
          <div className="empty-state">
            <strong>{copy.positions.emptyTitle}</strong>
            <span>{copy.positions.emptyCopy}</span>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{copy.positions.headers.coin}</th>
                  <th>{copy.positions.headers.quantity}</th>
                  <th>{copy.positions.headers.averageCost}</th>
                  <th>{copy.positions.headers.currentPrice}</th>
                  <th>{copy.positions.headers.costBasis}</th>
                  <th>{copy.positions.headers.value}</th>
                  <th>{copy.positions.headers.lastTrade}</th>
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
