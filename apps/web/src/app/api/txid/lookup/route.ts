import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveCoinSelection } from "@/lib/coingecko";
import { prepareTxidPrefill } from "@/lib/txid";

const txidLookupSchema = z.object({
  coinMarketId: z.string().trim().optional().default(""),
  coinName: z.string().trim().min(1, "Choose a coin before fetching."),
  coinSymbol: z.string().trim().optional().default(""),
  networkKey: z.string().trim().min(1, "Choose a network before fetching."),
  transactionHash: z.string().trim().min(1, "Enter a transaction hash before fetching."),
  currencyCode: z.string().trim().min(3).default("usd")
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = txidLookupSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Unable to prepare this transaction."
        },
        {
          status: 400
        }
      );
    }

    const resolvedCoin = await resolveCoinSelection({
      marketId: parsed.data.coinMarketId,
      coinName: parsed.data.coinName,
      coinSymbol: parsed.data.coinSymbol
    });

    if (!resolvedCoin.entry) {
      return NextResponse.json(
        {
          error: "Choose a coin from the suggestions first so TXID lookup can match it correctly."
        },
        {
          status: 400
        }
      );
    }

    const prefill = await prepareTxidPrefill({
      coin: resolvedCoin.entry,
      networkKey: parsed.data.networkKey,
      transactionHash: parsed.data.transactionHash,
      currencyCode: parsed.data.currencyCode.toLowerCase()
    });

    return NextResponse.json({
      prefill,
      coin: {
        marketId: resolvedCoin.entry.marketId,
        symbol: resolvedCoin.entry.symbol,
        name: resolvedCoin.entry.name
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to prepare that transaction."
      },
      {
        status: 500
      }
    );
  }
}
