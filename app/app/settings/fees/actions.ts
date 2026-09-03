"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { CURRENCIES } from "@/lib/domain/currency";

const updateFeesSchema = z.object({
  checkoutPercentage: z.coerce.number().min(0).max(1),
  gatewayFeePerSale: z.coerce.number().min(0),
  taxPercentage: z.coerce.number().min(0).max(1),
  currency: z.enum(CURRENCIES)
});

export async function updateWorkspaceFees(formData: FormData) {
  try {
    const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.activeWorkspaceId) {
    redirect("/app/workspaces?missing=1");
  }

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: user.activeWorkspaceId
      }
    }
  });

  // OWNER tem todas as permissões (incluindo as de ADMIN)
  if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
    throw new Error("Apenas administradores podem alterar as taxas do workspace.");
  }

  const parsed = updateFeesSchema.safeParse({
    checkoutPercentage: formData.get("checkoutPercentage"),
    gatewayFeePerSale: formData.get("gatewayFeePerSale"),
    taxPercentage: formData.get("taxPercentage"),
    currency: formData.get("currency")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para configuração de taxas.");
  }

  const { checkoutPercentage, gatewayFeePerSale, taxPercentage, currency } = parsed.data;

  await prisma.workspaceFeeConfig.upsert({
    where: { workspaceId: user.activeWorkspaceId },
    update: {
      checkoutPercentage,
      gatewayFeePerSale,
      taxPercentage,
      currency
    },
    create: {
      workspaceId: user.activeWorkspaceId,
      checkoutPercentage,
      gatewayFeePerSale,
      taxPercentage,
      currency
    }
  });

    revalidatePath("/app/settings/fees");
    revalidatePath("/app/offers");
  } catch (error) {
    console.error("Erro ao atualizar taxas do workspace:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao atualizar taxas do workspace.");
  }
}


