import Link from "next/link";

import { signInAction } from "@/app/(auth)/actions";
import { getFlashMessages, getSingleSearchParam, resolveSearchParams } from "@/lib/flash";

type SignInPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [flash, resolvedSearchParams] = await Promise.all([
    getFlashMessages(searchParams),
    resolveSearchParams(searchParams)
  ]);
  const email = getSingleSearchParam(resolvedSearchParams, "email");
  const { message, error } = flash;

  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <span className="eyebrow">Authentication</span>
        <h1>Sign in to DCAlytics</h1>
        <p className="muted">
          This form now posts into the Supabase server action flow and should redirect into the
          protected app shell after a valid sign-in.
        </p>

        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}

        <form className="auth-form" action={signInAction}>
          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              defaultValue={email}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input type="password" name="password" placeholder="........" required />
          </label>

          <button type="submit" className="button-primary">
            Sign In
          </button>
        </form>

        <div className="banner">
          If you forgot your password, you can request a reset link and come back through the same
          auth flow.
        </div>

        <div className="inline-actions">
          <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="button-secondary">
            Forgot password
          </Link>
          <Link href="/sign-up" className="button-secondary">
            Create account
          </Link>
          <Link href="/" className="button-secondary">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
