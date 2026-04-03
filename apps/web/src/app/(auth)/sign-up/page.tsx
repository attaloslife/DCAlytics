import Link from "next/link";

import { signUpAction } from "@/app/(auth)/actions";
import { getFlashMessages, getSingleSearchParam, resolveSearchParams } from "@/lib/flash";
import { getRequestLocale } from "@/lib/i18n";

type SignUpPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const [locale, flash, resolvedSearchParams] = await Promise.all([
    getRequestLocale(),
    getFlashMessages(searchParams),
    resolveSearchParams(searchParams)
  ]);
  const copy =
    locale === "tr"
      ? {
          eyebrow: "Baslayin",
          title: "Hesabinizi olusturun",
          description:
            "Portfoyler olusturmak, aktiviteleri takip etmek ve kripto verilerinizi tek yerde duzenli tutmak icin PrismFolio hesabinizi olusturun.",
          displayName: "Gorunen Ad",
          displayNamePlaceholder: "Adiniz",
          email: "E-posta",
          emailPlaceholder: "ad@example.com",
          password: "Sifre",
          passwordPlaceholder: "Bir sifre olusturun",
          confirmPassword: "Sifreyi Dogrula",
          confirmPasswordPlaceholder: "Sifrenizi tekrar girin",
          submit: "Hesap Olustur",
          confirmationRequired:
            "Giris yapabilmek icin once e-postanizi dogrulamaniz gerekecek.",
          resetPassword: "Sifreyi Sifirla",
          signInInstead: "Onun yerine giris yap",
          alreadyHaveAccount: "Zaten hesabin var",
          backHome: "Ana sayfaya don"
        }
      : {
          eyebrow: "Get Started",
          title: "Create your account",
          description:
            "Create your PrismFolio account to start building portfolios, tracking activity, and keeping your crypto data organized in one place.",
          displayName: "Display Name",
          displayNamePlaceholder: "Your name",
          email: "Email",
          emailPlaceholder: "name@example.com",
          password: "Password",
          passwordPlaceholder: "Create a password",
          confirmPassword: "Confirm Password",
          confirmPasswordPlaceholder: "Repeat your password",
          submit: "Create Account",
          confirmationRequired:
            "You'll need to confirm your email before you can sign in.",
          resetPassword: "Reset Password",
          signInInstead: "Sign In Instead",
          alreadyHaveAccount: "Already have an account",
          backHome: "Back home"
        };
  const displayName = getSingleSearchParam(resolvedSearchParams, "displayName");
  const email = getSingleSearchParam(resolvedSearchParams, "email");
  const emailInUse = getSingleSearchParam(resolvedSearchParams, "emailInUse") === "1";
  const { message, error } = flash;

  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p className="muted">{copy.description}</p>

        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}
        {emailInUse ? (
          <div className="inline-actions">
            <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="button-secondary">
              {copy.resetPassword}
            </Link>
            <Link href={`/sign-in${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="button-secondary">
              {copy.signInInstead}
            </Link>
          </div>
        ) : null}

        <form className="auth-form" action={signUpAction}>
          <label>
            <span>{copy.displayName}</span>
            <input
              type="text"
              name="displayName"
              placeholder={copy.displayNamePlaceholder}
              defaultValue={displayName}
              required
            />
          </label>

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

          <label>
            <span>{copy.confirmPassword}</span>
            <input
              type="password"
              name="confirmPassword"
              placeholder={copy.confirmPasswordPlaceholder}
              required
            />
          </label>

          <button type="submit" className="button-primary">
            {copy.submit}
          </button>
        </form>

        <div className="banner">{copy.confirmationRequired}</div>

        <div className="inline-actions">
          <Link href="/sign-in" className="button-secondary">
            {copy.alreadyHaveAccount}
          </Link>
          <Link href="/" className="button-secondary">
            {copy.backHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
