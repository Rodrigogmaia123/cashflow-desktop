import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cashflow — Clareza de caixa no seu computador",
  description:
    "Programa para Windows: veja o que entra, o que sai e o que sobra. Dados no seu PC, licença por serial.",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="scroll-smooth">
      <body
        className={cn(
          "h-full bg-background font-sans antialiased text-sm text-foreground"
        )}
      >
        {children}
      </body>
    </html>
  );
}


