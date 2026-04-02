"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/env";
import { buildPathWithNotice } from "@/lib/flash";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters.").max(80)
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address.")
});

function getSafeOriginFromHeaders(headerStore: Headers) {
  const directOrigin = headerStore.get("origin");

  if (directOrigin) {
    return directOrigin;
  }

  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "http";

  return host ? `${proto}://${host}` : "";
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

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(
      buildPathWithNotice("/sign-in", {
        error: "Supabase environment variables are not configured yet."
      })
    );
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  const submittedEmail = String(formData.get("email") || "").trim();

  if (!parsed.success) {
    redirect(
      buildPathWithNotice("/sign-in", {
        error: parsed.error.issues[0]?.message || "Please review your sign-in details.",
        fields: {
          email: submittedEmail
        }
      })
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(
      buildPathWithNotice("/sign-in", {
        error: error.message,
        fields: {
          email: parsed.data.email
        }
      })
    );
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/dashboard", {
      message: "Welcome back."
    })
  );
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(
      buildPathWithNotice("/sign-up", {
        error: "Supabase environment variables are not configured yet."
      })
    );
  }

  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  const submittedDisplayName = String(formData.get("displayName") || "").trim();
  const submittedEmail = String(formData.get("email") || "").trim();

  if (!parsed.success) {
    redirect(
      buildPathWithNotice("/sign-up", {
        error: parsed.error.issues[0]?.message || "Please review your sign-up details.",
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
        error: "We could not validate that display name yet. Please try again.",
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
        error: "That display name is already taken. Please choose another one.",
        fields: {
          displayName: normalizedDisplayName,
          email: parsed.data.email
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
          ? "That email is already in use. Try signing in or resetting your password."
          : isDuplicateDisplayNameError(error.message)
            ? "That display name is already taken. Please choose another one."
            : error.message,
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
    redirect(
      buildPathWithNotice("/dashboard", {
        message: "Account created successfully."
      })
    );
  }

  redirect(
    buildPathWithNotice("/sign-in", {
      message: "Check your email to confirm your account, then sign in."
    })
  );
}

export async function requestPasswordResetAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(
      buildPathWithNotice("/forgot-password", {
        error: "Supabase environment variables are not configured yet."
      })
    );
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email")
  });

  const submittedEmail = String(formData.get("email") || "").trim();

  if (!parsed.success) {
    redirect(
      buildPathWithNotice("/forgot-password", {
        error: parsed.error.issues[0]?.message || "Please review your email address.",
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
        error: "We could not send that reset email yet. Please try again.",
        fields: {
          email: parsed.data.email
        }
      })
    );
  }

  redirect(
    buildPathWithNotice("/forgot-password", {
      message: "If that email exists, a password reset link is on the way.",
      fields: {
        email: parsed.data.email
      }
    })
  );
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/sign-in", {
      message: "Signed out."
    })
  );
}
