"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { checkTransactionLimit } from "@/lib/plans/authorization";
import { listBudgetsWithUsage } from "@/lib/domain/budget";
import { autoGenerateNotifications } from "@/lib/domain/budget-alerts";
import { utcDateFromKey, todayUtcKey } from "@/lib/utils/date-utc";

function refresh() {
  revalidatePath("/app/plans");
}

function refreshAfterPayment() {
  revalidatePath("/app/plans");
  revalidatePath("/app/cashflow");
  revalidatePath("/app/overview");
  revalidatePath("/app/budgets");
  revalidatePath("/app/reports");
}

async function requireMember() {
  const workspaceId = await requireActiveWorkspaceId();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return { workspaceId, userId: user.id };
}

async function requireAdmin() {
  const { workspaceId, userId } = await requireMember();
  const membership = await prisma.userWorkspace.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } }
  });
  if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
    throw new Error("Apenas administradores podem alterar projetos.");
  }
  return { workspaceId, userId };
}

async function resolveCategoryId(workspaceId: string, raw?: string | null) {
  if (!raw) return null;
  const cat = await prisma.category.findFirst({
    where: { id: raw, workspaceId, type: { in: ["EXPENSE", "BOTH"] } }
  });
  if (!cat) throw new Error("Categoria inválida (precisa ser Saída ou Ambos).");
  return cat.id;
}

const createPlanSchema = z.object({
  name: z.string().min(2).max(120),
  notes: z.string().max(500).optional(),
  cap: z.union([z.coerce.number().positive(), z.nan(), z.literal("")]).optional()
});

export async function createSpendPlan(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const parsed = createPlanSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
    cap: formData.get("cap") || ""
  });
  if (!parsed.success) throw new Error("Dados inválidos para o projeto.");

  const cap =
    typeof parsed.data.cap === "number" && Number.isFinite(parsed.data.cap)
      ? new Decimal(parsed.data.cap)
      : null;

  const plan = await prisma.spendPlan.create({
    data: {
      workspaceId,
      name: parsed.data.name.trim(),
      notes: parsed.data.notes?.trim() || null,
      cap
    }
  });
  refresh();
  redirect(`/app/plans/${plan.id}`);
}

export async function updateSpendPlan(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const parsed = createPlanSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
    cap: formData.get("cap") || ""
  });
  if (!id || !parsed.success) throw new Error("Dados inválidos.");

  const existing = await prisma.spendPlan.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new Error("Projeto não encontrado.");

  const cap =
    typeof parsed.data.cap === "number" && Number.isFinite(parsed.data.cap)
      ? new Decimal(parsed.data.cap)
      : null;

  await prisma.spendPlan.update({
    where: { id },
    data: {
      name: parsed.data.name.trim(),
      notes: parsed.data.notes?.trim() || null,
      cap
    }
  });
  refresh();
}

export async function toggleSpendPlanStatus(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const existing = await prisma.spendPlan.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new Error("Projeto não encontrado.");
  await prisma.spendPlan.update({
    where: { id },
    data: { status: existing.status === "OPEN" ? "CLOSED" : "OPEN" }
  });
  refresh();
}

export async function deleteSpendPlan(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const existing = await prisma.spendPlan.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new Error("Projeto não encontrado.");
  await prisma.spendPlan.delete({ where: { id } });
  refresh();
  redirect("/app/plans");
}

export async function createSpendPlanGroup(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const planId = String(formData.get("planId") || "");
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) throw new Error("Nome do bloco muito curto.");

  const plan = await prisma.spendPlan.findFirst({ where: { id: planId, workspaceId } });
  if (!plan) throw new Error("Projeto não encontrado.");

  const last = await prisma.spendPlanGroup.findFirst({
    where: { planId },
    orderBy: { sortOrder: "desc" }
  });
  await prisma.spendPlanGroup.create({
    data: { planId, name, sortOrder: (last?.sortOrder ?? 0) + 1 }
  });
  refresh();
}

export async function deleteSpendPlanGroup(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const group = await prisma.spendPlanGroup.findFirst({
    where: { id, plan: { workspaceId } }
  });
  if (!group) throw new Error("Bloco não encontrado.");
  await prisma.spendPlanGroup.delete({ where: { id } });
  refresh();
}

export async function updateSpendPlanGroup(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) throw new Error("Nome do bloco muito curto.");
  const group = await prisma.spendPlanGroup.findFirst({
    where: { id, plan: { workspaceId } }
  });
  if (!group) throw new Error("Bloco não encontrado.");
  await prisma.spendPlanGroup.update({ where: { id }, data: { name } });
  refresh();
}

export async function createSpendPlanItem(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const groupId = String(formData.get("groupId") || "");
  const description = String(formData.get("description") || "").trim();
  const planned = Number(formData.get("plannedAmount"));
  const categoryId = await resolveCategoryId(
    workspaceId,
    String(formData.get("categoryId") || "") || null
  );

  if (description.length < 2) throw new Error("Descrição muito curta.");
  if (!Number.isFinite(planned) || planned < 0) throw new Error("Valor planejado inválido.");

  const group = await prisma.spendPlanGroup.findFirst({
    where: { id: groupId, plan: { workspaceId } }
  });
  if (!group) throw new Error("Bloco não encontrado.");

  const last = await prisma.spendPlanItem.findFirst({
    where: { groupId },
    orderBy: { sortOrder: "desc" }
  });
  await prisma.spendPlanItem.create({
    data: {
      groupId,
      description,
      plannedAmount: new Decimal(planned),
      categoryId,
      repeatable: formData.get("repeatable") === "true",
      sortOrder: (last?.sortOrder ?? 0) + 1
    }
  });
  refresh();
}

export async function updateSpendPlanItem(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const description = String(formData.get("description") || "").trim();
  const planned = Number(formData.get("plannedAmount"));
  const categoryId = await resolveCategoryId(
    workspaceId,
    String(formData.get("categoryId") || "") || null
  );

  const item = await prisma.spendPlanItem.findFirst({
    where: { id, group: { plan: { workspaceId } } },
    include: { entries: { select: { id: true } } }
  });
  if (!item) throw new Error("Item não encontrado.");
  if (description.length < 2) throw new Error("Descrição muito curta.");
  if (!Number.isFinite(planned) || planned < 0) throw new Error("Valor planejado inválido.");

  const repeatable = formData.get("repeatable") === "true";
  if (!repeatable && item.entries.length > 1) {
    throw new Error("Este item já tem vários gastos. Não dá para voltar para pagamento único.");
  }

  await prisma.spendPlanItem.update({
    where: { id },
    data: { description, plannedAmount: new Decimal(planned), categoryId, repeatable }
  });
  refresh();
}

export async function skipSpendPlanItem(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const item = await prisma.spendPlanItem.findFirst({
    where: { id, group: { plan: { workspaceId } } },
    include: { entries: { select: { id: true } } }
  });
  if (!item) throw new Error("Item não encontrado.");
  if (item.entries.length > 0) throw new Error("Item já tem gasto no caixa. Não dá para pular.");
  await prisma.spendPlanItem.update({
    where: { id },
    data: { skipped: !item.skipped }
  });
  refresh();
}

export async function deleteSpendPlanItem(formData: FormData) {
  const { workspaceId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const item = await prisma.spendPlanItem.findFirst({
    where: { id, group: { plan: { workspaceId } } },
    include: { entries: { select: { id: true } } }
  });
  if (!item) throw new Error("Item não encontrado.");
  if (item.entries.length > 0 || item.expenseId) {
    throw new Error("Item já gerou despesa. Apague a despesa no fluxo de caixa se quiser desfazer.");
  }
  await prisma.spendPlanItem.delete({ where: { id } });
  refresh();
}

export async function paySpendPlanItem(formData: FormData) {
  const { workspaceId, userId } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const amount = Number(formData.get("amount"));
  const dateRaw = String(formData.get("date") || todayUtcKey());
  const note = String(formData.get("note") || "").trim();

  const item = await prisma.spendPlanItem.findFirst({
    where: { id, group: { plan: { workspaceId } } },
    include: {
      group: { include: { plan: true } },
      entries: { select: { id: true } }
    }
  });
  if (!item) throw new Error("Item não encontrado.");
  if (item.skipped) throw new Error("Item pulado. Desfaça o pulo para pagar.");
  if (!item.repeatable && (item.expenseId || item.entries.length > 0)) {
    throw new Error("Este item já foi lançado no caixa.");
  }
  if (item.group.plan.status !== "OPEN") {
    throw new Error("Projeto encerrado. Reabra para lançar gastos.");
  }
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor pago inválido.");

  const limit = await checkTransactionLimit();
  if (!limit.allowed) {
    throw new Error(limit.reason || "Limite de lançamentos mensais atingido.");
  }

  const date = utcDateFromKey(dateRaw);
  const description = note ? `${item.description} — ${note}` : item.description;

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        workspaceId,
        date,
        description,
        amount: new Decimal(amount),
        type: "VARIABLE",
        categoryId: item.categoryId
      }
    });

    await tx.spendPlanEntry.create({
      data: {
        itemId: id,
        expenseId: expense.id,
        amount: new Decimal(amount),
        note: note || null,
        date
      }
    });

    const paid = await tx.spendPlanEntry.aggregate({
      where: { itemId: id },
      _sum: { amount: true }
    });

    await tx.spendPlanItem.update({
      where: { id },
      data: {
        actualAmount: paid._sum.amount ?? new Decimal(amount),
        paidAt: date,
        expenseId: item.expenseId ?? expense.id
      }
    });
  });

  if (item.categoryId) {
    try {
      const budgets = await listBudgetsWithUsage({
        workspaceId,
        categoryId: item.categoryId,
        activeOnly: true
      });
      for (const budget of budgets) {
        await autoGenerateNotifications(workspaceId, userId, budget);
      }
    } catch (error) {
      console.error("Erro ao gerar notificações de orçamento (projeto):", error);
    }
  }

  refreshAfterPayment();
}
