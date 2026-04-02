import Link from "next/link";

import { signUpAction } from "@/app/(auth)/actions";
import { getFlashMessages, getSingleSearchParam, resolveSearchParams } from "@/lib/flash";

type SignUpPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const [flash, resolvedSearchParams] = await Promise.all([
    getFlashMessages(searchParams),
    resolveSearchParams(searchParams)
  ]);
  const displayName = getSingleSearchParam(resolvedSearchParams, "displayName");
  const email = getSingleSearchParam(resolvedSearchParams, "email");
  const emailInUse = getSingleSearchParam(resolvedSearchParams, "emailInUse") === "1";
  const { message, error } = flash;

  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <span className="eyebrow">Authentication</span>
        <h1>Create your account</h1>
        <p className="muted">
          This sign-up flow now targets Supabase email/password registration and the profile
          bootstrap trigger in the database.
        </p>

        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}
        {emailInUse ? (
          <div className="inline-actions">
            <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="button-secondary">
              Reset Password
            </Link>
            <Link href={`/sign-in${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="button-secondary">
              Sign In Instead
            </Link>
          </div>
        ) : null}

        <form className="auth-form" action={signUpAction}>
          <label>
            <span>Display Name</span>
            <input
              type="text"
              name="displayName"
              placeholder="Your name"
              defaultValue={displayName}
              required
            />
          </label>

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
            <input type="password" name="password" placeholder="Create a password" required />
          </label>

          <button type="submit" className="button-primary">
            Create Account
          </button>
        </form>

        <div className="banner">
          If email confirmation is enabled in Supabase, the new confirmation route will exchange the
          token for a session and continue into the app.
        </div>

        <div className="inline-actions">
          <Link href="/sign-in" className="button-secondary">
            Already have an account
          </Link>
          <Link href="/" className="button-secondary">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
