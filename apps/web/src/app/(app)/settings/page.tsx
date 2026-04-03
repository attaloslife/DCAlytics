import {
  changePasswordFromSettingsAction,
  updateProfileSettingsAction
} from "@/app/(app)/settings/actions";
import { requireAuthenticatedContext } from "@/lib/auth";
import { baseCurrencyOptions } from "@/lib/currencies";
import { getFlashMessages } from "@/lib/flash";
import { getRequestLocale } from "@/lib/i18n";
import { localeOptions } from "@/lib/locales";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [locale, { profile, email }, { message, error }] = await Promise.all([
    getRequestLocale(),
    requireAuthenticatedContext(),
    getFlashMessages(searchParams)
  ]);
  const copy =
    locale === "tr"
      ? {
          eyebrow: "Ayarlar",
          title: "Hesap ve tercihler",
          subtitle:
            "PrismFolio'da hesabinizin nasil gorunecegini yonetin ve yeni portfoylerin hangi varsayilanlarla baslayacagini secin.",
          cards: {
            displayName: "Gorunen Ad",
            accountEmail: "Hesap E-postasi",
            defaultCurrency: "Varsayilan Para Birimi",
            defaultLanguage: "Varsayilan Dil",
            notSet: "Ayarlanmis degil",
            unavailable: "Kullanilamiyor",
            existingValue: "Mevcut deger"
          },
          profile: {
            eyebrow: "Profil",
            title: "Hesap varsayilanlarinizi guncelleyin",
            description:
              "Bu tercihler hesabiniz genelinde kullanilir ve yeni portfoylerin nasil baslayacagini sekillendirir.",
            displayName: "Gorunen Ad",
            displayNamePlaceholder: "Uygulamada gorunmesini istediginiz adi secin",
            defaultCurrency: "Varsayilan Para Birimi",
            defaultLanguage: "Varsayilan Dil",
            save: "Degisiklikleri Kaydet"
          },
          security: {
            eyebrow: "Guvenlik",
            title: "Sifre ve giris erisimi",
            description: "Uygulamadan ayrilmadan sifrenizi buradan guncelleyin.",
            currentEmail: "Mevcut hesap e-postasi",
            currentPassword: "Mevcut Sifre",
            currentPasswordPlaceholder: "Mevcut sifrenizi girin",
            newPassword: "Yeni Sifre",
            newPasswordPlaceholder: "Yeni bir sifre secin",
            confirmNewPassword: "Yeni Sifreyi Dogrula",
            confirmNewPasswordPlaceholder: "Yeni sifreyi tekrar girin",
            updatePassword: "Sifreyi Guncelle"
          },
          impact: {
            eyebrow: "Bu Varsayilanlar Nasil Yardimci Olur",
            title: "Ayarlariniz nerede gorunur",
            items: [
              {
                title: "Uygulama kimligi",
                copy:
                  "Gorunen adiniz, giris yaptiginiz calisma alaninin genelinde gorunur."
              },
              {
                title: "Yeni portfoyler",
                copy:
                  "Varsayilan para biriminiz, yeni portfoy olustururken otomatik secilir."
              },
              {
                title: "Dil tercihi",
                copy:
                  "Dil seciminiz hesap seviyesinde kaydedilir ve su anda uygulamanin ilk Ingilizce ve Turkce ekranlarini yonlendirir."
              }
            ]
          }
        }
      : {
          eyebrow: "Settings",
          title: "Account and preferences",
          subtitle:
            "Manage how your account appears in PrismFolio and choose the defaults you want new portfolios to start with.",
          cards: {
            displayName: "Display Name",
            accountEmail: "Account Email",
            defaultCurrency: "Default Currency",
            defaultLanguage: "Default Language",
            notSet: "Not set",
            unavailable: "Unavailable",
            existingValue: "Existing value"
          },
          profile: {
            eyebrow: "Profile",
            title: "Update your account defaults",
            description:
              "These preferences apply across your account and help shape how new portfolios start out.",
            displayName: "Display Name",
            displayNamePlaceholder: "Choose the name you want shown in the app",
            defaultCurrency: "Default Currency",
            defaultLanguage: "Default Language",
            save: "Save Changes"
          },
          security: {
            eyebrow: "Security",
            title: "Password and sign-in access",
            description: "Update your password here without leaving the app.",
            currentEmail: "Current account email",
            currentPassword: "Current Password",
            currentPasswordPlaceholder: "Enter your current password",
            newPassword: "New Password",
            newPasswordPlaceholder: "Choose a new password",
            confirmNewPassword: "Confirm New Password",
            confirmNewPasswordPlaceholder: "Repeat the new password",
            updatePassword: "Update Password"
          },
          impact: {
            eyebrow: "How These Defaults Help",
            title: "Where your settings show up",
            items: [
              {
                title: "App identity",
                copy: "Your display name appears throughout your signed-in workspace."
              },
              {
                title: "New portfolios",
                copy:
                  "Your default currency is preselected when you create a new portfolio."
              },
              {
                title: "Language preference",
                copy:
                  "Your language choice is saved at the account level and currently powers the first English and Turkish app surfaces."
              }
            ]
          }
        };
  const selectedCurrency = profile?.default_currency?.toLowerCase() || "usd";
  const selectedLocale = profile?.default_locale?.toLowerCase() || "en";
  const selectedLocaleLabel =
    localeOptions.find((locale) => locale.value === selectedLocale)?.label || selectedLocale.toUpperCase();

  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p className="page-subtitle">{copy.subtitle}</p>
        </div>
      </header>

      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      <div className="summary-grid">
        <article className="metric-card">
          <span>{copy.cards.displayName}</span>
          <strong>{profile?.display_name || copy.cards.notSet}</strong>
        </article>
        <article className="metric-card">
          <span>{copy.cards.accountEmail}</span>
          <strong>{email || copy.cards.unavailable}</strong>
        </article>
        <article className="metric-card">
          <span>{copy.cards.defaultCurrency}</span>
          <strong>{selectedCurrency.toUpperCase()}</strong>
        </article>
        <article className="metric-card">
          <span>{copy.cards.defaultLanguage}</span>
          <strong>{selectedLocaleLabel}</strong>
        </article>
      </div>

      <div className="two-column">
        <article className="list-card">
          <span className="eyebrow">{copy.profile.eyebrow}</span>
          <h2>{copy.profile.title}</h2>
          <p className="section-copy">{copy.profile.description}</p>

          <form className="ledger-form" action={updateProfileSettingsAction}>
            <label className="field-group">
              <span>{copy.profile.displayName}</span>
              <input
                type="text"
                name="displayName"
                defaultValue={profile?.display_name || ""}
                placeholder={copy.profile.displayNamePlaceholder}
                required
              />
            </label>

            <div className="field-grid">
              <label className="field-group">
                <span>{copy.profile.defaultCurrency}</span>
                <select name="defaultCurrency" defaultValue={selectedCurrency} required>
                  {baseCurrencyOptions.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                  {!baseCurrencyOptions.some((currency) => currency.value === selectedCurrency) ? (
                    <option value={selectedCurrency}>
                      {selectedCurrency.toUpperCase()} - {copy.cards.existingValue}
                    </option>
                  ) : null}
                </select>
              </label>

              <label className="field-group">
                <span>{copy.profile.defaultLanguage}</span>
                <select name="defaultLocale" defaultValue={selectedLocale} required>
                  {localeOptions.map((locale) => (
                    <option key={locale.value} value={locale.value}>
                      {locale.label}
                    </option>
                  ))}
                  {!localeOptions.some((locale) => locale.value === selectedLocale) ? (
                    <option value={selectedLocale}>
                      {selectedLocale.toUpperCase()} - {copy.cards.existingValue}
                    </option>
                  ) : null}
                </select>
              </label>
            </div>

            <div className="inline-actions">
              <button type="submit" className="button-primary">
                {copy.profile.save}
              </button>
            </div>
          </form>
        </article>

        <article className="list-card">
          <span className="eyebrow">{copy.security.eyebrow}</span>
          <h2>{copy.security.title}</h2>
          <p className="section-copy">{copy.security.description}</p>

          <form className="ledger-form settings-stack" action={changePasswordFromSettingsAction}>
            <div className="inline-note">
              <strong>{copy.security.currentEmail}</strong>
              <span>{email || copy.cards.unavailable}</span>
            </div>

            <label className="field-group">
              <span>{copy.security.currentPassword}</span>
              <input
                type="password"
                name="currentPassword"
                placeholder={copy.security.currentPasswordPlaceholder}
                required
              />
            </label>

            <label className="field-group">
              <span>{copy.security.newPassword}</span>
              <input
                type="password"
                name="newPassword"
                placeholder={copy.security.newPasswordPlaceholder}
                required
              />
            </label>

            <label className="field-group">
              <span>{copy.security.confirmNewPassword}</span>
              <input
                type="password"
                name="confirmNewPassword"
                placeholder={copy.security.confirmNewPasswordPlaceholder}
                required
              />
            </label>

            <div className="inline-actions">
              <button type="submit" className="button-secondary">
                {copy.security.updatePassword}
              </button>
            </div>
          </form>
        </article>
      </div>

      <article className="list-card settings-impact-card">
        <span className="eyebrow">{copy.impact.eyebrow}</span>
        <h2>{copy.impact.title}</h2>
        <div className="settings-impact-grid">
          {copy.impact.items.map((item) => (
            <div key={item.title} className="inline-note">
              <strong>{item.title}</strong>
              <span>{item.copy}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
