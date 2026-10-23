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
      <div className="space-y-1">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-foreground">
          Workspaces
        </h1>
        <p className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
          Multi-tenant: cada workspace representa uma empresa ou operação
          distinta. O workspace ativo é resolvido no servidor e usado em todas
          as queries de negócio.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">Meus workspaces</h2>
          <div className="space-y-3">
            {sortedMemberships.map((m) => {
              const isActive = user.activeWorkspaceId === m.workspaceId;
              const canEdit = m.role === "OWNER" || m.role === "ADMIN";
              
              return (
                <div
                  key={m.workspaceId}
                  className={`relative overflow-hidden rounded-2xl border transition-colors ${
                    isActive
                      ? "border-[rgba(172,147,255,0.45)] bg-[linear-gradient(180deg,rgba(172,147,255,0.12),rgba(255,255,255,0.02))]"
                      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]"
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

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]">
          <CardContent className="p-6">
            <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">
              Criar novo workspace
            </h2>
            <CreateWorkspaceForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


