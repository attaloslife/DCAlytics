"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ConfirmEmailCardCopy = {
  eyebrow: string;
  title: string;
  workingCopy: string;
  workingBanner: string;
  successCopy: string;
  successBanner: string;
  errorCopy: string;
  trySignUpAgain: string;
  backToSignIn: string;
  welcomeMessage: string;
  invalidLink: string;
  incompleteLink: string;
};

type ConfirmEmailCardProps = {
  code?: string;
  copy: ConfirmEmailCardCopy;
  errorCode?: string;
  errorDescription?: string;
  nextPath: string;
  tokenHash?: string;
  type?: EmailOtpType;
};

export function ConfirmEmailCard({
  code = "",
  copy,
  errorCode = "",
  errorDescription = "",
  nextPath,
  tokenHash = "",
  type
}: ConfirmEmailCardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<"working" | "success" | "error">("working");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let successHandled = false;

    const successRedirect = () => {
      successHandled = true;
      setStatus("success");
      router.replace(`${nextPath}?message=${encodeURIComponent(copy.welcomeMessage)}`);
      router.refresh();
    };

    const finish = async () => {
      if (errorCode || errorDescription) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setError(
          decodeURIComponent(errorDescription).trim() || copy.invalidLink
        );
        return;
      }

      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type
        });

        if (verifyError) {
          if (!isMounted) {
            return;
          }

          setStatus("error");
          setError(verifyError.message || copy.invalidLink);
          return;
        }
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          if (!isMounted) {
            return;
          }

          setStatus("error");
          setError(exchangeError.message || copy.invalidLink);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        if (!isMounted) {
          return;
        }

        successRedirect();
        return;
      }

      window.setTimeout(async () => {
        if (!isMounted || successHandled) {
          return;
        }

        const { data: delayedData } = await supabase.auth.getSession();

        if (delayedData.session) {
          successRedirect();
          return;
        }

        setStatus("error");
        setError(copy.incompleteLink);
      }, 1200);
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted || successHandled || !session) {
        return;
      }

      successRedirect();
    });

    void finish();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [code, copy.incompleteLink, copy.invalidLink, copy.welcomeMessage, errorCode, errorDescription, nextPath, router, supabase, tokenHash, type]);

  return (
    <>
      <span className="eyebrow">{copy.eyebrow}</span>
      <h1>{copy.title}</h1>

      {status === "working" ? (
        <>
          <p className="muted">{copy.workingCopy}</p>
          <div className="banner">{copy.workingBanner}</div>
        </>
      ) : null}

      {status === "success" ? (
        <>
          <p className="muted">{copy.successCopy}</p>
          <div className="banner banner-success">{copy.successBanner}</div>
        </>
      ) : null}

      {status === "error" ? (
        <>
          <p className="muted">{copy.errorCopy}</p>
          <div className="banner banner-error">{error}</div>
          <div className="inline-actions">
            <Link href="/sign-up" className="button-primary">
              {copy.trySignUpAgain}
            </Link>
            <Link href="/sign-in" className="button-secondary">
              {copy.backToSignIn}
            </Link>
          </div>
        </>
      ) : null}
    </>
  );
}
