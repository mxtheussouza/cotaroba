import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cotaroba | Observatório pecuário da Bahia",
  description:
    "Observatório pecuário da Bahia. Informações regionais para acompanhar o mercado pecuário.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
