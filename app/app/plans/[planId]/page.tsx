import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { PlanDetailClient } from "@/components/plans/plan-detail-client";
import { summarizePlanItems, toPlanItemTotals } from "@/lib/domain/spend-plan";
import type { CurrencyCode } from "@/lib/domain/currency";

export default async function PlanDetailPage({
  params
}: {
  params: Promise<{ planId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { planId } = await params;
  const workspaceId = await requireActiveWorkspaceId();
  const membership = await prisma.userWorkspace.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } }
  });
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";

  const [workspace, plan, categories] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { baseCurrency: true }
    }),
    prisma.spendPlan.findFirst({
      where: { id: planId, workspaceId },
      include: {
        groups: {
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
              include: {
                category: { select: { name: true } },
                expense: { select: { amount: true } },
                entries: {
                  orderBy: { date: "asc" },
                  select: { id: true, amount: true, note: true, date: true }
                }
              }
            }
          }
        }
      }
    }),
    prisma.category.findMany({
      where: { workspaceId, type: { in: ["EXPENSE", "BOTH"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);

  if (!plan) notFound();

  const flatItems = plan.groups.flatMap((group) =>
    group.items.map((item) => toPlanItemTotals(item))
  );

  return (
    <PlanDetailClient
      isAdmin={Boolean(isAdmin)}
      currency={(workspace?.baseCurrency ?? "BRL") as CurrencyCode}
      categories={categories}
      plan={{
        id: plan.id,
        name: plan.name,
        notes: plan.notes,
        cap: plan.cap ? plan.cap.toNumber() : null,
        status: plan.status,
        totals: summarizePlanItems(flatItems),
        groups: plan.groups.map((group) => ({
          id: group.id,
          name: group.name,
          items: group.items.map((item) => {
            const totals = toPlanItemTotals(item);
            return {
              id: item.id,
              description: item.description,
              plannedAmount: totals.plannedAmount,
              paidAmount: totals.paidAmount,
              skipped: item.skipped,
              repeatable: Boolean(item.repeatable),
              categoryId: item.categoryId,
              categoryName: item.category?.name ?? null,
              entries: item.entries.map((entry) => ({
                id: entry.id,
                amount: entry.amount.toNumber(),
                note: entry.note,
                date: entry.date.toISOString().slice(0, 10)
              }))
            };
          })
        }))
      }}
    />
  );
}
