import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDesktopMode } from "@/lib/desktop";
import { getAdminFinance } from "../finance-actions";
import { AdminFinanceDashboard } from "@/components/admin/admin-finance-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  if (isDesktopMode()) {
    redirect("/app/overview");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.isAdmin) {
    redirect("/app/overview");
  }

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - 29);
  const to = new Date();

  const result = await getAdminFinance({
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  });

  if (!result.success || !result.data) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            Financeiro
          </h1>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Erro ao carregar pedidos: {result.reason}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Financeiro
        </h1>
        <p className="text-sm text-muted-foreground">
          Pedidos gerados, pagos, falhas e cancelados — para ver se o tráfego
          está convertendo, se há ROI e para dar suporte a quem pagou.
        </p>
      </div>
      <AdminFinanceDashboard initialData={result.data} />
    </section>
  );
}
