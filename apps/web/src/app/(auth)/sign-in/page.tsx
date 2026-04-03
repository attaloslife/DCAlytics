import Link from "next/link";

import { signInAction } from "@/app/(auth)/actions";
import { getFlashMessages, getSingleSearchParam, resolveSearchParams } from "@/lib/flash";
import { getRequestLocale } from "@/lib/i18n";

type SignInPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [locale, flash, resolvedSearchParams] = await Promise.all([
    getRequestLocale(),
    getFlashMessages(searchParams),
    resolveSearchParams(searchParams)
  ]);
  const copy =
    locale === "tr"
      ? {
          eyebrow: "Tekrar Hos Geldiniz",
          title: "Hesabiniza giris yapin",
          description:
            "Kaldiginiz yerden devam edin ve portfoylerinize, islemlerinize, cüzdanlariniza ve piyasa takibinize tek yerden geri donun.",
          email: "E-posta",
          emailPlaceholder: "ad@example.com",
          password: "Sifre",
          passwordPlaceholder: "........",
          submit: "Giris Yap",
          forgotPasswordBanner:
            "Sifrenizi unuttuysaniz sifre yenileme baglantisi isteyip hesabiniza guvenli sekilde geri donebilirsiniz.",
          forgotPassword: "Sifremi unuttum",
          createAccount: "Hesap olustur",
          backHome: "Ana sayfaya don"
        }
      : {
          eyebrow: "Welcome Back",
          title: "Sign in to your account",
          description:
            "Pick up where you left off and get back to your portfolios, trades, wallets, and market tracking in one place.",
          email: "Email",
          emailPlaceholder: "name@example.com",
          password: "Password",
          passwordPlaceholder: "........",
          submit: "Sign In",
          forgotPasswordBanner:
            "If you forgot your password, you can request a reset link and get back into your account securely.",
          forgotPassword: "Forgot password",
          createAccount: "Create account",
          backHome: "Back home"
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

        <form className="auth-form" action={signInAction}>
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

          <label>
            <span>{copy.password}</span>
            <input
              type="password"
              name="password"
              placeholder={copy.passwordPlaceholder}
              required
            />
          </label>

          <button type="submit" className="button-primary">
            {copy.submit}
          </button>
        </form>

        <div className="banner">{copy.forgotPasswordBanner}</div>

        <div className="inline-actions">
          <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="button-secondary">
            {copy.forgotPassword}
          </Link>
          <Link href="/sign-up" className="button-secondary">
            {copy.createAccount}
          </Link>
          <Link href="/" className="button-secondary">
            {copy.backHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
