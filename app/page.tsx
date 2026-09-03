import { redirect } from "next/navigation";
import { isDesktopMode } from "@/lib/desktop";
import { LandingContent } from "./(marketing)/landing/landing-content";

export const metadata = {
  title: "Cashflow — Clareza de caixa no seu computador",
  description:
    "Programa para Windows: veja o que entra, o que sai e o que sobra. Dados no seu PC, licença por serial. 3 meses por R$ 30.",
};

export default function LandingPage() {
  if (isDesktopMode()) {
    redirect("/app/overview");
  }

  return <LandingContent />;
}
