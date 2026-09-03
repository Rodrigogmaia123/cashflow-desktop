import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkFeatureAccess } from "@/lib/plans/authorization";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { getSavedReports } from "./actions";
import { ReportsClient } from "./reports-client";
import { FeatureLock } from "@/components/plans/feature-lock";

export const dynamic = "force-dynamic";

export default async function ReportsSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const featureCheck = await checkFeatureAccess("custom_reports");

  if (!featureCheck.allowed) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            Relatórios Personalizados
          </h1>
          <p className="text-sm text-muted-foreground">
            Salve e reutilize suas configurações de relatórios favoritas
          </p>
        </div>

        <FeatureLock
          feature="custom_reports"
          requiredPlan="BUSINESS"
          title="Relatórios Personalizados"
          description="Crie relatórios personalizados com as métricas mais importantes para você e salve para uso futuro."
          workspaceId={user.activeWorkspaceId || undefined}
        />
      </section>
    );
  }

  const workspaceId = await requireActiveWorkspaceId();
  const reports = await getSavedReports(workspaceId);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Relatórios Personalizados
        </h1>
        <p className="text-sm text-muted-foreground">
          Salve e reutilize suas configurações de relatórios favoritas
        </p>
      </div>

      <ReportsClient initialReports={reports} />
    </section>
  );
}

