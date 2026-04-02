import { type NextRequest, NextResponse } from "next/server";

import { getAuthenticatedContext } from "@/lib/auth";
import { serializeLedgerEntriesToCsv } from "@/lib/imports";
import { getLedgerEntriesForPortfolio } from "@/lib/ledger";

type RouteContext = {
  params: Promise<{
    portfolioId: string;
  }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authContext = await getAuthenticatedContext();

  if (!authContext) {
    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  const { portfolioId } = await context.params;
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const { data: portfolio } = await authContext.supabase
    .from("portfolios")
    .select("id, name, base_currency")
    .eq("id", portfolioId)
    .maybeSingle();

  if (!portfolio) {
    return NextResponse.json(
      {
        error: "Portfolio not found."
      },
      {
        status: 404
      }
    );
  }

  const entries = await getLedgerEntriesForPortfolio(portfolio.id);
  const fileBaseName = slugify(portfolio.name || "portfolio");

  if (format === "json") {
    return new NextResponse(
      JSON.stringify(
        {
          portfolio: {
            id: portfolio.id,
            name: portfolio.name,
            baseCurrency: portfolio.base_currency,
            exportedAt: new Date().toISOString()
          },
          entries: entries.map((entry) => ({
            id: entry.id,
            occurredAt: entry.occurredAt,
            chain: entry.chain?.slug || null,
            assetSymbol: entry.asset?.symbol || null,
            assetName: entry.asset?.name || null,
            type: entry.entryType,
            quantity: entry.quantity,
            unitPrice: entry.unitPrice,
            grossValue: entry.grossValue,
            feeValue: entry.feeValue,
            currencyCode: entry.currencyCode,
            txHash: entry.txHash,
            externalRef: entry.externalRef,
            notes: entry.notes
          }))
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileBaseName}-trades.json"`
        }
      }
    );
  }

  return new NextResponse(serializeLedgerEntriesToCsv(entries), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileBaseName}-trades.csv"`
    }
  });
}
