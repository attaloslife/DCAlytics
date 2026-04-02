import { z } from "zod";

const optionalNonEmptyString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : trimmedValue;
}, z.string().min(1).optional());

const optionalUrlString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : trimmedValue;
}, z.string().url().optional());

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrlString,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalNonEmptyString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalNonEmptyString
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString,
  COINGECKO_DEMO_API_KEY: optionalNonEmptyString,
  COINGECKO_PRO_API_KEY: optionalNonEmptyString
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
}

export function getSupabaseCredentials() {
  const env = getPublicEnv();

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL || "",
    key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  };
}

export function getSupabaseServiceRoleKey() {
  const env = serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    COINGECKO_DEMO_API_KEY: process.env.COINGECKO_DEMO_API_KEY,
    COINGECKO_PRO_API_KEY: process.env.COINGECKO_PRO_API_KEY
  });

  return env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function getCoinGeckoServerConfig() {
  const env = serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    COINGECKO_DEMO_API_KEY: process.env.COINGECKO_DEMO_API_KEY,
    COINGECKO_PRO_API_KEY: process.env.COINGECKO_PRO_API_KEY
  });
  const headers: Record<string, string> = {};

  if (env.COINGECKO_PRO_API_KEY) {
    headers["x-cg-pro-api-key"] = env.COINGECKO_PRO_API_KEY;
    return {
      apiBaseUrl: "https://pro-api.coingecko.com/api/v3",
      headers
    };
  }

  if (env.COINGECKO_DEMO_API_KEY) {
    headers["x-cg-demo-api-key"] = env.COINGECKO_DEMO_API_KEY;
    return {
      apiBaseUrl: "https://api.coingecko.com/api/v3",
      headers
    };
  }

  return {
    apiBaseUrl: "https://api.coingecko.com/api/v3",
    headers: {}
  };
}

export function isSupabaseConfigured() {
  const credentials = getSupabaseCredentials();
  return Boolean(credentials.url && credentials.key);
}
