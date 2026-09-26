import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDesktopMode } from "@/lib/desktop";
import { LandingContent } from "./(marketing)/landing/landing-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cashflow Pro — Quanto realmente sobrou",
  description:
    "Saiba quanto a operação realmente deixou no caixa. Cashflow Pro para Windows e Mac: receita, ads, taxas, impostos e despesas. 12 meses por R$ 97, pagamento único.",
};

export default async function LandingPage() {
  const host = (await headers()).get("host") ?? "";
  if (isDesktopMode() && !/getcashflow\.pro/i.test(host)) {
    redirect("/app/overview");
  }

  return <LandingContent />;
}
