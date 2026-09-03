"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { CURRENCIES } from "@/lib/domain/currency";

const feeProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(80).transform((s) => s.trim()),
  currency: z.enum(CURRENCIES),
  checkoutPercentage: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return undefined;
      const num = typeof val === "string" ? parseFloat(val) : Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z.number({ required_error: "Checkout é obrigatório" }).min(0, "Checkout deve ser >= 0").max(1, "Checkout deve ser <= 1")
  ),
  gatewayFeePerSale: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return undefined;
      const num = typeof val === "string" ? parseFloat(val) : Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z.number({ required_error: "Gateway é obrigatório" }).min(0, "Gateway deve ser >= 0")
  ),
  taxPercentage: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return undefined;
      const num = typeof val === "string" ? parseFloat(val) : Number(val);
      return Number.isNaN(num) ? undefined : num;
    },
    z.number({ required_error: "Imposto é obrigatório" }).min(0, "Imposto deve ser >= 0").max(1, "Imposto deve ser <= 1")
  )
});

const idSchema = z.object({
  id: z.string().cuid()
});

async function requireAdminWorkspace() {
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
    throw new Error("Apenas administradores podem gerenciar perfis de taxas.");
  }

  return { userId: user.id, workspaceId: user.activeWorkspaceId };
}

export async function createFeeProfile(formData: FormData) {
  try {
    const { workspaceId } = await requireAdminWorkspace();

    const rawData = {
      name: formData.get("name"),
      currency: formData.get("currency") ?? "BRL",
      checkoutPercentage: formData.get("checkoutPercentage"),
      gatewayFeePerSale: formData.get("gatewayFeePerSale"),
      taxPercentage: formData.get("taxPercentage")
    };

    // Debug: log dos valores recebidos
    if (process.env.NODE_ENV === "development") {
      console.log("[createFeeProfile] Raw form data:", rawData);
    }

    const parsed = feeProfileSchema.safeParse(rawData);

    if (!parsed.success) {
      // Log detalhado do erro de validação
      console.error("[createFeeProfile] Validation errors:", parsed.error.errors);
      const errorMessages = parsed.error.errors.map(e => 
        `${e.path.join(".")}: ${e.message}`
      ).join(", ");
      throw new Error(`Dados inválidos para criação de perfil de taxas: ${errorMessages}`);
    }

  await prisma.feeProfile.create({
    data: {
      workspaceId,
      name: parsed.data.name,
      currency: parsed.data.currency,
      checkoutPercentage: parsed.data.checkoutPercentage,
      gatewayFeePerSale: parsed.data.gatewayFeePerSale,
      taxPercentage: parsed.data.taxPercentage
    }
  });

    revalidatePath("/app/settings/fee-profiles");
  } catch (error) {
    console.error("Erro ao criar perfil de taxas:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao criar perfil de taxas.");
  }
}

export async function updateFeeProfile(formData: FormData) {
  try {
  const { workspaceId } = await requireAdminWorkspace();

  const parsedId = idSchema.safeParse({
    id: formData.get("id")
  });

  if (!parsedId.success) {
    throw new Error("ID de perfil inválido.");
  }

  const parsedData = feeProfileSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency") ?? "BRL",
    checkoutPercentage: formData.get("checkoutPercentage"),
    gatewayFeePerSale: formData.get("gatewayFeePerSale"),
    taxPercentage: formData.get("taxPercentage")
  });

  if (!parsedData.success) {
    throw new Error("Dados inválidos para atualização de perfil de taxas.");
  }

  const profile = await prisma.feeProfile.findFirst({
    where: {
      id: parsedId.data.id,
      workspaceId
    },
    include: {
      offers: { select: { id: true, currency: true, name: true } }
    }
  });

  if (!profile) {
    throw new Error("Perfil de taxas não encontrado neste workspace.");
  }

  if (parsedData.data.currency !== profile.currency) {
    const mismatched = profile.offers.filter(
      (o) => o.currency !== parsedData.data.currency
    );
    if (mismatched.length > 0) {
      throw new Error(
        `Não é possível alterar a moeda do perfil: há ofertas vinculadas em outra moeda (ex: ${mismatched[0].name}).`
      );
    }
  }

  await prisma.feeProfile.update({
    where: { id: profile.id },
    data: {
      name: parsedData.data.name,
      currency: parsedData.data.currency,
      checkoutPercentage: parsedData.data.checkoutPercentage,
      gatewayFeePerSale: parsedData.data.gatewayFeePerSale,
      taxPercentage: parsedData.data.taxPercentage
    }
  });

    revalidatePath("/app/settings/fee-profiles");
    revalidatePath("/app/offers");
  } catch (error) {
    console.error("Erro ao atualizar perfil de taxas:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao atualizar perfil de taxas.");
  }
}

export async function deleteFeeProfile(formData: FormData) {
  try {
  const { workspaceId } = await requireAdminWorkspace();

  const parsedId = idSchema.safeParse({
    id: formData.get("id")
  });

  if (!parsedId.success) {
    throw new Error("ID de perfil inválido.");
  }

  const profile = await prisma.feeProfile.findFirst({
    where: {
      id: parsedId.data.id,
      workspaceId
    }
  });

  if (!profile) {
    throw new Error("Perfil de taxas não encontrado neste workspace.");
  }

  const offerInUse = await prisma.offer.findFirst({
    where: {
      workspaceId,
      feeProfileId: profile.id
    }
  });

  if (offerInUse) {
    throw new Error(
      "Este perfil de taxas está em uso por uma ou mais ofertas e não pode ser excluído."
    );
  }

  await prisma.feeProfile.delete({
    where: { id: profile.id }
  });

    revalidatePath("/app/settings/fee-profiles");
  } catch (error) {
    console.error("Erro ao excluir perfil de taxas:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao excluir perfil de taxas.");
  }
}


