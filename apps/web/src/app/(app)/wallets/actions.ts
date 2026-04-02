"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedContext } from "@/lib/auth";
import { buildPathWithNotice } from "@/lib/flash";
import { validateAndNormalizeWalletAddress } from "@/lib/wallets";

const createWalletSchema = z.object({
  portfolioId: z.string().uuid("Choose a portfolio before saving a wallet."),
  chainId: z.string().uuid("Choose a chain for this wallet."),
  address: z.string().trim().min(10, "Wallet address is required."),
  label: z.string().trim().max(120).optional().default(""),
  ownershipType: z.enum(["owned", "watched"]).default("owned")
});

const toggleWalletSchema = z.object({
  walletId: z.string().uuid("Choose a valid wallet."),
  portfolioId: z.string().uuid("Choose a valid portfolio."),
  isActive: z.enum(["true", "false"])
});

const deleteWalletSchema = z.object({
  walletId: z.string().uuid("Choose a valid wallet."),
  portfolioId: z.string().uuid("Choose a valid portfolio.")
});

function redirectToWalletsWithError(message: string): never {
  redirect(
    buildPathWithNotice("/wallets", {
      error: message
    })
  );
}

async function getPortfolioAndChain(portfolioId: string, chainId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const [portfolioResult, chainResult] = await Promise.all([
    supabase
      .from("portfolios")
      .select("id, name")
      .eq("id", portfolioId)
      .maybeSingle(),
    supabase
      .from("chains")
      .select("id, name, slug, family")
      .eq("id", chainId)
      .maybeSingle()
  ]);

  return {
    supabase,
    portfolio: portfolioResult.error || !portfolioResult.data ? null : portfolioResult.data,
    chain: chainResult.error || !chainResult.data ? null : chainResult.data
  };
}

export async function createWalletAddressAction(formData: FormData) {
  const parsed = createWalletSchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    chainId: formData.get("chainId"),
    address: formData.get("address"),
    label: formData.get("label"),
    ownershipType: formData.get("ownershipType")
  });

  if (!parsed.success) {
    redirectToWalletsWithError(parsed.error.issues[0]?.message || "Unable to save that wallet.");
  }

  const { supabase, portfolio, chain } = await getPortfolioAndChain(
    parsed.data.portfolioId,
    parsed.data.chainId
  );

  if (!portfolio) {
    redirectToWalletsWithError("The active portfolio could not be accessed.");
  }

  if (!chain) {
    redirectToWalletsWithError("Choose a valid chain for this wallet.");
  }

  const { normalizedAddress, error } = validateAndNormalizeWalletAddress(
    parsed.data.address,
    chain.family
  );

  if (error) {
    redirectToWalletsWithError(error);
  }

  const { error: insertError } = await supabase.from("wallet_addresses").insert({
    portfolio_id: parsed.data.portfolioId,
    chain_id: parsed.data.chainId,
    address: parsed.data.address.trim(),
    address_normalized: normalizedAddress,
    label: parsed.data.label || null,
    ownership_type: parsed.data.ownershipType
  });

  if (insertError) {
    if (insertError.code === "23505") {
      redirectToWalletsWithError("That wallet is already tracked for this chain in the active portfolio.");
    }

    redirectToWalletsWithError(insertError.message || "Unable to save that wallet.");
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/wallets", {
      message: `${chain.name} wallet added to ${portfolio.name}.`
    })
  );
}

export async function toggleWalletAddressStatusAction(formData: FormData) {
  const parsed = toggleWalletSchema.safeParse({
    walletId: formData.get("walletId"),
    portfolioId: formData.get("portfolioId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    redirectToWalletsWithError(parsed.error.issues[0]?.message || "Unable to update that wallet.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const nextActiveState = parsed.data.isActive === "true";
  const { error } = await supabase
    .from("wallet_addresses")
    .update({
      is_active: nextActiveState
    })
    .eq("id", parsed.data.walletId)
    .eq("portfolio_id", parsed.data.portfolioId);

  if (error) {
    redirectToWalletsWithError(error.message || "Unable to update that wallet.");
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/wallets", {
      message: nextActiveState ? "Wallet reactivated." : "Wallet deactivated."
    })
  );
}

export async function deleteWalletAddressAction(formData: FormData) {
  const parsed = deleteWalletSchema.safeParse({
    walletId: formData.get("walletId"),
    portfolioId: formData.get("portfolioId")
  });

  if (!parsed.success) {
    redirectToWalletsWithError(parsed.error.issues[0]?.message || "Unable to remove that wallet.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error } = await supabase
    .from("wallet_addresses")
    .delete()
    .eq("id", parsed.data.walletId)
    .eq("portfolio_id", parsed.data.portfolioId);

  if (error) {
    redirectToWalletsWithError(error.message || "Unable to remove that wallet.");
  }

  revalidatePath("/", "layout");
  redirect(
    buildPathWithNotice("/wallets", {
      message: "Wallet removed."
    })
  );
}
