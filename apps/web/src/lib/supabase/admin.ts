import { createClient } from "@supabase/supabase-js";

import { getSupabaseCredentials, getSupabaseServiceRoleKey } from "@/lib/env";

export function createAdminClient() {
  const { url } = getSupabaseCredentials();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
