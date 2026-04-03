import type { AppLocale } from "@/lib/locales";

export function getPrimaryAppNav(locale: AppLocale) {
  if (locale === "tr") {
    return [
      { href: "/dashboard", label: "Panel" },
      { href: "/ledger/add", label: "Islem Ekle" },
      { href: "/ledger", label: "Islem Gecmisi" },
      { href: "/imports", label: "Ice Aktar / Disa Aktar" },
      { href: "/wallets", label: "Cuzdanlar" },
      { href: "/exchanges", label: "Borsalar" },
      { href: "/portfolios", label: "Portfoyler" },
      { href: "/settings", label: "Ayarlar" }
    ];
  }

  return [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/ledger/add", label: "Add Transaction" },
    { href: "/ledger", label: "Trade Log" },
    { href: "/imports", label: "Imports & Exports" },
    { href: "/wallets", label: "Wallets" },
    { href: "/exchanges", label: "Exchanges" },
    { href: "/portfolios", label: "Portfolios" },
    { href: "/settings", label: "Settings" }
  ];
}
