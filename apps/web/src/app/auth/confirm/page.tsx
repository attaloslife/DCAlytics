import type { EmailOtpType } from "@supabase/supabase-js";

import { ConfirmEmailCard } from "@/components/confirm-email-card";
import { getRequestLocale } from "@/lib/i18n";

type ConfirmPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function getSafeNextPath(nextParam: string) {
  if (!nextParam || !nextParam.startsWith("/")) {
    return "/dashboard";
  }

  return nextParam;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextPath = getSafeNextPath(readSearchParam(resolvedSearchParams, "next"));
  const locale = await getRequestLocale();
  const copy =
    locale === "tr"
      ? {
          eyebrow: "E-posta Dogrulama",
          title: "Kaydiniz tamamlanıyor",
          workingCopy: "E-postanizi dogruluyor ve hesap oturumunuzu aciyoruz.",
          workingBanner: "Giris islemini tamamlarken lutfen bir an bekleyin.",
          successCopy: "E-postaniz dogrulandi. Uygulamaya yonlendiriliyorsunuz...",
          successBanner: "E-posta basariyla dogrulandi.",
          errorCopy: "Bu baglantidan dogrulamayi tamamlayamadik.",
          trySignUpAgain: "Kaydi tekrar dene",
          backToSignIn: "Giris sayfasina don",
          welcomeMessage: "E-posta dogrulandi. PrismFolio'ya hos geldiniz.",
          invalidLink: "Bu dogrulama baglantisi gecersiz veya suresi dolmus.",
          incompleteLink:
            "Bu dogrulama baglantisi uygulama icinde tamamlanamadi. Sorun devam ederse yeni bir dogrulama e-postasi isteyin ve e-posta sablonunuzun uyumlu bir yonlendirme baglantisi kullandigindan emin olun."
        }
      : {
          eyebrow: "Email Confirmation",
          title: "Finishing your sign-up",
          workingCopy: "We're confirming your email and opening your account session now.",
          workingBanner: "Please wait a moment while we complete the sign-in.",
          successCopy: "Your email has been confirmed. Redirecting you into the app...",
          successBanner: "Email confirmed successfully.",
          errorCopy: "We couldn't complete the confirmation from that link.",
          trySignUpAgain: "Try sign-up again",
          backToSignIn: "Back to sign in",
          welcomeMessage: "Email confirmed. Welcome to PrismFolio.",
          invalidLink: "That confirmation link is invalid or expired.",
          incompleteLink:
            "That confirmation link could not finish in the app. If this keeps happening, request a new confirmation email and make sure your email template uses a compatible redirect link."
        };

  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <ConfirmEmailCard
          code={readSearchParam(resolvedSearchParams, "code")}
          errorCode={readSearchParam(resolvedSearchParams, "error_code")}
          errorDescription={readSearchParam(resolvedSearchParams, "error_description")}
          nextPath={nextPath}
          copy={copy}
          tokenHash={readSearchParam(resolvedSearchParams, "token_hash")}
          type={(readSearchParam(resolvedSearchParams, "type") || undefined) as
            | EmailOtpType
            | undefined}
        />
      </section>
    </main>
  );
}
