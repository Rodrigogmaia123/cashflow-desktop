import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { updateWorkspaceFees } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENCY_OPTIONS, type CurrencyCode } from "@/lib/domain/currency";

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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Configuração de Taxas
        </h1>
        <p className="text-sm text-muted-foreground">
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

      <Card className="max-w-2xl border-white/5 bg-card">
        <CardContent className="p-6">
          <form
            action={updateWorkspaceFees}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-[#A855F7]"></div>
                  <label
                    htmlFor="currency"
                    className="text-sm font-medium text-foreground"
                  >
                    Moeda da configuração
                  </label>
                </div>
                <select
                  id="currency"
                  name="currency"
                  defaultValue={currency}
                  disabled={!isAdmin}
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Moeda do valor fixo de gateway nesta configuração.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-[#3B82F6]"></div>
                  <label
                    htmlFor="checkoutPercentage"
                    className="text-sm font-medium text-foreground"
                  >
                    Taxa de Checkout (Percentual)
                  </label>
                </div>
                <input
                  id="checkoutPercentage"
                  name="checkoutPercentage"
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  defaultValue={checkoutPercentage.toFixed(2)}
                  disabled={!isAdmin}
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.10"
                />
                <p className="text-xs text-muted-foreground">
                  Fração do faturamento. Ex: 0.10 = 10% do faturamento
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-[#8B5CF6]"></div>
                  <label
                    htmlFor="gatewayFeePerSale"
                    className="text-sm font-medium text-foreground"
                  >
                    Taxa de Gateway (Fixo)
                  </label>
                </div>
                <input
                  id="gatewayFeePerSale"
                  name="gatewayFeePerSale"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={gatewayFeePerSale.toFixed(2)}
                  disabled={!isAdmin}
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.30"
                />
                <p className="text-xs text-muted-foreground">
                  Valor fixo na moeda da configuração, cobrado por venda
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-[#8B5CF6]"></div>
                  <label
                    htmlFor="taxPercentage"
                    className="text-sm font-medium text-foreground"
                  >
                    Imposto (Percentual)
                  </label>
                </div>
                <input
                  id="taxPercentage"
                  name="taxPercentage"
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  defaultValue={taxPercentage.toFixed(2)}
                  disabled={!isAdmin}
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.06"
                />
                <p className="text-xs text-muted-foreground">
                  Fração do faturamento. Ex: 0.06 = 6% do faturamento
                </p>
              </div>
            </div>

            {isAdmin && (
              <Button 
                type="submit" 
                size="sm" 
                className="w-full bg-gradient-to-r from-[#8B5CF6] to-purple-600 hover:from-[#8B5CF6]/90 hover:to-purple-600/90"
              >
                Salvar taxas do workspace
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}


