"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { measure } from "@/lib/observability/measure";
import { checkTransactionLimit } from "@/lib/plans/authorization";
import { listBudgetsWithUsage } from "@/lib/domain/budget";
import { autoGenerateNotifications } from "@/lib/domain/budget-alerts";
import { parsePaymentFields } from "@/lib/domain/payment";

const expenseTypeValues = ["FIXED", "VARIABLE"] as const;

const createExpenseSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(2).max(140),
  amount: z.coerce.number().positive(),
  type: z.enum(expenseTypeValues),
  categoryId: z.union([
    z.string().cuid(),
    z.literal(""),
    z.undefined()
  ]).optional()
});

const updateExpenseSchema = z.object({
  id: z.string().cuid(),
  date: z.coerce.date(),
  description: z.string().min(2).max(140),
  amount: z.coerce.number().positive(),
  type: z.enum(expenseTypeValues),
  categoryId: z.union([
    z.string().cuid(),
    z.literal(""),
    z.undefined()
  ]).optional()
});

const deleteExpenseSchema = z.object({
  id: z.string().cuid()
});

function persistExpensePayment(
  expenseId: string,
  payment: { paymentMethod: string | null; paymentBrand: string | null }
) {
  return prisma.$executeRaw`
    UPDATE "Expense"
    SET "paymentMethod" = ${payment.paymentMethod},
        "paymentBrand" = ${payment.paymentBrand}
    WHERE "id" = ${expenseId}
  `;
}

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

  // OWNER tem todas as permissões (incluindo as de ADMIN)
  if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
    throw new Error("Apenas administradores podem gerenciar despesas.");
  }

  return { workspaceId };
}

export async function createExpense(formData: FormData) {
  return measure(
    "action.createExpense",
    async () => {
      try {
    // Verifica limite de transações mensais
    const transactionCheck = await checkTransactionLimit();
    if (!transactionCheck.allowed) {
      throw new Error(transactionCheck.reason || "Limite de lançamentos mensais atingido. Faça upgrade para continuar.");
    }

    const { workspaceId } = await requireAdminWorkspace();
    const user = await getCurrentUser();

    const parsed = createExpenseSchema.safeParse({
      date: formData.get("date"),
      description: formData.get("description"),
      amount: formData.get("amount"),
      type: formData.get("type"),
      categoryId: formData.get("categoryId")
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para criação de despesa.");
    }

    const payment = parsePaymentFields({
      paymentMethod: formData.get("paymentMethod"),
      paymentBrand: formData.get("paymentBrand")
    });

    let categoryId: string | null = null;
    if (parsed.data.categoryId && parsed.data.categoryId !== "") {
      const cat = await prisma.category.findFirst({
        where: {
          id: parsed.data.categoryId,
          workspaceId,
          type: { in: ["EXPENSE", "BOTH"] }
        }
      });
      if (!cat) {
        throw new Error("Categoria inválida para despesa (precisa ser Saída ou Ambos).");
      }
      categoryId = cat.id;
    }

    const created = await prisma.expense.create({
      data: {
        workspaceId,
        date: parsed.data.date,
        description: parsed.data.description,
        amount: new Decimal(parsed.data.amount),
        type: parsed.data.type,
        categoryId
      }
    });
    await persistExpensePayment(created.id, payment);

    // 🔔 VERIFICAR ORÇAMENTOS E GERAR NOTIFICAÇÕES AUTOMÁTICAS
    if (categoryId && user) {
      try {
        // Buscar orçamentos ativos da categoria
        const budgets = await listBudgetsWithUsage({
          workspaceId,
          categoryId,
          activeOnly: true,
        });

        // Gerar notificações automáticas para orçamentos que atingiram limites
        for (const budget of budgets) {
          await autoGenerateNotifications(workspaceId, user.id, budget);
        }
      } catch (notifError) {
        console.error("Erro ao gerar notificações de orçamento:", notifError);
        // Não falhar a criação da despesa se notificações falharem
      }
    }

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao criar despesa:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao criar despesa.");
      }
    },
    {}
  );
}

export async function updateExpense(formData: FormData) {
  return measure(
    "action.updateExpense",
    async () => {
      try {
    const { workspaceId } = await requireAdminWorkspace();

  const parsed = updateExpenseSchema.safeParse({
    id: formData.get("id"),
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para atualização de despesa.");
  }

  const payment = parsePaymentFields({
    paymentMethod: formData.get("paymentMethod"),
    paymentBrand: formData.get("paymentBrand")
  });

  let categoryId: string | null = null;
  if (parsed.data.categoryId && parsed.data.categoryId !== "") {
    const cat = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        workspaceId,
        type: { in: ["EXPENSE", "BOTH"] }
      }
    });
    if (!cat) {
      throw new Error("Categoria inválida para despesa (precisa ser Saída ou Ambos).");
    }
    categoryId = cat.id;
  }

  const existing = await prisma.expense.findFirst({
    where: { id: parsed.data.id, workspaceId }
  });

  if (!existing) {
    throw new Error("Despesa não encontrada no workspace atual.");
  }

  await prisma.expense.update({
    where: { id: existing.id },
    data: {
      date: parsed.data.date,
      description: parsed.data.description,
      amount: new Decimal(parsed.data.amount),
      type: parsed.data.type,
      categoryId
    }
  });
  await persistExpensePayment(existing.id, payment);

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao atualizar despesa:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao atualizar despesa.");
      }
    },
    {}
  );
}

export async function deleteExpense(formData: FormData) {
  return measure(
    "action.deleteExpense",
    async () => {
      try {
  const { workspaceId } = await requireAdminWorkspace();

  const parsed = deleteExpenseSchema.safeParse({
    id: formData.get("id")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para exclusão de despesa.");
  }

  const existing = await prisma.expense.findFirst({
    where: { id: parsed.data.id, workspaceId }
  });

  if (!existing) {
    throw new Error("Despesa não encontrada no workspace atual.");
  }

  await prisma.expense.delete({
    where: { id: existing.id }
  });

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao excluir despesa:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao excluir despesa.");
      }
    },
    {}
  );
}

export type ExpenseType = (typeof expenseTypeValues)[number];
export type ExpenseCategoryId = string;


