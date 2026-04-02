"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ResetPasswordFormProps = {
  initialMessage?: string;
  initialError?: string;
};

export function ResetPasswordForm({
  initialMessage = "",
  initialError = ""
}: ResetPasswordFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncSessionState = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (data.session) {
        setRecoveryReady(true);
        setSessionEmail(data.session.user.email || "");
      }

      setCheckingRecovery(false);
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoveryReady(true);
        setSessionEmail(session?.user.email || "");
        setError("");
      }

      setCheckingRecovery(false);
    });

    void syncSessionState();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/sign-in?message=Password%20updated.%20Sign%20in%20with%20your%20new%20password.");
    router.refresh();
  }

  if (checkingRecovery) {
    return (
      <>
        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}
        <div className="banner">Finishing the recovery session from your reset link...</div>
      </>
    );
  }

  if (!recoveryReady) {
    return (
      <>
        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}
        <div className="banner banner-error">
          This page needs an active recovery session. Open the newest reset link from your email, or
          request another one if the old link expired.
        </div>

        <div className="inline-actions">
          <Link href="/forgot-password" className="button-primary">
            Request new reset link
          </Link>
          <Link href="/sign-in" className="button-secondary">
            Back to sign in
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {message ? <div className="banner banner-success">{message}</div> : null}
      {error ? <div className="banner banner-error">{error}</div> : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>New Password</span>
          <input
            type="password"
            name="password"
            placeholder="Create a new password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label>
          <span>Confirm Password</span>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Repeat the new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>

      <div className="banner">
        Recovery session ready for {sessionEmail || "your account"}. After the password is updated,
        you will be signed out and returned to sign in.
      </div>
    </>
  );
}
