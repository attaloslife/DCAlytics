import { getFlashMessages } from "@/lib/flash";
import { ResetPasswordForm } from "@/components/reset-password-form";

type ResetPasswordPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { message, error } = await getFlashMessages(searchParams);

  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <span className="eyebrow">Authentication</span>
        <h1>Choose a new password</h1>
        <p className="muted">
          Use the password reset link from your email, then set a new password here to get back into
          your portfolio.
        </p>

        <ResetPasswordForm initialMessage={message} initialError={error} />
      </section>
    </main>
  );
}
