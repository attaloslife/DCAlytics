import Link from "next/link";

import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { getFlashMessages, getSingleSearchParam, resolveSearchParams } from "@/lib/flash";

type ForgotPasswordPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
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
        <h1>Reset your password</h1>
        <p className="muted">
          Enter your account email and DCAlytics will send a password reset link if that account
          exists.
        </p>

        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}

        <form className="auth-form" action={requestPasswordResetAction}>
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

          <button type="submit" className="button-primary">
            Send Reset Link
          </button>
        </form>

        <div className="banner">
          If email confirmation is enabled, the reset email will come from Supabase and route back
          into DCAlytics through the existing auth confirmation path.
        </div>

        <div className="inline-actions">
          <Link href="/sign-in" className="button-secondary">
            Back to sign in
          </Link>
          <Link href="/sign-up" className="button-secondary">
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
