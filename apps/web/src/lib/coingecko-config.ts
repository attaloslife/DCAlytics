import "server-only";

import { getCoinGeckoServerConfig } from "@/lib/env";

export function getCoinGeckoApiBaseUrl() {
  return getCoinGeckoServerConfig().apiBaseUrl;
}

export function getCoinGeckoHeaders() {
  return getCoinGeckoServerConfig().headers;
}
