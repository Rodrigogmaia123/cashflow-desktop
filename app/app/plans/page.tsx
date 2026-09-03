import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { PlanListClient } from "@/components/plans/plan-list-client";
import { summarizePlanItems, toPlanItemTotals } from "@/lib/domain/spend-plan";
import type { CurrencyCode } from "@/lib/domain/currency";

export const metadata = {
  title: "Projetos | Cashflow Pro",
  description: "Planeje gastos sem misturar com o caixa"
};

export default async function PlansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = await requireActiveWorkspaceId();
  const membership = await prisma.userWorkspace.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } }
  });
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";

  const [workspace, plans, otherPlans] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { baseCurrency: true }
    }),
    prisma.spendPlan.findMany({
      where: { workspaceId },
      include: {
        groups: {
          include: {
            items: { include: { expense: { select: { amount: true } }, entries: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.spendPlan.findMany({
      where: { workspaceId: { not: workspaceId } },
      select: {
        name: true,
        workspace: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const rows = plans.map((plan) => {
    const items = plan.groups.flatMap((group) =>
      group.items.map((item) => toPlanItemTotals(item))
    );
    const totals = summarizePlanItems(items);
    return {
      id: plan.id,
      name: plan.name,
      status: plan.status,
      cap: plan.cap ? plan.cap.toNumber() : null,
      planned: totals.planned,
      paid: totals.paid,
      remaining: totals.remaining,
      difference: totals.difference
    };
  });

  const otherWorkspacePlans = Object.values(
    otherPlans.reduce<Record<string, { workspaceName: string; names: string[] }>>(
      (acc, plan) => {
        const workspaceName = plan.workspace.name;
        if (!acc[workspaceName]) {
          acc[workspaceName] = { workspaceName, names: [] };
        }
        acc[workspaceName].names.push(plan.name);
        return acc;
      },
      {}
    )
  );

  return (
    <PlanListClient
      plans={rows}
      isAdmin={Boolean(isAdmin)}
      currency={(workspace?.baseCurrency ?? "BRL") as CurrencyCode}
      otherWorkspacePlans={otherWorkspacePlans}
    />
  );
}
