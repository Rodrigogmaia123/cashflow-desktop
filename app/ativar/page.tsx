import { redirect } from "next/navigation";
import { isDesktopMode } from "@/lib/desktop";
import {
  desktopProductName,
  getDesktopEdition,
} from "@/lib/desktop-edition";
import {
  hasActiveDesktopLicense,
  readDesktopLicenseFile,
} from "@/lib/desktop-license";
import { lockCopyForActivatePage } from "@/lib/license/lease";
import { ActivateLicenseClient } from "./activate-client";
import { CustomerSupportDesk } from "@/components/support/customer-support-desk";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ativar serial — Cashflow",
  description: "Cole a chave para abrir o programa.",
};

export default function ActivateLicensePage() {
  if (!isDesktopMode()) {
    redirect("/");
  }

  if (hasActiveDesktopLicense()) {
    redirect("/app/overview");
  }

  const productName = desktopProductName(getDesktopEdition());
  const stored = readDesktopLicenseFile();
  const lockHint = lockCopyForActivatePage(stored?.lockReason ?? null);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-white/10 bg-card-secondary/80 p-8 shadow-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
            {productName}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Cole a Serial Key
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {lockHint ??
              "Sem uma chave válida este programa não abre o caixa. A chave que chegou no e-mail depois do pagamento vale para uma cópia."}
          </p>
          <ActivateLicenseClient productName={productName} />
        </div>
        <CustomerSupportDesk compact />
      </div>
    </div>
  );
}
