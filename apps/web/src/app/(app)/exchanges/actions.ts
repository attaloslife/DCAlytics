"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedContext } from "@/lib/auth";
import { buildPathWithNotice } from "@/lib/flash";
import { SUPPORTED_EXCHANGES } from "@/lib/exchanges";

const supportedExchangeSlugs = SUPPORTED_EXCHANGES.map((exchange) => exchange.slug) as [
  (typeof SUPPORTED_EXCHANGES)[number]["slug"],
  ...(typeof SUPPORTED_EXCHANGES)[number]["slug"][]
];

const createExchangeConnectionSchema = z.object({
  portfolioId: z.string().uuid("Choose a portfolio before saving an exchange connection."),
  exchangeSlug: z.enum(supportedExchangeSlugs, {
    message: "Choose one of the supported exchanges."
  }),
  label: z.string().trim().max(120).optional().default(""),
  accountHint: z.string().trim().max(160).optional().default(""),
  apiKeyLabel: z.string().trim().max(160).optional().default(""),
  syncBalances: z.boolean(),
  syncTrades: z.boolean(),
  testnet: z.boolean()
}).refine((value) => value.syncBalances || value.syncTrades, {
  message: "Enable balances, trades, or both before saving the connection profile.",
  path: ["syncBalances"]
});

const toggleExchangeConnectionSchema = z.object({
  connectionId: z.string().uuid("Choose a valid exchange connection."),
  portfolioId: z.string().uuid("Choose a valid portfolio."),
  status: z.enum(["active", "paused"])
});

const deleteExchangeConnectionSchema = z.object({
  connectionId: z.string().uuid("Choose a valid exchange connection."),
  portfolioId: z.string().uuid("Choose a valid portfolio.")
});

function redirectToExchangesWithError(message: string): never {
  redirect(
    buildPathWithNotice("/exchanges", {
      error: message
    })
  );
}

async function getAccessiblePortfolio(portfolioId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("portfolios")
    .select("id, name")
    .eq("id", portfolioId)
    .maybeSingle();

  return {
    supabase,
    portfolio: error || !data ? null : data
  };
}

export async function createExchangeConnectionAction(formData: FormData) {
  const parsed = createExchangeConnectionSchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    exchangeSlug: formData.get("exchangeSlug"),
    label: formData.get("label"),
    accountHint: formData.get("accountHint"),
    apiKeyLabel: formData.get("apiKeyLabel"),
    syncBalances: formData.get("syncBalances") === "on",
    syncTrades: formData.get("syncTrades") === "on",
    testnet: formData.get("testnet") === "on"
  });

  if (!parsed.success) {
    redirectToExchangesWithError(
      parsed.error.issues[0]?.message || "Unable to save that exchange connection."
    );
  }

  const { supabase, portfolio } = await getAccessiblePortfolio(parsed.data.portfolioId);

  if (!portfolio) {
    redirectToExchangesWithError("The active portfolio could not be accessed.");
  }

  const exchange = SUPPORTED_EXCHANGES.find(
    (candidate) => candidate.slug === parsed.data.exchangeSlug
  );

  const { error } = await supabase.from("exchange_connections").insert({
    portfolio_id: parsed.data.portfolioId,
    exchange_slug: parsed.data.exchangeSlug,
    label: parsed.data.label || null,
    account_hint: parsed.data.accountHint || null,
    api_key_label: parsed.data.apiKeyLabel || null,
    status: "active",
    read_only: true,
    sync_balances: parsed.data.syncBalances,
    sync_trades: parsed.data.syncTrades,
    testnet: parsed.data.testnet,
    last_sync_status: "idle"
  });

  if (error) {
    redirectToExchangesWithError(error.message || "Unable to save that exchange connection.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  redirect(
    buildPathWithNotice("/exchanges", {
      message: `${exchange?.name || "Exchange"} connection profile saved to ${portfolio.name}.`
    })
  );
}

export async function toggleExchangeConnectionStatusAction(formData: FormData) {
  const parsed = toggleExchangeConnectionSchema.safeParse({
    connectionId: formData.get("connectionId"),
    portfolioId: formData.get("portfolioId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    redirectToExchangesWithError(
      parsed.error.issues[0]?.message || "Unable to update that exchange connection."
    );
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase
    .from("exchange_connections")
    .update({
      status: parsed.data.status
    })
    .eq("id", parsed.data.connectionId)
    .eq("portfolio_id", parsed.data.portfolioId);

  if (error) {
    redirectToExchangesWithError(error.message || "Unable to update that exchange connection.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  redirect(
    buildPathWithNotice("/exchanges", {
      message:
        parsed.data.status === "active"
          ? "Exchange connection reactivated."
          : "Exchange connection paused."
    })
  );
}

export async function deleteExchangeConnectionAction(formData: FormData) {
  const parsed = deleteExchangeConnectionSchema.safeParse({
    connectionId: formData.get("connectionId"),
    portfolioId: formData.get("portfolioId")
  });

  if (!parsed.success) {
    redirectToExchangesWithError(
      parsed.error.issues[0]?.message || "Unable to remove that exchange connection."
    );
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase
    .from("exchange_connections")
    .delete()
    .eq("id", parsed.data.connectionId)
    .eq("portfolio_id", parsed.data.portfolioId);

  if (error) {
    redirectToExchangesWithError(error.message || "Unable to remove that exchange connection.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  redirect(
    buildPathWithNotice("/exchanges", {
      message: "Exchange connection removed."
    })
  );
}
