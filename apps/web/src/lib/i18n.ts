import { cookies, headers } from "next/headers";
import { cache } from "react";

import { getAuthenticatedContext } from "@/lib/auth";
import { defaultLocale, localeCookieName, normalizeLocale, type AppLocale } from "@/lib/locales";

function resolveLocaleFromHeader(headerValue: string | null): AppLocale | null {
  if (!headerValue) {
    return null;
  }

  for (const rawLocale of headerValue.split(",")) {
    const candidate = rawLocale.split(";")[0]?.trim();
    const normalized = normalizeLocale(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export const getRequestLocale = cache(async (): Promise<AppLocale> => {
  const authContext = await getAuthenticatedContext();
  const profileLocale = normalizeLocale(authContext?.profile?.default_locale);

  if (profileLocale) {
    return profileLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(localeCookieName)?.value);

  if (cookieLocale) {
    return cookieLocale;
  }

  const headerStore = await headers();

  return resolveLocaleFromHeader(headerStore.get("accept-language")) ?? defaultLocale;
});

export async function persistLocaleCookie(locale: string | null | undefined) {
  const normalized = normalizeLocale(locale);

  if (!normalized) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, normalized, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });
}
