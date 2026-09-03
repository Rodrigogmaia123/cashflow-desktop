import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listUserWorkspaces } from "@/lib/workspace";
import { selectWorkspace } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { WorkspaceItemClient } from "./workspace-item-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  // getCurrentUser já é chamado no layout, mas precisamos aqui para obter activeWorkspaceId
  // O cache() garante que é a mesma query
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await listUserWorkspaces(user.id);
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const lockedBaseCurrency = new Set(
    (
      await prisma.offer.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          dailyPerformances: { some: {} }
        },
        select: { workspaceId: true },
        distinct: ["workspaceId"]
      })
    ).map((o) => o.workspaceId)
  );

  const sortedMemberships = [...memberships].sort((a, b) => {
    if (user.activeWorkspaceId === a.workspaceId) return -1;
    if (user.activeWorkspaceId === b.workspaceId) return 1;
    return 0;
  });

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Workspaces
        </h1>
        <p className="text-sm text-muted-foreground">
          Multi-tenant: cada workspace representa uma empresa ou operação
          distinta. O workspace ativo é resolvido no servidor e usado em todas
          as queries de negócio.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Meus workspaces</h2>
          <div className="space-y-3">
            {sortedMemberships.map((m) => {
              const isActive = user.activeWorkspaceId === m.workspaceId;
              const canEdit = m.role === "OWNER" || m.role === "ADMIN";
              
              return (
                <div
                  key={m.workspaceId}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    isActive
                      ? "border-[#A855F7]/30 bg-gradient-to-br from-[#A855F7]/10 via-[#A855F7]/5 to-transparent hover:shadow-[#A855F7]/20"
                      : "border-white/5 bg-card hover:bg-card-hover"
                  }`}
                >
                  <div className="p-4">
                    <WorkspaceItemClient
                      workspaceId={m.workspaceId}
                      workspaceName={m.workspace.name}
                      baseCurrency={m.workspace.baseCurrency}
                      role={m.role}
                      isActive={isActive}
                      canEdit={canEdit}
                      canChangeBaseCurrency={!lockedBaseCurrency.has(m.workspaceId)}
                    />
                  </div>
                </div>
              );
            })}

            {memberships.length === 0 && (
              <Card className="border-white/5 bg-card-secondary/30">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum workspace ainda. Crie um ao lado para começar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="border-white/5 bg-card">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Criar novo workspace
            </h2>
            <CreateWorkspaceForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


