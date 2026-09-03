"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { measure } from "@/lib/observability/measure";
import { checkTransactionLimit } from "@/lib/plans/authorization";

const createManualIncomeSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(2).max(140),
  amount: z.coerce.number().positive(),
  categoryId: z.string().cuid().optional().or(z.literal(""))
});

const updateManualIncomeSchema = createManualIncomeSchema.extend({
  id: z.string().cuid()
});

const deleteManualIncomeSchema = z.object({
  id: z.string().cuid()
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

  // OWNER tem todas as permissões (incluindo as de ADMIN)
  if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
    throw new Error("Apenas administradores podem gerenciar entradas manuais.");
  }

  return { workspaceId };
}

export async function createManualIncome(formData: FormData) {
  return measure(
    "action.createManualIncome",
    async () => {
      try {
    // Verifica limite de transações mensais
    const transactionCheck = await checkTransactionLimit();
    if (!transactionCheck.allowed) {
      throw new Error(transactionCheck.reason || "Limite de lançamentos mensais atingido. Faça upgrade para continuar.");
    }

    const { workspaceId } = await requireAdminWorkspace();

  const parsed = createManualIncomeSchema.safeParse({
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para criação de entrada.");
  }

  let categoryId: string | null = null;
  if (parsed.data.categoryId) {
    const cat = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        workspaceId,
        type: { in: ["INCOME", "BOTH"] }
      }
    });
    if (!cat) {
      throw new Error("Categoria inválida para entrada (precisa ser Entrada ou Ambos).");
    }
    categoryId = cat.id;
  }

  await prisma.manualIncome.create({
    data: {
      workspaceId,
      date: parsed.data.date,
      description: parsed.data.description,
      amount: new Decimal(parsed.data.amount),
      categoryId
    }
  });

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao criar entrada manual:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao criar entrada manual.");
      }
    },
    {}
  );
}

export async function updateManualIncome(formData: FormData) {
  return measure(
    "action.updateManualIncome",
    async () => {
      try {
  const { workspaceId } = await requireAdminWorkspace();

  const parsed = updateManualIncomeSchema.safeParse({
    id: formData.get("id"),
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para atualização de entrada.");
  }

  const existing = await prisma.manualIncome.findFirst({
    where: { id: parsed.data.id, workspaceId }
  });

  if (!existing) {
    throw new Error("Entrada não encontrada no workspace atual.");
  }

  let categoryId: string | null = null;
  if (parsed.data.categoryId) {
    const cat = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        workspaceId,
        type: { in: ["INCOME", "BOTH"] }
      }
    });
    if (!cat) {
      throw new Error("Categoria inválida para entrada (precisa ser Entrada ou Ambos).");
    }
    categoryId = cat.id;
  }

  await prisma.manualIncome.update({
    where: { id: existing.id },
    data: {
      date: parsed.data.date,
      description: parsed.data.description,
      amount: new Decimal(parsed.data.amount),
      categoryId
    }
  });

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao atualizar entrada manual:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao atualizar entrada manual.");
      }
    },
    {}
  );
}

export async function deleteManualIncome(formData: FormData) {
  return measure(
    "action.deleteManualIncome",
    async () => {
      try {
  const { workspaceId } = await requireAdminWorkspace();

  const parsed = deleteManualIncomeSchema.safeParse({
    id: formData.get("id")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para exclusão de entrada.");
  }

  const existing = await prisma.manualIncome.findFirst({
    where: { id: parsed.data.id, workspaceId }
  });

  if (!existing) {
    throw new Error("Entrada não encontrada no workspace atual.");
  }

  await prisma.manualIncome.delete({
    where: { id: existing.id }
  });

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao excluir entrada manual:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao excluir entrada manual.");
      }
    },
    {}
  );
}


