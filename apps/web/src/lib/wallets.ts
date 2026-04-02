import { requireAuthenticatedContext } from "@/lib/auth";

type JoinedRecord<T> = T | T[] | null;

type RawChainRecord = {
  id: string;
  slug: string;
  name: string;
  family: "bitcoin" | "evm" | "solana" | "cosmos" | "other";
  native_symbol: string | null;
};

type RawWalletRecord = {
  id: string;
  portfolio_id: string;
  chain_id: string;
  address: string;
  address_normalized: string;
  label: string | null;
  ownership_type: "owned" | "watched";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  chains: JoinedRecord<RawChainRecord>;
};

export type WalletAddressRecord = {
  id: string;
  portfolioId: string;
  chainId: string;
  address: string;
  addressNormalized: string;
  label: string | null;
  ownershipType: "owned" | "watched";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  chain: {
    id: string;
    slug: string;
    name: string;
    family: "bitcoin" | "evm" | "solana" | "cosmos" | "other";
    nativeSymbol: string | null;
  } | null;
};

export type WalletSummary = {
  total: number;
  active: number;
  owned: number;
  watched: number;
};

function unwrapJoin<T>(value: JoinedRecord<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export function formatWalletAddress(address: string) {
  if (address.length <= 18) {
    return address;
  }

  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

export function getWalletSummary(wallets: WalletAddressRecord[]): WalletSummary {
  return wallets.reduce<WalletSummary>(
    (summary, wallet) => {
      summary.total += 1;

      if (wallet.isActive) {
        summary.active += 1;
      }

      if (wallet.ownershipType === "owned") {
        summary.owned += 1;
      } else {
        summary.watched += 1;
      }

      return summary;
    },
    {
      total: 0,
      active: 0,
      owned: 0,
      watched: 0
    }
  );
}

export function validateAndNormalizeWalletAddress(
  address: string,
  family: "bitcoin" | "evm" | "solana" | "cosmos" | "other"
) {
  const trimmed = address.trim();

  if (!trimmed) {
    return {
      normalizedAddress: "",
      error: "Wallet address is required."
    };
  }

  if (family === "evm") {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(trimmed);

    return {
      normalizedAddress: trimmed.toLowerCase(),
      error: isValid ? null : "EVM addresses must look like 0x followed by 40 hexadecimal characters."
    };
  }

  if (family === "bitcoin") {
    const isValid = /^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(trimmed);

    return {
      normalizedAddress: trimmed,
      error: isValid ? null : "Bitcoin addresses must be a valid mainnet legacy or bech32 address."
    };
  }

  if (family === "solana") {
    const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);

    return {
      normalizedAddress: trimmed,
      error: isValid ? null : "Solana addresses must be valid base58 public keys."
    };
  }

  if (family === "cosmos") {
    const isValid = /^[a-z0-9]{3,}1[a-z0-9]{20,}$/i.test(trimmed);

    return {
      normalizedAddress: trimmed.toLowerCase(),
      error: isValid ? null : "Cosmos-family addresses must match the expected bech32 format."
    };
  }

  return {
    normalizedAddress: trimmed,
    error: trimmed.length >= 10 ? null : "Wallet addresses must be at least 10 characters long."
  };
}

export async function getWalletAddressesForPortfolio(portfolioId: string) {
  const { supabase } = await requireAuthenticatedContext();
  const { data, error } = await supabase
    .from("wallet_addresses")
    .select(`
      id,
      portfolio_id,
      chain_id,
      address,
      address_normalized,
      label,
      ownership_type,
      is_active,
      created_at,
      updated_at,
      chains (
        id,
        slug,
        name,
        family,
        native_symbol
      )
    `)
    .eq("portfolio_id", portfolioId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as RawWalletRecord[]).map((row) => {
    const chain = unwrapJoin(row.chains);

    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      chainId: row.chain_id,
      address: row.address,
      addressNormalized: row.address_normalized,
      label: row.label,
      ownershipType: row.ownership_type,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      chain: chain
        ? {
            id: chain.id,
            slug: chain.slug,
            name: chain.name,
            family: chain.family,
            nativeSymbol: chain.native_symbol
          }
        : null
    };
  });
}
