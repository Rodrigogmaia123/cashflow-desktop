import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { type CurrencyCode } from "@/lib/domain/currency";
import { WorkspaceFeesForm } from "./fees-form";

export const dynamic = "force-dynamic";

export default async function WorkspaceFeesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.activeWorkspaceId) {
    redirect("/app/workspaces?missing=1");
  }

  const [membership, config] = await Promise.all([
    prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: user.activeWorkspaceId
        }
      }
    }),
    prisma.workspaceFeeConfig.findUnique({
      where: { workspaceId: user.activeWorkspaceId }
    })
  ]);

  // OWNER tem todas as permissões (incluindo as de ADMIN)
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";

  const checkoutPercentage = config?.checkoutPercentage.toNumber() ?? 0.1;
  const gatewayFeePerSale = config?.gatewayFeePerSale.toNumber() ?? 0.3;
  const taxPercentage = config?.taxPercentage.toNumber() ?? 0.06;
  const currency = (config?.currency ?? "BRL") as CurrencyCode;

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-foreground">
          Configuração de taxas
        </h1>
        <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
          Defina as taxas usadas nos cálculos financeiros (checkout, gateway e
          impostos). Essas taxas são aplicadas a todas as análises de
          performance deste workspace.
        </p>
      </div>

      {!isAdmin && (
        <div className="rounded-xl border border-warning/30 bg-warning-soft/50 p-4">
          <p className="text-sm text-warning">
            Você não é administrador deste workspace. Apenas administradores
            podem alterar as taxas. Os valores abaixo são somente leitura.
          </p>
        </div>
      )}

      <WorkspaceFeesForm
        isAdmin={isAdmin}
        currency={currency}
        checkoutPercentage={checkoutPercentage}
        gatewayFeePerSale={gatewayFeePerSale}
        taxPercentage={taxPercentage}
      />
    </section>
  );
}


