export const primaryAppNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ledger/add", label: "Add Transaction" },
  { href: "/ledger", label: "Trade Log" },
  { href: "/imports", label: "Imports & Exports" },
  { href: "/wallets", label: "Wallets" },
  { href: "/exchanges", label: "Exchanges" },
  { href: "/portfolios", label: "Portfolios" },
  { href: "/settings", label: "Settings" }
];

export const milestoneChecklist = [
  "Supabase auth wired into the protected app shell",
  "Multiple portfolios available in the switcher",
  "Chain -> coin catalog powering manual transactions",
  "Ledger entries moved from local storage into Postgres",
  "Portfolio-scoped public wallet tracking foundation added",
  "Read-only wallet preview pulling live balances from public providers",
  "Read-only exchange connection foundation ready for live sync work"
];
