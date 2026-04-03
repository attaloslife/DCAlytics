"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedContext } from "@/lib/auth";
import { buildPathWithNotice } from "@/lib/flash";
import { getRequestLocale, persistLocaleCookie } from "@/lib/i18n";
import { normalizeLocale } from "@/lib/locales";
import { createAdminClient } from "@/lib/supabase/admin";

function getSettingsActionCopy(locale: "en" | "tr") {
  if (locale === "tr") {
    return {
      errors: {
        reviewProfileSettings: "Profil ayarlariniz guncellenemedi.",
        validateDisplayNameLater:
          "Bu gorunen adi su anda dogrulayamadik. Lutfen tekrar deneyin.",
        duplicateDisplayName: "Bu gorunen ad zaten alinmis. Lutfen baska bir ad secin.",
        accountEmailUnavailable: "Hesap e-postaniz belirlenemedi.",
        currentPasswordIncorrect: "Mevcut sifreniz yanlis.",
        passwordUpdatedFailed: "Sifrenizi simdi guncelleyemedik."
      },
      validation: {
        displayNameMin: "Gorunen ad en az 2 karakter olmali.",
        chooseDefaultCurrency: "Varsayilan bir para birimi secin.",
        chooseDefaultLanguage: "Varsayilan bir dil secin.",
        currentPasswordRequired: "Lutfen mevcut sifrenizi girin.",
        newPasswordMin: "Yeni sifre en az 8 karakter olmali.",
        confirmNewPasswordRequired: "Lutfen yeni sifrenizi dogrulayin.",
        newPasswordsDoNotMatch: "Yeni sifreler eslesmiyor.",
        newPasswordDifferent:
          "Mevcut sifrenizden farkli yeni bir sifre secin."
      },
      messages: {
        profileUpdated: "Profil ayarlari guncellendi.",
        passwordUpdated: "Sifre basariyla guncellendi."
      }
    };
  }

  return {
    errors: {
      reviewProfileSettings: "Unable to update your profile settings.",
      validateDisplayNameLater:
        "We could not validate that display name yet. Please try again.",
      duplicateDisplayName: "That display name is already taken. Please choose another one.",
      accountEmailUnavailable: "Your account email could not be determined.",
      currentPasswordIncorrect: "Your current password is incorrect.",
      passwordUpdatedFailed: "We could not update your password yet."
    },
    validation: {
      displayNameMin: "Display name must be at least 2 characters.",
      chooseDefaultCurrency: "Choose a default currency.",
      chooseDefaultLanguage: "Choose a default language.",
      currentPasswordRequired: "Enter your current password.",
      newPasswordMin: "New password must be at least 8 characters.",
      confirmNewPasswordRequired: "Please confirm your new password.",
      newPasswordsDoNotMatch: "New passwords do not match.",
      newPasswordDifferent:
        "Choose a new password different from your current password."
    },
    messages: {
      profileUpdated: "Profile settings updated.",
      passwordUpdated: "Password updated successfully."
    }
  };
}

function createUpdateProfileSettingsSchema(locale: "en" | "tr") {
  const copy = getSettingsActionCopy(locale);

  return z.object({
    displayName: z.string().trim().min(2, copy.validation.displayNameMin).max(80),
    defaultCurrency: z.string().trim().min(3, copy.validation.chooseDefaultCurrency).max(10),
    defaultLocale: z.string().trim().min(2, copy.validation.chooseDefaultLanguage).max(16)
  });
}

function createChangePasswordSchema(locale: "en" | "tr") {
  const copy = getSettingsActionCopy(locale);

  return z
    .object({
      currentPassword: z.string().min(1, copy.validation.currentPasswordRequired),
      newPassword: z.string().min(8, copy.validation.newPasswordMin),
      confirmNewPassword: z.string().min(1, copy.validation.confirmNewPasswordRequired)
    })
    .superRefine(({ currentPassword, newPassword, confirmNewPassword }, context) => {
      if (newPassword !== confirmNewPassword) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmNewPassword"],
          message: copy.validation.newPasswordsDoNotMatch
        });
      }

      if (currentPassword === newPassword) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newPassword"],
          message: copy.validation.newPasswordDifferent
        });
      }
    });
}

function redirectToSettingsWithError(message: string): never {
  redirect(
    buildPathWithNotice("/settings", {
      error: message
    })
  );
}

export async function updateProfileSettingsAction(formData: FormData) {
  const locale = await getRequestLocale();
  const copy = getSettingsActionCopy(locale);
  const { supabase, userId } = await requireAuthenticatedContext();
  const parsed = createUpdateProfileSettingsSchema(locale).safeParse({
    displayName: formData.get("displayName"),
    defaultCurrency: formData.get("defaultCurrency"),
    defaultLocale: formData.get("defaultLocale")
  });

  if (!parsed.success) {
    redirectToSettingsWithError(
      parsed.error.issues[0]?.message || copy.errors.reviewProfileSettings
    );
  }

  const normalizedDisplayName = parsed.data.displayName.trim();
  const adminSupabase = createAdminClient();
  const { data: existingProfiles, error: lookupError } = await adminSupabase
    .from("profiles")
    .select("id")
    .ilike("display_name", normalizedDisplayName)
    .neq("id", userId)
    .limit(1);

  if (lookupError) {
    redirectToSettingsWithError(
      copy.errors.validateDisplayNameLater
    );
  }

  if ((existingProfiles ?? []).length > 0) {
    redirectToSettingsWithError(copy.errors.duplicateDisplayName);
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        display_name: normalizedDisplayName,
        default_currency: parsed.data.defaultCurrency.trim().toLowerCase(),
        default_locale: parsed.data.defaultLocale.trim().toLowerCase()
      },
      {
        onConflict: "id"
      }
    );

  if (error) {
    redirectToSettingsWithError(error.message || copy.errors.reviewProfileSettings);
  }

  await persistLocaleCookie(parsed.data.defaultLocale);

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/settings", {
      message:
        getSettingsActionCopy(
          normalizeLocale(parsed.data.defaultLocale) ?? locale
        ).messages.profileUpdated
    })
  );
}

export async function changePasswordFromSettingsAction(formData: FormData) {
  const locale = await getRequestLocale();
  const copy = getSettingsActionCopy(locale);
  const { supabase, email } = await requireAuthenticatedContext();
  const parsed = createChangePasswordSchema(locale).safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword")
  });

  if (!parsed.success) {
    redirectToSettingsWithError(
      parsed.error.issues[0]?.message || copy.errors.passwordUpdatedFailed
    );
  }

  if (!email) {
    redirectToSettingsWithError(copy.errors.accountEmailUnavailable);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.currentPassword
  });

  if (signInError) {
    redirectToSettingsWithError(copy.errors.currentPasswordIncorrect);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword
  });

  if (updateError) {
    redirectToSettingsWithError(updateError.message || copy.errors.passwordUpdatedFailed);
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/settings", {
      message: copy.messages.passwordUpdated
    })
  );
}
