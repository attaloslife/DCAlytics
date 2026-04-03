"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { formatMessage } from "@/lib/text";

type ResetPasswordFormCopy = {
  newPassword: string;
  confirmPassword: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  accountFallback: string;
  passwordTooShort: string;
  passwordsMustMatch: string;
  updatePassword: string;
  updating: string;
  checkingRecovery: string;
  invalidRecovery: string;
  requestNewResetLink: string;
  backToSignIn: string;
  recoveryReady: string;
  passwordUpdated: string;
};

type ResetPasswordFormProps = {
  copy: ResetPasswordFormCopy;
  initialMessage?: string;
  initialError?: string;
};

export function ResetPasswordForm({
  copy,
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
      setError(copy.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.passwordsMustMatch);
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
    router.push(`/sign-in?message=${encodeURIComponent(copy.passwordUpdated)}`);
    router.refresh();
  }

  if (checkingRecovery) {
    return (
      <>
        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}
        <div className="banner">{copy.checkingRecovery}</div>
      </>
    );
  }

  if (!recoveryReady) {
    return (
      <>
        {message ? <div className="banner banner-success">{message}</div> : null}
        {error ? <div className="banner banner-error">{error}</div> : null}
        <div className="banner banner-error">{copy.invalidRecovery}</div>

        <div className="inline-actions">
          <Link href="/forgot-password" className="button-primary">
            {copy.requestNewResetLink}
          </Link>
          <Link href="/sign-in" className="button-secondary">
            {copy.backToSignIn}
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
          <span>{copy.newPassword}</span>
          <input
            type="password"
            name="password"
            placeholder={copy.newPasswordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <label>
          <span>{copy.confirmPassword}</span>
          <input
            type="password"
            name="confirmPassword"
            placeholder={copy.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? copy.updating : copy.updatePassword}
        </button>
      </form>

      <div className="banner">
        {formatMessage(copy.recoveryReady, {
          sessionEmail: sessionEmail || copy.accountFallback
        })}
      </div>
    </>
  );
}
