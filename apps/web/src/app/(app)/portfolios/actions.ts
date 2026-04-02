"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedContext } from "@/lib/auth";
import { buildPathWithNotice } from "@/lib/flash";
import { setActivePortfolioCookie } from "@/lib/portfolios";
import { createAdminClient } from "@/lib/supabase/admin";

const createPortfolioSchema = z.object({
  name: z.string().trim().min(2, "Portfolio name must be at least 2 characters.").max(80),
  baseCurrency: z.string().trim().min(3, "Enter a base currency code.").max(10),
  description: z.string().trim().max(240).optional().default("")
});

const updatePortfolioSchema = createPortfolioSchema.extend({
  portfolioId: z.string().uuid("Invalid portfolio id.")
});

const toggleArchiveSchema = z.object({
  portfolioId: z.string().uuid("Invalid portfolio id."),
  archive: z.enum(["true", "false"])
});

const deletePortfolioSchema = z.object({
  portfolioId: z.string().uuid("Invalid portfolio id.")
});

const setActivePortfolioSchema = z.object({
  portfolioId: z.string().uuid("Invalid portfolio id."),
  returnTo: z.string().optional().default("/portfolios")
});

function getSafeReturnTo(value: string) {
  return value.startsWith("/") ? value : "/portfolios";
}

export async function createPortfolioAction(formData: FormData) {
  const { supabase, userId } = await requireAuthenticatedContext();
  const adminSupabase = createAdminClient();
  const parsed = createPortfolioSchema.safeParse({
    name: formData.get("name"),
    baseCurrency: formData.get("baseCurrency"),
    description: formData.get("description")
  });

  if (!parsed.success) {
    redirect(buildPathWithNotice("/portfolios", {
      error: parsed.error.issues[0]?.message || "Unable to create portfolio."
    }));
  }

  const portfolioId = crypto.randomUUID();
  const { error } = await supabase
    .from("portfolios")
    .insert({
      id: portfolioId,
      owner_user_id: userId,
      name: parsed.data.name,
      base_currency: parsed.data.baseCurrency.toLowerCase(),
      description: parsed.data.description || null
    });

  if (error) {
    redirect(buildPathWithNotice("/portfolios", {
      error: error?.message || "Unable to create portfolio."
    }));
  }

  const { error: membershipError } = await adminSupabase
    .from("portfolio_members")
    .upsert(
      {
        portfolio_id: portfolioId,
        user_id: userId,
        role: "owner"
      },
      {
        onConflict: "portfolio_id,user_id"
      }
    );

  if (membershipError) {
    redirect(buildPathWithNotice("/portfolios", {
      error: membershipError.message || "Portfolio was created, but owner access could not be finalized."
    }));
  }

  await setActivePortfolioCookie(portfolioId);
  revalidatePath("/", "layout");
  redirect(buildPathWithNotice("/portfolios", {
    message: "Portfolio created."
  }));
}

export async function updatePortfolioAction(formData: FormData) {
  const { supabase } = await requireAuthenticatedContext();
  const parsed = updatePortfolioSchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    name: formData.get("name"),
    baseCurrency: formData.get("baseCurrency"),
    description: formData.get("description")
  });

  if (!parsed.success) {
    redirect(buildPathWithNotice("/portfolios", {
      error: parsed.error.issues[0]?.message || "Unable to update portfolio."
    }));
  }

  const { error } = await supabase
    .from("portfolios")
    .update({
      name: parsed.data.name,
      base_currency: parsed.data.baseCurrency.toLowerCase(),
      description: parsed.data.description || null
    })
    .eq("id", parsed.data.portfolioId);

  if (error) {
    redirect(buildPathWithNotice("/portfolios", {
      error: error.message
    }));
  }

  revalidatePath("/", "layout");
  redirect(buildPathWithNotice("/portfolios", {
    message: "Portfolio updated."
  }));
}

export async function togglePortfolioArchiveAction(formData: FormData) {
  const { supabase } = await requireAuthenticatedContext();
  const parsed = toggleArchiveSchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    archive: formData.get("archive")
  });

  if (!parsed.success) {
    redirect(buildPathWithNotice("/portfolios", {
      error: parsed.error.issues[0]?.message || "Unable to update portfolio status."
    }));
  }

  const isArchived = parsed.data.archive === "true";
  const { error } = await supabase
    .from("portfolios")
    .update({
      is_archived: isArchived
    })
    .eq("id", parsed.data.portfolioId);

  if (error) {
    redirect(buildPathWithNotice("/portfolios", {
      error: error.message
    }));
  }

  revalidatePath("/", "layout");
  redirect(buildPathWithNotice("/portfolios", {
    message: isArchived ? "Portfolio archived." : "Portfolio restored."
  }));
}

export async function deletePortfolioAction(formData: FormData) {
  const { supabase } = await requireAuthenticatedContext();
  const parsed = deletePortfolioSchema.safeParse({
    portfolioId: formData.get("portfolioId")
  });

  if (!parsed.success) {
    redirect(buildPathWithNotice("/portfolios", {
      error: parsed.error.issues[0]?.message || "Unable to delete portfolio."
    }));
  }

  const { data: portfolio, error: lookupError } = await supabase
    .from("portfolios")
    .select("id, name")
    .eq("id", parsed.data.portfolioId)
    .maybeSingle();

  if (lookupError || !portfolio) {
    redirect(buildPathWithNotice("/portfolios", {
      error: lookupError?.message || "That portfolio could not be accessed."
    }));
  }

  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", parsed.data.portfolioId);

  if (error) {
    redirect(buildPathWithNotice("/portfolios", {
      error: error.message || "Unable to delete portfolio."
    }));
  }

  revalidatePath("/", "layout");
  redirect(buildPathWithNotice("/portfolios", {
    message: `${portfolio.name} was deleted permanently.`
  }));
}

export async function setActivePortfolioAction(formData: FormData) {
  const { supabase } = await requireAuthenticatedContext();
  const parsed = setActivePortfolioSchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    returnTo: formData.get("returnTo")
  });

  if (!parsed.success) {
    redirect(buildPathWithNotice("/portfolios", {
      error: parsed.error.issues[0]?.message || "Unable to switch portfolios."
    }));
  }

  const safeReturnTo = getSafeReturnTo(parsed.data.returnTo);
  const { data, error } = await supabase
    .from("portfolios")
    .select("id, is_archived")
    .eq("id", parsed.data.portfolioId)
    .maybeSingle();

  if (error || !data) {
    redirect(buildPathWithNotice(safeReturnTo, {
      error: error?.message || "That portfolio could not be accessed."
    }));
  }

  if (data.is_archived) {
    redirect(buildPathWithNotice(safeReturnTo, {
      error: "Archived portfolios cannot be made active."
    }));
  }

  await setActivePortfolioCookie(data.id);
  revalidatePath("/", "layout");
  redirect(buildPathWithNotice(safeReturnTo, {
    message: "Active portfolio updated."
  }));
}
