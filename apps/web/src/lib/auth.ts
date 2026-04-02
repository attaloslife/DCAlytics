import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { buildPathWithNotice } from "@/lib/flash";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  display_name: string | null;
  default_locale: string;
  default_currency: string;
};

type ClaimsRecord = Record<string, unknown>;

function getStringClaim(claims: ClaimsRecord | null, key: string) {
  const value = claims?.[key];
  return typeof value === "string" ? value : null;
}

export async function getAuthenticatedContext() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const typedClaims = (data?.claims ?? null) as ClaimsRecord | null;
  const userId = getStringClaim(typedClaims, "sub");

  if (error || !userId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, default_locale, default_currency")
    .eq("id", userId)
    .maybeSingle();

  return {
    supabase,
    userId,
    email: getStringClaim(typedClaims, "email"),
    claims: typedClaims,
    profile: (profile as ProfileRow | null) ?? null
  };
}

export async function requireAuthenticatedContext() {
  const context = await getAuthenticatedContext();

  if (!context) {
    redirect(buildPathWithNotice("/sign-in", {
      error: "Please sign in to continue."
    }));
  }

  return context;
}
