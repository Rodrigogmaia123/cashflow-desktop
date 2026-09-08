import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { MetaPixel } from "@/components/ads/meta-pixel";

export const metadata: Metadata = {
  title: "Cashflow — Clareza de caixa no seu computador",
  description:
    "Programa para Windows: veja o que entra, o que sai e o que sobra. Dados no seu PC, licença por serial.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/cashflow-icon.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Cashflow — Clareza de caixa no seu computador",
    description:
      "Programa para Windows: veja o que entra, o que sai e o que sobra. Dados no seu PC, licença por serial.",
    images: [{ url: "/brand/cashflow-icon.png", width: 1024, height: 1024, alt: "Cashflow" }],
  },
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
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
