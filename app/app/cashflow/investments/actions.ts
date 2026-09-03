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

const createInvestmentSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(2).max(140),
  amount: z.coerce.number().positive()
});

const updateInvestmentSchema = createInvestmentSchema.extend({
  id: z.string().cuid()
});

const deleteInvestmentSchema = z.object({
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

  if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
    throw new Error("Apenas administradores podem gerenciar investimentos.");
  }

  return { workspaceId };
}

export async function createInvestment(formData: FormData) {
  return measure(
    "action.createInvestment",
    async () => {
      try {
        const transactionCheck = await checkTransactionLimit();
        if (!transactionCheck.allowed) {
          throw new Error(transactionCheck.reason || "Limite de lançamentos mensais atingido. Faça upgrade para continuar.");
        }

        const { workspaceId } = await requireAdminWorkspace();

        const parsed = createInvestmentSchema.safeParse({
          date: formData.get("date"),
          description: formData.get("description"),
          amount: formData.get("amount")
        });

        if (!parsed.success) {
          throw new Error("Dados inválidos. Verifique data, descrição e valor.");
        }

        await prisma.investment.create({
          data: {
            workspaceId,
            date: parsed.data.date,
            description: parsed.data.description,
            amount: new Decimal(parsed.data.amount)
          }
        });

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao criar investimento:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao registrar investimento.");
      }
    },
    {}
  );
}

export async function updateInvestment(formData: FormData) {
  return measure(
    "action.updateInvestment",
    async () => {
      try {
        const { workspaceId } = await requireAdminWorkspace();

        const parsed = updateInvestmentSchema.safeParse({
          id: formData.get("id"),
          date: formData.get("date"),
          description: formData.get("description"),
          amount: formData.get("amount")
        });

        if (!parsed.success) {
          throw new Error("Dados inválidos para atualização.");
        }

        const existing = await prisma.investment.findFirst({
          where: { id: parsed.data.id, workspaceId }
        });

        if (!existing) {
          throw new Error("Investimento não encontrado no workspace atual.");
        }

        await prisma.investment.update({
          where: { id: existing.id },
          data: {
            date: parsed.data.date,
            description: parsed.data.description,
            amount: new Decimal(parsed.data.amount)
          }
        });

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao atualizar investimento:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao atualizar investimento.");
      }
    },
    {}
  );
}

export async function deleteInvestment(formData: FormData) {
  return measure(
    "action.deleteInvestment",
    async () => {
      try {
        const { workspaceId } = await requireAdminWorkspace();

        const parsed = deleteInvestmentSchema.safeParse({
          id: formData.get("id")
        });

        if (!parsed.success) {
          throw new Error("Dados inválidos para exclusão.");
        }

        const existing = await prisma.investment.findFirst({
          where: { id: parsed.data.id, workspaceId }
        });

        if (!existing) {
          throw new Error("Investimento não encontrado no workspace atual.");
        }

        await prisma.investment.delete({
          where: { id: existing.id }
        });

        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao excluir investimento:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao excluir investimento.");
      }
    },
    {}
  );
}
