import Image from "next/image";
import Link from "next/link";

import { getAuthenticatedContext } from "@/lib/auth";
import { getRequestLocale } from "@/lib/i18n";
import { formatMessage } from "@/lib/text";

const landingCopy = {
  en: {
    eyebrow: "Unified Tracking",
    title: "Track trades, wallets, TXIDs, and exchange activity in one place.",
    copy:
      "PrismFolio helps you track your crypto portfolio with more clarity and less manual mess. Bring trades, wallets, TXIDs, and exchange activity into one organized workspace so you can review holdings, separate strategies, and understand your portfolio more confidently.",
    openDashboard: "Open Dashboard",
    createAccount: "Create Account",
    addTransaction: "Add Transaction",
    signIn: "Sign In",
    accountFallback: "your account",
    stats: {
      trackAcross: {
        label: "Track Across",
        title: "Trades + Wallets",
        copy:
          "Log transactions, review TXIDs, and attach public wallet addresses inside the same workspace."
      },
      getStarted: {
        label: "Get Started",
        signedOutTitle: "Create Your Workspace",
        signedOutCopy:
          "Create an account, open your first portfolio, and start building your crypto tracking setup.",
        signedInTitle: "Resume Anytime",
        signedInCopy:
          "Welcome back, {accountLabel}. Your portfolios and tracking tools are ready when you are."
      },
      builtFor: {
        label: "Built For",
        title: "Long-Term + Trading",
        copy:
          "Keep different strategies separate with multiple portfolios instead of mixing everything together."
      }
    },
    highlights: [
      {
        label: "Portfolio Views",
        title: "Keep every strategy in its own lane",
        copy:
          "Create separate portfolios for long-term investing, active trading, treasury, or experimental positions so your numbers stay clean."
      },
      {
        label: "Trade Tracking",
        title: "Add activity your way",
        copy:
          "Log transactions manually for speed or pull in on-chain activity by TXID and review it before it touches your portfolio history."
      },
      {
        label: "Wallet Visibility",
        title: "See holdings from public addresses",
        copy:
          "Paste a wallet address to inspect tokens and rough value without connecting a wallet or giving the app control over funds."
      },
      {
        label: "Exchange Sync",
        title: "Prepare read-only exchange tracking",
        copy:
          "Set up exchange connection profiles now so balances, fills, and account activity can flow into the same portfolio model next."
      },
      {
        label: "Pricing Layer",
        title: "Get smarter price coverage",
        copy:
          "Spot and historical pricing are routed through internal cache layers so portfolio views stay more stable and less dependent on raw provider calls."
      },
      {
        label: "Portfolio History",
        title: "Keep one record of everything",
        copy:
          "Import trades, export backups, review sessions, and build a single database-backed ledger instead of scattered files and disconnected tools."
      }
    ],
    howItWorks: {
      eyebrow: "How It Works",
      title: "A simple path to organized portfolio tracking",
      copy:
        "PrismFolio is designed to help you bring the important parts of your crypto activity into one clear workflow, from first trade entry to ongoing portfolio review.",
      steps: [
        {
          step: "1",
          title: "Create your account and first portfolio",
          copy:
            "Start with one portfolio, then add more whenever you want to separate long-term investing, trading, or other strategies."
        },
        {
          step: "2",
          title: "Add your activity from different sources",
          copy:
            "Log trades manually, review TXID-based transactions, import files, and connect wallets as your tracking setup grows."
        },
        {
          step: "3",
          title: "Review your holdings in one place",
          copy:
            "See your activity, holdings, and pricing together so your portfolio is easier to understand and manage over time."
        }
      ]
    },
    whyBuild: {
      eyebrow: "Why PrismFolio",
      title: "Made to keep portfolio tracking clearer and simpler",
      copy:
        "Crypto tracking gets messy fast when trades, wallets, and transaction details all live in different places. PrismFolio is designed to bring those pieces together so you can follow your portfolio with less confusion and more confidence.",
      principles: [
        {
          title: "Portfolio-first",
          copy:
            "Give every strategy its own portfolio so long-term investing and active trading do not get mixed together."
        },
        {
          title: "Read-only by design",
          copy:
            "Wallet and exchange connections are built for visibility, not for moving funds or taking control away from you."
        },
        {
          title: "More dependable pricing",
          copy:
            "Price data is handled in a way that helps portfolio views stay steadier and more usable over time."
        }
      ]
    },
    bottomCta: {
      eyebrow: "Start Here",
      signedInTitle: "Pick up where you left off",
      signedOutTitle: "Open the web app and start building your portfolio workspace",
      signedInCopy:
        "Jump back into the dashboard, log new activity, or manage the portfolios and data sources you already created.",
      signedOutCopy:
        "Create an account, open your first portfolio, and start with manual trades, TXIDs, wallets, or imports.",
      openSettings: "Open Settings"
    }
  },
  tr: {
    eyebrow: "Birlesik Takip",
    title: "Islemleri, cuzdanlari, TXID'leri ve borsa hareketlerini tek yerde takip edin.",
    copy:
      "PrismFolio, kripto portfoyunuzu daha net ve daha az karmasayla takip etmenize yardim eder. Islemleri, cuzdanlari, TXID'leri ve borsa hareketlerini tek bir duzenli alanda toplayarak varliklarinizi inceleyebilir, stratejilerinizi ayirabilir ve portfoyunuzu daha guvenle anlayabilirsiniz.",
    openDashboard: "Paneli Ac",
    createAccount: "Hesap Olustur",
    addTransaction: "Islem Ekle",
    signIn: "Giris Yap",
    accountFallback: "hesabiniz",
    stats: {
      trackAcross: {
        label: "Takip Alani",
        title: "Islemler + Cuzdanlar",
        copy:
          "Ayni calisma alaninda islemleri kaydedin, TXID'leri inceleyin ve herkese acik cüzdan adreslerini ekleyin."
      },
      getStarted: {
        label: "Baslangic",
        signedOutTitle: "Calisma Alaninizi Olusturun",
        signedOutCopy:
          "Bir hesap olusturun, ilk portfoyunuzu acin ve kripto takip duzeninizi kurmaya baslayin.",
        signedInTitle: "Kaldiginiz Yerden Devam Edin",
        signedInCopy:
          "Tekrar hos geldiniz, {accountLabel}. Portfoyleriniz ve takip araclariniz hazir."
      },
      builtFor: {
        label: "Kimler Icin",
        title: "Uzun Vade + Trade",
        copy:
          "Her seyi karistirmadan farkli stratejileri ayri portfoylerde takip edin."
      }
    },
    highlights: [
      {
        label: "Portfoy Gorunumu",
        title: "Her stratejiyi ayri tutun",
        copy:
          "Uzun vadeli yatirim, aktif trade veya deneysel pozisyonlar icin ayri portfoyler olusturun; boylece rakamlariniz temiz kalsin."
      },
      {
        label: "Islem Takibi",
        title: "Hareketleri istediginiz gibi ekleyin",
        copy:
          "Hizli olmak icin islemleri manuel ekleyin ya da zincir uzeri hareketleri TXID ile cekip portfoy gecmisine eklemeden once inceleyin."
      },
      {
        label: "Cuzdan Gorunurlugu",
        title: "Herkese acik adreslerden varliklari gorun",
        copy:
          "Bir cüzdani baglamadan veya kontrol vermeden adres yapistirip tokenlari ve yaklasik degerini gorun."
      },
      {
        label: "Borsa Senkronu",
        title: "Salt-okunur borsa takibine hazirlanin",
        copy:
          "Bakiye, emir ve hesap hareketleri daha sonra ayni portfoy modeline aksin diye simdiden borsa baglanti profilleri kurun."
      },
      {
        label: "Fiyat Katmani",
        title: "Daha akilli fiyat kapsami alin",
        copy:
          "Anlik ve gecmis fiyatlar dahili onbellek katmanlarindan gecer; boylece portfoy gorunumleri ham saglayici cagrilarina daha az bagimli olur."
      },
      {
        label: "Portfoy Gecmisi",
        title: "Her sey icin tek kayit tutun",
        copy:
          "Islemleri ice aktarip disa aktarın, oturumlari inceleyin ve daginik dosyalar yerine veritabani destekli tek bir kayit olusturun."
      }
    ],
    howItWorks: {
      eyebrow: "Nasil Calisir",
      title: "Duzenli portfoy takibi icin basit bir akis",
      copy:
        "PrismFolio, kripto aktivitenizin onemli parcalarini ilk islem girisinden surekli portfoy incelemesine kadar tek ve net bir akista bir araya getirmek icin tasarlandi.",
      steps: [
        {
          step: "1",
          title: "Hesabinizi ve ilk portfoyunuzu olusturun",
          copy:
            "Bir portfoy ile baslayin, uzun vade, trade veya diger stratejileri ayirmak istediginizde yenilerini ekleyin."
        },
        {
          step: "2",
          title: "Aktivitelerinizi farkli kaynaklardan ekleyin",
          copy:
            "Islemleri manuel girin, TXID tabanli islemleri inceleyin, dosya ice aktarın ve takip duzeniniz buyudukce cüzdanlar baglayin."
        },
        {
          step: "3",
          title: "Varliklarinizi tek yerde inceleyin",
          copy:
            "Aktivitelerinizi, varliklarinizi ve fiyatlarinizi bir arada gorerek portfoyunuzu zamanla daha kolay anlayin ve yonetin."
        }
      ]
    },
    whyBuild: {
      eyebrow: "Neden PrismFolio",
      title: "Portfoy takibini daha net ve daha sade tutmak icin",
      copy:
        "Kripto takibi; islemler, cüzdanlar ve transfer detaylari farkli yerlere dagildiginda hizla karisir. PrismFolio, bu parcalari bir araya getirerek portfoyunuzu daha az karmasa ve daha fazla guvenle takip etmeniz icin tasarlandi.",
      principles: [
        {
          title: "Portfoy once gelir",
          copy:
            "Uzun vadeli yatirim ile aktif trade birbirine karismasin diye her stratejiye ayri bir portfoy verin."
        },
        {
          title: "Tasarımdan itibaren salt-okunur",
          copy:
            "Cüzdan ve borsa baglantilari gormek icin vardir; fon tasimak veya kontrolu sizden almak icin degil."
        },
        {
          title: "Daha guvenilir fiyatlama",
          copy:
            "Fiyat verileri, portfoy gorunumlerini zaman icinde daha stabil ve daha kullanisli tutacak sekilde ele alinir."
        }
      ]
    },
    bottomCta: {
      eyebrow: "Buradan Baslayin",
      signedInTitle: "Kaldiginiz yerden devam edin",
      signedOutTitle: "Web uygulamasini acin ve portfoy calisma alaninizi kurun",
      signedInCopy:
        "Panele geri donun, yeni hareket ekleyin veya daha once olusturdugunuz portfoyleri ve veri kaynaklarini yonetin.",
      signedOutCopy:
        "Bir hesap olusturun, ilk portfoyunuzu acin ve manuel islemler, TXID'ler, cüzdanlar veya ice aktarma ile baslayin.",
      openSettings: "Ayarlari Ac"
    }
  }
} as const;

export default async function LandingPage() {
  const [locale, authContext] = await Promise.all([getRequestLocale(), getAuthenticatedContext()]);
  const copy = landingCopy[locale];
  const signedIn = Boolean(authContext);
  const primaryCtaHref = signedIn ? "/dashboard" : "/sign-up";
  const primaryCtaLabel = signedIn ? copy.openDashboard : copy.createAccount;
  const secondaryCtaHref = signedIn ? "/ledger/add" : "/sign-in";
  const secondaryCtaLabel = signedIn ? copy.addTransaction : copy.signIn;
  const accountLabel =
    authContext?.profile?.display_name || authContext?.email || copy.accountFallback;

  return (
    <main className="landing landing-home">
      <section className="landing-topbar">
        <div className="landing-brand">
          <Image
            src="/prismfolio-brand.svg"
            alt="PrismFolio"
            className="landing-brand-image"
            width={1500}
            height={500}
            priority
          />
        </div>
      </section>

      <section className="landing-hero-section">
        <article className="hero-card landing-hero-card">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p className="hero-copy">{copy.copy}</p>

          <div className="hero-actions">
            <Link href={primaryCtaHref} className="button-primary">
              {primaryCtaLabel}
            </Link>
            <Link href={secondaryCtaHref} className="button-secondary">
              {secondaryCtaLabel}
            </Link>
          </div>

          <div className="landing-stat-strip">
            <article className="landing-stat-card">
              <span>{copy.stats.trackAcross.label}</span>
              <strong>{copy.stats.trackAcross.title}</strong>
              <p>{copy.stats.trackAcross.copy}</p>
            </article>
            <article className="landing-stat-card">
              <span>{copy.stats.getStarted.label}</span>
              <strong>
                {signedIn
                  ? copy.stats.getStarted.signedInTitle
                  : copy.stats.getStarted.signedOutTitle}
              </strong>
              <p>
                {signedIn
                  ? formatMessage(copy.stats.getStarted.signedInCopy, { accountLabel })
                  : copy.stats.getStarted.signedOutCopy}
              </p>
            </article>
            <article className="landing-stat-card">
              <span>{copy.stats.builtFor.label}</span>
              <strong>{copy.stats.builtFor.title}</strong>
              <p>{copy.stats.builtFor.copy}</p>
            </article>
          </div>
        </article>
      </section>

      <section className="content-grid landing-feature-grid">
        {copy.highlights.map((item) => (
          <article key={item.title} className="list-card landing-feature-card">
            <span className="eyebrow">{item.label}</span>
            <h2>{item.title}</h2>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="two-column landing-story-grid">
        <article className="list-card">
          <span className="eyebrow">{copy.howItWorks.eyebrow}</span>
          <h2>{copy.howItWorks.title}</h2>
          <p className="section-copy">{copy.howItWorks.copy}</p>

          <div className="landing-workflow">
            {copy.howItWorks.steps.map((item) => (
              <article key={item.step} className="landing-workflow-item">
                <div className="landing-workflow-step">{item.step}</div>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="list-card">
          <span className="eyebrow">{copy.whyBuild.eyebrow}</span>
          <h2>{copy.whyBuild.title}</h2>
          <p className="section-copy">{copy.whyBuild.copy}</p>

          <div className="landing-principles">
            {copy.whyBuild.principles.map((item) => (
              <div key={item.title} className="inline-note">
                <strong>{item.title}</strong>
                <span>{item.copy}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="list-card landing-bottom-cta">
        <div>
          <span className="eyebrow">{copy.bottomCta.eyebrow}</span>
          <h2>{signedIn ? copy.bottomCta.signedInTitle : copy.bottomCta.signedOutTitle}</h2>
          <p className="section-copy">
            {signedIn ? copy.bottomCta.signedInCopy : copy.bottomCta.signedOutCopy}
          </p>
        </div>

        <div className="hero-actions">
          <Link href={primaryCtaHref} className="button-primary">
            {primaryCtaLabel}
          </Link>
          <Link href={signedIn ? "/settings" : "/sign-in"} className="button-secondary">
            {signedIn ? copy.bottomCta.openSettings : copy.signIn}
          </Link>
        </div>
      </section>
    </main>
  );
}
