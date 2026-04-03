import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getRequestLocale } from "@/lib/i18n";

import "./globals.css";

export const metadata: Metadata = {
  title: "PrismFolio",
  description: "Your portfolio, in focus.",
  icons: {
    icon: "/prismfolio-mark.svg"
  }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
