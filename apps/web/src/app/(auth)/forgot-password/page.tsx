import Link from "next/link";

import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { getFlashMessages, getSingleSearchParam, resolveSearchParams } from "@/lib/flash";
import { getRequestLocale } from "@/lib/i18n";

type ForgotPasswordPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const [locale, flash, resolvedSearchParams] = await Promise.all([
    getRequestLocale(),
    getFlashMessages(searchParams),
    resolveSearchParams(searchParams)
  ]);
  const copy =
    locale === "tr"
      ? {
          eyebrow: "Hesap Kurtarma",
          title: "Hesabiniza geri donun",
          description:
            "E-postanizi girin; bu adrese bagli bir PrismFolio hesabi varsa size sifre yenileme baglantisi gonderelim.",
          email: "E-posta",
          emailPlaceholder: "ad@example.com",
          submit: "Sifre Yenileme E-postasi Gonder",
          helper:
            "E-posta geldiginde en yeni yenileme baglantisini acin ve devam etmek icin yeni bir sifre belirleyin.",
          backToSignIn: "Giris sayfasina don",
          createAccount: "Hesap olustur"
        }
      : {
          eyebrow: "Account Recovery",
          title: "Get back into your account",
          description:
            "Enter your email and we'll send a reset link if there's a PrismFolio account connected to it.",
          email: "Email",
          emailPlaceholder: "name@example.com",
          submit: "Send Reset Email",
          helper:
            "Once the email arrives, open the newest reset link and choose a new password to continue.",
          backToSignIn: "Back to sign in",
          createAccount: "Create account"
        };
  const email = getSingleSearchParam(resolvedSearchParams, "email");
  const { message, error } = flash;

  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p className="muted">{copy.description}</p>

        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}

        <form className="auth-form" action={requestPasswordResetAction}>
          <label>
            <span>{copy.email}</span>
            <input
              type="email"
              name="email"
              placeholder={copy.emailPlaceholder}
              defaultValue={email}
              required
            />
          </label>

          <button type="submit" className="button-primary">
            {copy.submit}
          </button>
        </form>

        <div className="banner">{copy.helper}</div>

        <div className="inline-actions">
          <Link href="/sign-in" className="button-secondary">
            {copy.backToSignIn}
          </Link>
          <Link href="/sign-up" className="button-secondary">
            {copy.createAccount}
          </Link>
        </div>
      </section>
    </main>
  );
}
