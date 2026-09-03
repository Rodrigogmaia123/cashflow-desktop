import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkFeatureAccess } from "@/lib/plans/authorization";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { getTeamMembers, getPendingInvites } from "./actions";
import { TeamClient } from "./team-client";
import { FeatureLock } from "@/components/plans/feature-lock";

export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const featureCheck = await checkFeatureAccess("multi_user");

  if (!featureCheck.allowed) {
    return (
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            Equipe
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie membros e permissões do seu workspace
          </p>
        </div>

        <FeatureLock
          feature="multi_user"
          requiredPlan="BUSINESS"
          title="Multi-usuário"
          description="Colabore com sua equipe compartilhando workspaces com outros usuários e controlando permissões granulares."
          workspaceId={user.activeWorkspaceId || undefined}
        />
      </section>
    );
  }

  const workspaceId = await requireActiveWorkspaceId();
  const [members, invites] = await Promise.all([
    getTeamMembers(workspaceId),
    getPendingInvites(workspaceId),
  ]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Equipe
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie membros e permissões do seu workspace
        </p>
      </div>

      <TeamClient initialMembers={members} initialInvites={invites} />
    </section>
  );
}

