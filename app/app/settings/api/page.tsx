import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkFeatureAccess } from "@/lib/plans/authorization";
import { getFeatureStatus, isFeatureComingSoon } from "@/lib/plans/feature-status";
import { ApiComingSoon } from "./api-coming-soon";
import { FeatureLock } from "@/components/plans/feature-lock";
import { trackApiFeatureViewed } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApiSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Verifica se a feature está em desenvolvimento
  const isComingSoon = isFeatureComingSoon("api_access");
  
  // Se o usuário é BUSINESS e a feature está em desenvolvimento, mostra "Em desenvolvimento"
  if (user.plan === "BUSINESS" && isComingSoon) {
    // Track no servidor
    await trackApiFeatureViewed(user.activeWorkspaceId || undefined);
    
    const statusInfo = getFeatureStatus("api_access");
    return (
      <ApiComingSoon 
        message={statusInfo.message}
        workspaceId={user.activeWorkspaceId || undefined}
      />
    );
  }

  // Se não é BUSINESS, mostra FeatureLock
  if (user.plan !== "BUSINESS") {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            API Access
          </h1>
          <p className="text-sm text-muted-foreground">
            Integre seus dados com outros sistemas usando nossa API
          </p>
        </div>

        <FeatureLock
          feature="api_access"
          requiredPlan="BUSINESS"
          title="Acesso à API"
          description="Integre o Cashflow Pro com seus sistemas e automações usando nossa API REST completa."
          workspaceId={user.activeWorkspaceId || undefined}
        />
      </section>
    );
  }

  // Fallback (não deveria chegar aqui)
  redirect("/app/settings");
}

