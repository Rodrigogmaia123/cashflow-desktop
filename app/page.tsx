import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDesktopMode } from "@/lib/desktop";
import { LandingContent } from "./(marketing)/landing/landing-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cashflow — Clareza de caixa no seu computador",
  description:
    "Programa para Windows e Mac: veja o que entra, o que sai e o que sobra. Dados no seu computador, licença por serial. 3 meses por R$ 30.",
};

export default async function LandingPage() {
  const host = (await headers()).get("host") ?? "";
  if (isDesktopMode() && !/getcashflow\.pro/i.test(host)) {
    redirect("/app/overview");
  }

  return <LandingContent />;
}
