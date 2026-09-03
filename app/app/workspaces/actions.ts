"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkWorkspaceLimit } from "@/lib/plans/authorization";
import { requireWorkspacePermission } from "@/lib/rbac/workspace-permissions";
import { CURRENCIES } from "@/lib/domain/currency";

const createWorkspaceSchema = z.object({
  name: z.string().min(3).max(120),
  baseCurrency: z.enum(CURRENCIES).default("BRL")
});

const selectWorkspaceSchema = z.object({
  workspaceId: z.string().cuid()
});

const updateWorkspaceSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(3).max(120),
  baseCurrency: z.enum(CURRENCIES).optional()
});

const deleteWorkspaceSchema = z.object({
  workspaceId: z.string().cuid()
});

export async function createWorkspace(formData: FormData) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    // Verifica limite de workspaces
    const workspaceCheck = await checkWorkspaceLimit();
    if (!workspaceCheck.allowed) {
      throw new Error(workspaceCheck.reason || "Limite de workspaces atingido. Faça upgrade para criar mais workspaces.");
    }

    const parsed = createWorkspaceSchema.safeParse({
      name: formData.get("name"),
      baseCurrency: formData.get("baseCurrency") || "BRL"
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para criação de workspace.");
    }

    // Validar que o usuário existe antes de criar o workspace
    const userExists = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true }
    });

    if (!userExists) {
      throw new Error("Usuário não encontrado no banco de dados.");
    }

    // Criar workspace e relacionamentos em transação para garantir consistência
    const workspace = await prisma.$transaction(async (tx) => {
      // Criar workspace
      const newWorkspace = await tx.workspace.create({
        data: {
          name: parsed.data.name,
          baseCurrency: parsed.data.baseCurrency
        }
      });

      // Criar UserWorkspace explicitamente
      await tx.userWorkspace.create({
        data: {
          userId: user.id,
          workspaceId: newWorkspace.id,
          role: "ADMIN"
        }
      });

      // Criar feeConfig (gateway na moeda base do workspace)
      await tx.workspaceFeeConfig.create({
        data: {
          workspaceId: newWorkspace.id,
          checkoutPercentage: 0.1,
          gatewayFeePerSale: 0.3,
          taxPercentage: 0.06,
          currency: parsed.data.baseCurrency
        }
      });

      return newWorkspace;
    });

    // define workspace recém-criado como ativo
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: workspace.id }
    });

    revalidatePath("/app/workspaces");
    revalidatePath("/app");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/cashflow");
    revalidatePath("/app/offers");
  } catch (error) {
    console.error("Erro ao criar workspace:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao criar workspace.");
  }
}

export async function selectWorkspace(formData: FormData) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const parsed = selectWorkspaceSchema.safeParse({
      workspaceId: formData.get("workspaceId")
    });

    if (!parsed.success) {
      throw new Error("WorkspaceId inválido.");
    }

    const membership = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: parsed.data.workspaceId
        }
      }
    });

    if (!membership) {
      throw new Error("Usuário não pertence a este workspace.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: parsed.data.workspaceId }
    });

    revalidatePath("/app/workspaces");
    revalidatePath("/app");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/cashflow");
    revalidatePath("/app/offers");
  } catch (error) {
    console.error("Erro ao selecionar workspace:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao selecionar workspace.");
  }
}

export async function updateWorkspace(formData: FormData) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const parsed = updateWorkspaceSchema.safeParse({
      workspaceId: formData.get("workspaceId"),
      name: formData.get("name"),
      ...(formData.has("baseCurrency")
        ? { baseCurrency: formData.get("baseCurrency") }
        : {})
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para atualização de workspace.");
    }

    // Verificar permissão (OWNER ou ADMIN podem editar)
    await requireWorkspacePermission(parsed.data.workspaceId, "edit");

    const workspace = await prisma.workspace.findUnique({
      where: { id: parsed.data.workspaceId },
      select: { id: true, baseCurrency: true }
    });

    if (!workspace) {
      throw new Error("Workspace não encontrado.");
    }

    if (
      parsed.data.baseCurrency !== undefined &&
      parsed.data.baseCurrency !== workspace.baseCurrency
    ) {
      const hasDaily = await prisma.dailyPerformance.findFirst({
        where: { offer: { workspaceId: workspace.id } },
        select: { id: true }
      });
      if (hasDaily) {
        throw new Error(
          "Não é possível alterar a moeda base após o primeiro lançamento diário."
        );
      }
    }

    await prisma.workspace.update({
      where: { id: parsed.data.workspaceId },
      data: {
        name: parsed.data.name,
        ...(parsed.data.baseCurrency !== undefined
          ? { baseCurrency: parsed.data.baseCurrency }
          : {})
      }
    });

    revalidatePath("/app/workspaces");
    revalidatePath("/app");
  } catch (error) {
    console.error("Erro ao atualizar workspace:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao atualizar workspace.");
  }
}

export async function deleteWorkspace(formData: FormData) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const parsed = deleteWorkspaceSchema.safeParse({
      workspaceId: formData.get("workspaceId")
    });

    if (!parsed.success) {
      throw new Error("WorkspaceId inválido.");
    }

    // Verificar permissão (OWNER ou ADMIN podem deletar)
    await requireWorkspacePermission(parsed.data.workspaceId, "delete");

    // Verificar se o workspace existe
    const workspace = await prisma.workspace.findUnique({
      where: { id: parsed.data.workspaceId },
      select: { id: true }
    });

    if (!workspace) {
      throw new Error("Workspace não encontrado.");
    }

    // Deletar workspace e todos os dados relacionados em transação
    await prisma.$transaction(async (tx) => {
      const workspaceId = parsed.data.workspaceId;

      // 1. Deletar DailyPerformance (via Offer)
      const offers = await tx.offer.findMany({
        where: { workspaceId },
        select: { id: true }
      });
      
      const offerIds = offers.map(o => o.id);
      if (offerIds.length > 0) {
        await tx.dailyPerformance.deleteMany({
          where: { offerId: { in: offerIds } }
        });
        await tx.periodPerformance.deleteMany({
          where: { offerId: { in: offerIds } }
        });
      }

      // 2. Deletar Offers
      await tx.offer.deleteMany({
        where: { workspaceId }
      });

      // 3. Deletar Expenses
      await tx.expense.deleteMany({
        where: { workspaceId }
      });

      // 4. Deletar ManualIncomes
      await tx.manualIncome.deleteMany({
        where: { workspaceId }
      });

      // 5. Deletar Categories
      await tx.category.deleteMany({
        where: { workspaceId }
      });

      // 6. Deletar FeeProfiles
      await tx.feeProfile.deleteMany({
        where: { workspaceId }
      });

      // 6b. Deletar ExchangeRateConfig
      await tx.exchangeRateConfig.deleteMany({
        where: { workspaceId }
      });

      // 7. Deletar WorkspaceFeeConfig
      await tx.workspaceFeeConfig.deleteMany({
        where: { workspaceId }
      });

      // 8. Deletar ApiKeys (já tem onDelete: Cascade, mas deletando explicitamente para garantir)
      await tx.apiKey.deleteMany({
        where: { workspaceId }
      });

      // 9. Deletar WorkspaceInvites (já tem onDelete: Cascade)
      await tx.workspaceInvite.deleteMany({
        where: { workspaceId }
      });

      // 10. Deletar SavedReports (já tem onDelete: Cascade)
      await tx.savedReport.deleteMany({
        where: { workspaceId }
      });

      // 11. Deletar MetricEvents relacionados ao workspace
      await tx.metricEvent.deleteMany({
        where: { workspaceId }
      });

      // 12. Deletar UserWorkspace (já tem onDelete: Cascade, mas deletando explicitamente)
      await tx.userWorkspace.deleteMany({
        where: { workspaceId }
      });

      // 13. Atualizar activeWorkspaceId dos usuários que tinham este workspace como ativo
      await tx.user.updateMany({
        where: { activeWorkspaceId: workspaceId },
        data: { activeWorkspaceId: null }
      });

      // 14. Deletar o workspace (isso vai deletar UserWorkspace via cascade também)
      await tx.workspace.delete({
        where: { id: workspaceId }
      });
    });

    // Se o workspace deletado era o ativo, atualizar activeWorkspaceId
    if (user.activeWorkspaceId === parsed.data.workspaceId) {
      // Tentar encontrar outro workspace do usuário
      const otherWorkspace = await prisma.userWorkspace.findFirst({
        where: { userId: user.id },
        select: { workspaceId: true }
      });

      if (otherWorkspace) {
        // Ativar outro workspace
        await prisma.user.update({
          where: { id: user.id },
          data: { activeWorkspaceId: otherWorkspace.workspaceId }
        });
      } else {
        // Não há outros workspaces, deixar null
        await prisma.user.update({
          where: { id: user.id },
          data: { activeWorkspaceId: null }
        });
      }
    }

    revalidatePath("/app/workspaces");
    revalidatePath("/app");
  } catch (error) {
    console.error("Erro ao deletar workspace:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao deletar workspace.");
  }
}


