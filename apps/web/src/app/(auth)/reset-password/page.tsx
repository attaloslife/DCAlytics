import { getFlashMessages } from "@/lib/flash";
import { getRequestLocale } from "@/lib/i18n";
import { ResetPasswordForm } from "@/components/reset-password-form";

type ResetPasswordPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const [locale, { message, error }] = await Promise.all([
    getRequestLocale(),
    getFlashMessages(searchParams)
  ]);
  const copy =
    locale === "tr"
      ? {
          eyebrow: "Hesap Kurtarma",
          title: "Yeni bir sifre olusturun",
          description:
            "E-postadaki yenileme baglantisini kullanin, sonra PrismFolio hesabiniza geri donmek icin yeni bir sifre belirleyin.",
          form: {
            newPassword: "Yeni Sifre",
            confirmPassword: "Sifreyi Dogrula",
            newPasswordPlaceholder: "Yeni bir sifre olusturun",
            confirmPasswordPlaceholder: "Yeni sifreyi tekrar girin",
            accountFallback: "hesabiniz",
            passwordTooShort: "Sifre en az 8 karakter olmali.",
            passwordsMustMatch: "Sifreler ayni olmali.",
            updatePassword: "Sifreyi Guncelle",
            updating: "Guncelleniyor...",
            checkingRecovery: "Yenileme baglantinizdaki kurtarma oturumu tamamlanıyor...",
            invalidRecovery:
              "Bu sayfa icin aktif bir kurtarma oturumu gerekiyor. E-postanizdaki en yeni yenileme baglantisini acin veya eski baglanti suresi dolduysa yenisini isteyin.",
            requestNewResetLink: "Yeni yenileme baglantisi iste",
            backToSignIn: "Giris sayfasina don",
            recoveryReady:
              "{sessionEmail} icin kurtarma oturumu hazir. Sifre guncellendikten sonra oturumunuz kapatilacak ve giris ekranina doneceksiniz.",
            passwordUpdated:
              "Sifre guncellendi. Yeni sifrenizle giris yapin."
          }
        }
      : {
          eyebrow: "Account Recovery",
          title: "Create a new password",
          description:
            "Use the reset link from your email, then choose a new password to get back into your PrismFolio account.",
          form: {
            newPassword: "New Password",
            confirmPassword: "Confirm Password",
            newPasswordPlaceholder: "Create a new password",
            confirmPasswordPlaceholder: "Repeat the new password",
            accountFallback: "your account",
            passwordTooShort: "Password must be at least 8 characters.",
            passwordsMustMatch: "Passwords must match.",
            updatePassword: "Update Password",
            updating: "Updating...",
            checkingRecovery: "Finishing the recovery session from your reset link...",
            invalidRecovery:
              "This page needs an active recovery session. Open the newest reset link from your email, or request another one if the old link expired.",
            requestNewResetLink: "Request new reset link",
            backToSignIn: "Back to sign in",
            recoveryReady:
              "Recovery session ready for {sessionEmail}. After the password is updated, you will be signed out and returned to sign in.",
            passwordUpdated:
              "Password updated. Sign in with your new password."
          }
        };

  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p className="muted">{copy.description}</p>

        <ResetPasswordForm
          copy={copy.form}
          initialMessage={message}
          initialError={error}
        />
      </section>
    </main>
  );
}
