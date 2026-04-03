"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { buildPathWithNotice } from "@/lib/flash";
import { getRequestLocale, persistLocaleCookie } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getSafeOriginFromHeaders(headerStore: Headers) {
  const directOrigin = headerStore.get("origin");

  if (directOrigin) {
    return directOrigin;
  }

  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "http";

  return host ? `${proto}://${host}` : "";
}

function getAuthActionCopy(locale: "en" | "tr") {
  if (locale === "tr") {
    return {
      errors: {
        supabaseNotConfigured: "Ortam degiskenleri henuz yapilandirilmamis.",
        reviewSignInDetails: "Lutfen giris bilgilerinizi kontrol edin.",
        reviewSignUpDetails: "Lutfen kayit bilgilerinizi kontrol edin.",
        reviewEmailAddress: "Lutfen e-posta adresinizi kontrol edin.",
        duplicateDisplayName: "Bu gorunen ad zaten alinmis. Lutfen baska bir ad secin.",
        validateDisplayNameLater:
          "Bu gorunen adi su anda dogrulayamadik. Lutfen tekrar deneyin.",
        validateEmailLater:
          "Bu e-postayi su anda dogrulayamadik. Lutfen tekrar deneyin.",
        emailAlreadyInUse:
          "Bu e-posta zaten kullanimda. Giris yapmayi veya sifrenizi yenilemeyi deneyin.",
        confirmEmailBeforeSignIn:
          "Giris yapmadan once lutfen e-postanizi dogrulayin.",
        emailConfirmationOff:
          "Bu proje icin e-posta dogrulamasi kapali oldugu icin dogrulama e-postasi gonderilemedi. Kimlik dogrulama ayarlarinizda e-posta dogrulamayi acip tekrar deneyin.",
        passwordResetRateLimited:
          "Kisa sure icinde cok fazla hesap e-postasi istendi. Lutfen biraz bekleyip tekrar deneyin."
      },
      validation: {
        emailInvalid: "Gecerli bir e-posta adresi girin.",
        passwordMin: "Sifre en az 8 karakter olmali.",
        displayNameMin: "Gorunen ad en az 2 karakter olmali.",
        confirmPasswordRequired: "Lutfen sifrenizi dogrulayin.",
        passwordsDoNotMatch: "Sifreler eslesmiyor."
      },
      messages: {
        welcomeBack: "Tekrar hos geldiniz.",
        checkEmailToConfirm:
          "Giris yapmadan once hesabinizi dogrulamak icin e-postanizi kontrol edin.",
        passwordResetSent: "Bu e-posta varsa, sifre yenileme baglantisi yolda.",
        signedOut: "Cikis yapildi."
      }
    };
  }

  return {
    errors: {
      supabaseNotConfigured: "Environment variables are not configured yet.",
      reviewSignInDetails: "Please review your sign-in details.",
      reviewSignUpDetails: "Please review your sign-up details.",
      reviewEmailAddress: "Please review your email address.",
      duplicateDisplayName: "That display name is already taken. Please choose another one.",
      validateDisplayNameLater:
        "We could not validate that display name yet. Please try again.",
      validateEmailLater: "We could not validate that email yet. Please try again.",
      emailAlreadyInUse:
        "That email is already in use. Try signing in or resetting your password.",
      confirmEmailBeforeSignIn: "Please confirm your email before signing in.",
      emailConfirmationOff:
        "Email confirmation is turned off for this project, so no verification email could be sent. Turn on Confirm email in your auth settings and try again.",
      passwordResetRateLimited:
        "Too many account emails were requested recently. Please wait a few minutes and try again."
    },
    validation: {
      emailInvalid: "Enter a valid email address.",
      passwordMin: "Password must be at least 8 characters.",
      displayNameMin: "Display name must be at least 2 characters.",
      confirmPasswordRequired: "Please confirm your password.",
      passwordsDoNotMatch: "Passwords do not match."
    },
    messages: {
      welcomeBack: "Welcome back.",
      checkEmailToConfirm: "Check your email to confirm your account before signing in.",
      passwordResetSent:
        "If that email exists, a password reset link is on the way.",
      signedOut: "Signed out."
    }
  };
}

function createSignInSchema(locale: "en" | "tr") {
  const copy = getAuthActionCopy(locale);

  return z.object({
    email: z.string().email(copy.validation.emailInvalid),
    password: z.string().min(8, copy.validation.passwordMin)
  });
}

function createSignUpSchema(locale: "en" | "tr") {
  const copy = getAuthActionCopy(locale);

  return createSignInSchema(locale)
    .extend({
      displayName: z.string().trim().min(2, copy.validation.displayNameMin).max(80),
      confirmPassword: z.string().min(1, copy.validation.confirmPasswordRequired)
    })
    .superRefine(({ password, confirmPassword }, context) => {
      if (password !== confirmPassword) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: copy.validation.passwordsDoNotMatch
        });
      }
    });
}

function createForgotPasswordSchema(locale: "en" | "tr") {
  const copy = getAuthActionCopy(locale);

  return z.object({
    email: z.string().email(copy.validation.emailInvalid)
  });
}

function isEmailAlreadyRegisteredError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("user already registered") ||
    normalizedMessage.includes("email already registered") ||
    normalizedMessage.includes("already registered")
  );
}

function isDuplicateDisplayNameError(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("duplicate key") ||
    normalizedMessage.includes("profiles_display_name_unique_idx")
  );
}

function isEmailNotConfirmedError(message: string) {
  return message.toLowerCase().includes("email not confirmed");
}

function getFriendlyAuthEmailError(
  locale: "en" | "tr",
  error: { message: string; code?: string | null }
) {
  const copy = getAuthActionCopy(locale);

  if (
    error.code === "over_email_send_rate_limit" ||
    error.message.toLowerCase().includes("email rate limit exceeded")
  ) {
    return copy.errors.passwordResetRateLimited;
  }

  return error.message;
}

async function doesAuthUserExistByEmail(
  email: string
): Promise<{ exists: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const adminSupabase = createAdminClient();
  const perPage = 200;

  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      return {
        exists: false,
        error: error.message
      };
    }

    if ((data.users || []).some((user) => user.email?.trim().toLowerCase() === normalizedEmail)) {
      return {
        exists: true
      };
    }

    if ((data.users || []).length < perPage) {
      break;
    }
  }

  return {
    exists: false
  };
}

export async function signInAction(formData: FormData) {
  const locale = await getRequestLocale();
  const copy = getAuthActionCopy(locale);

  if (!isSupabaseConfigured()) {
    redirect(
      buildPathWithNotice("/sign-in", {
        error: copy.errors.supabaseNotConfigured
      })
    );
  }

  const parsed = createSignInSchema(locale).safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  const submittedEmail = String(formData.get("email") || "").trim();

  if (!parsed.success) {
    redirect(
      buildPathWithNotice("/sign-in", {
        error: parsed.error.issues[0]?.message || copy.errors.reviewSignInDetails,
        fields: {
          email: submittedEmail
        }
      })
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(
      buildPathWithNotice("/sign-in", {
        error: isEmailNotConfirmedError(error.message)
          ? copy.errors.confirmEmailBeforeSignIn
          : error.message,
        fields: {
          email: parsed.data.email
        }
      })
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_locale")
    .eq("id", data.user.id)
    .maybeSingle();

  await persistLocaleCookie(profile?.default_locale ?? locale);

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/dashboard", {
      message: copy.messages.welcomeBack
    })
  );
}

export async function signUpAction(formData: FormData) {
  const locale = await getRequestLocale();
  const copy = getAuthActionCopy(locale);

  if (!isSupabaseConfigured()) {
    redirect(
      buildPathWithNotice("/sign-up", {
        error: copy.errors.supabaseNotConfigured
      })
    );
  }

  const parsed = createSignUpSchema(locale).safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  const submittedDisplayName = String(formData.get("displayName") || "").trim();
  const submittedEmail = String(formData.get("email") || "").trim();

  if (!parsed.success) {
    redirect(
      buildPathWithNotice("/sign-up", {
        error: parsed.error.issues[0]?.message || copy.errors.reviewSignUpDetails,
        fields: {
          displayName: submittedDisplayName,
          email: submittedEmail
        }
      })
    );
  }

  const headerStore = await headers();
  const origin = getSafeOriginFromHeaders(headerStore);
  const supabase = await createClient();
  const normalizedDisplayName = parsed.data.displayName.trim();
  const adminSupabase = createAdminClient();
  const { data: existingProfiles, error: existingProfileError } = await adminSupabase
    .from("profiles")
    .select("id")
    .ilike("display_name", normalizedDisplayName)
    .limit(1);

  if (existingProfileError) {
    redirect(
      buildPathWithNotice("/sign-up", {
        error: copy.errors.validateDisplayNameLater,
        fields: {
          displayName: normalizedDisplayName,
          email: parsed.data.email
        }
      })
    );
  }

  if ((existingProfiles ?? []).length > 0) {
    redirect(
      buildPathWithNotice("/sign-up", {
        error: copy.errors.duplicateDisplayName,
        fields: {
          displayName: normalizedDisplayName,
          email: parsed.data.email
        }
      })
    );
  }

  const { exists: existingAuthUser, error: existingAuthUserError } = await doesAuthUserExistByEmail(
    parsed.data.email
  );

  if (existingAuthUserError) {
    redirect(
      buildPathWithNotice("/sign-up", {
        error: copy.errors.validateEmailLater,
        fields: {
          displayName: normalizedDisplayName,
          email: parsed.data.email
        }
      })
    );
  }

  if (existingAuthUser) {
    redirect(
      buildPathWithNotice("/sign-up", {
        error: copy.errors.emailAlreadyInUse,
        fields: {
          displayName: normalizedDisplayName,
          email: parsed.data.email,
          emailInUse: "1"
        }
      })
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/confirm?next=/dashboard` : undefined,
      data: {
        display_name: normalizedDisplayName
      }
    }
  });

  if (error) {
    const emailAlreadyInUse = isEmailAlreadyRegisteredError(error.message);

    redirect(
      buildPathWithNotice("/sign-up", {
        error: emailAlreadyInUse
          ? copy.errors.emailAlreadyInUse
          : isDuplicateDisplayNameError(error.message)
            ? copy.errors.duplicateDisplayName
            : getFriendlyAuthEmailError(locale, error),
        fields: {
          displayName: normalizedDisplayName,
          email: parsed.data.email,
          emailInUse: emailAlreadyInUse ? "1" : undefined
        }
      })
    );
  }

  revalidatePath("/", "layout");

  if (data.session) {
    await supabase.auth.signOut();

    if (data.user?.id) {
      await adminSupabase.auth.admin.deleteUser(data.user.id);
    }

    redirect(
      buildPathWithNotice("/sign-up", {
        error: copy.errors.emailConfirmationOff,
        fields: {
          displayName: normalizedDisplayName,
          email: parsed.data.email
        }
      })
    );
  }

  redirect(
    buildPathWithNotice("/sign-in", {
      message: copy.messages.checkEmailToConfirm
    })
  );
}

export async function requestPasswordResetAction(formData: FormData) {
  const locale = await getRequestLocale();
  const copy = getAuthActionCopy(locale);

  if (!isSupabaseConfigured()) {
    redirect(
      buildPathWithNotice("/forgot-password", {
        error: copy.errors.supabaseNotConfigured
      })
    );
  }

  const parsed = createForgotPasswordSchema(locale).safeParse({
    email: formData.get("email")
  });

  const submittedEmail = String(formData.get("email") || "").trim();

  if (!parsed.success) {
    redirect(
      buildPathWithNotice("/forgot-password", {
        error: parsed.error.issues[0]?.message || copy.errors.reviewEmailAddress,
        fields: {
          email: submittedEmail
        }
      })
    );
  }

  const headerStore = await headers();
  const origin = getSafeOriginFromHeaders(headerStore);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: origin ? `${origin}/reset-password` : undefined
  });

  if (error) {
    redirect(
      buildPathWithNotice("/forgot-password", {
        error: getFriendlyAuthEmailError(locale, error),
        fields: {
          email: parsed.data.email
        }
      })
    );
  }

  redirect(
    buildPathWithNotice("/forgot-password", {
      message: copy.messages.passwordResetSent,
      fields: {
        email: parsed.data.email
      }
    })
  );
}

export async function signOutAction() {
  const locale = await getRequestLocale();
  const copy = getAuthActionCopy(locale);

  if (!isSupabaseConfigured()) {
    redirect("/sign-in");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/sign-in", {
      message: copy.messages.signedOut
    })
  );
}
