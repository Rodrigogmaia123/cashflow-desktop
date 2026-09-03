"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { materializeRecurringExpenses } from "@/lib/domain/recurring-expense";
import { utcDateFromKey, utcKey } from "@/lib/utils/date-utc";

const expenseTypeValues = ["FIXED", "VARIABLE"] as const;

const upsertSchema = z.object({
  description: z.string().min(2).max(140),
  amount: z.coerce.number().positive(),
  type: z.enum(expenseTypeValues),
  dayOfMonth: z.coerce.number().int().min(1).max(31),
  categoryId: z.union([z.string().cuid(), z.literal(""), z.undefined()]).optional(),
  endDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(""), z.undefined()]).optional()
});

async function requireAdminWorkspace() {
  const workspaceId = await requireActiveWorkspaceId();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId
      }
    }
  });

  if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
    throw new Error("Apenas administradores podem gerenciar despesas recorrentes.");
  }

  return { workspaceId, userId: user.id };
}

async function resolveCategoryId(workspaceId: string, raw?: string) {
  if (!raw) return null;
  const cat = await prisma.category.findFirst({
    where: {
      id: raw,
      workspaceId,
      type: { in: ["EXPENSE", "BOTH"] }
    }
  });
  if (!cat) {
    throw new Error("Categoria inválida para despesa (precisa ser Saída ou Ambos).");
  }
  return cat.id;
}

export async function listRecurringExpenses() {
  const { workspaceId } = await requireAdminWorkspace();
  const rows = await prisma.recurringExpense.findMany({
    where: { workspaceId },
    include: { category: { select: { name: true } } },
    orderBy: [{ isActive: "desc" }, { dayOfMonth: "asc" }, { createdAt: "asc" }]
  });

  return rows.map((row) => ({
    id: row.id,
    description: row.description,
    amount: row.amount.toFixed(2),
    type: row.type,
    dayOfMonth: row.dayOfMonth,
    isActive: row.isActive,
    startDate: utcKey(row.startDate),
    endDate: row.endDate ? utcKey(row.endDate) : null,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null
  }));
}

export async function createRecurringExpense(formData: FormData) {
  const { workspaceId, userId } = await requireAdminWorkspace();
  const parsed = upsertSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type") || "FIXED",
    dayOfMonth: formData.get("dayOfMonth"),
    categoryId: formData.get("categoryId") || "",
    endDate: formData.get("endDate") || ""
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para despesa recorrente.");
  }

  const categoryId = await resolveCategoryId(
    workspaceId,
    parsed.data.categoryId && parsed.data.categoryId !== "" ? parsed.data.categoryId : undefined
  );

  const start = utcDateFromKey(`${utcKey(new Date()).slice(0, 7)}-01`);
  const endDate =
    parsed.data.endDate && parsed.data.endDate !== ""
      ? utcDateFromKey(parsed.data.endDate)
      : null;

  await prisma.recurringExpense.create({
    data: {
      workspaceId,
      description: parsed.data.description,
      amount: new Decimal(parsed.data.amount),
      type: parsed.data.type,
      dayOfMonth: parsed.data.dayOfMonth,
      categoryId,
      startDate: start,
      endDate,
      isActive: true
    }
  });

  await materializeRecurringExpenses(workspaceId, userId, { force: true });
  revalidatePath("/app/cashflow");
  revalidatePath("/app/overview");
}

export async function updateRecurringExpense(formData: FormData) {
  const { workspaceId, userId } = await requireAdminWorkspace();
  const id = String(formData.get("id") || "");
  const parsed = upsertSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type") || "FIXED",
    dayOfMonth: formData.get("dayOfMonth"),
    categoryId: formData.get("categoryId") || "",
    endDate: formData.get("endDate") || ""
  });

  if (!id || !parsed.success) {
    throw new Error("Dados inválidos para atualizar recorrente.");
  }

  const existing = await prisma.recurringExpense.findFirst({
    where: { id, workspaceId }
  });
  if (!existing) {
    throw new Error("Recorrente não encontrada.");
  }

  const categoryId = await resolveCategoryId(
    workspaceId,
    parsed.data.categoryId && parsed.data.categoryId !== "" ? parsed.data.categoryId : undefined
  );
  const endDate =
    parsed.data.endDate && parsed.data.endDate !== ""
      ? utcDateFromKey(parsed.data.endDate)
      : null;

  await prisma.recurringExpense.update({
    where: { id: existing.id },
    data: {
      description: parsed.data.description,
      amount: new Decimal(parsed.data.amount),
      type: parsed.data.type,
      dayOfMonth: parsed.data.dayOfMonth,
      categoryId,
      endDate
    }
  });

  await materializeRecurringExpenses(workspaceId, userId, { force: true });
  revalidatePath("/app/cashflow");
}

export async function toggleRecurringExpense(formData: FormData) {
  const { workspaceId, userId } = await requireAdminWorkspace();
  const id = String(formData.get("id") || "");
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, workspaceId }
  });
  if (!existing) {
    throw new Error("Recorrente não encontrada.");
  }

  await prisma.recurringExpense.update({
    where: { id: existing.id },
    data: { isActive: !existing.isActive }
  });

  if (!existing.isActive) {
    await materializeRecurringExpenses(workspaceId, userId, { force: true });
  }

  revalidatePath("/app/cashflow");
}

export async function deleteRecurringExpense(formData: FormData) {
  const { workspaceId } = await requireAdminWorkspace();
  const id = String(formData.get("id") || "");
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, workspaceId }
  });
  if (!existing) {
    throw new Error("Recorrente não encontrada.");
  }

  await prisma.recurringExpense.delete({
    where: { id: existing.id }
  });

  revalidatePath("/app/cashflow");
}
