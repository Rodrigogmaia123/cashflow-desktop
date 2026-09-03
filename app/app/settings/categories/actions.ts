"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkCategoryLimit, checkFeatureAccess } from "@/lib/plans/authorization";

const categorySchema = z.object({
  name: z.string().min(2).max(60).transform((s) => s.trim()),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"])
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
    throw new Error("Apenas administradores podem gerenciar categorias.");
  }

  return { workspaceId: user.activeWorkspaceId };
}

export async function createCategory(formData: FormData) {
  try {
    // Verifica se o plano permite categorias personalizadas
    const featureCheck = await checkFeatureAccess("categories_custom");
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason || "Categorias personalizadas não estão disponíveis no plano FREE. Faça upgrade para PRO.");
    }

    // Verifica limite de categorias
    const categoryCheck = await checkCategoryLimit();
    if (!categoryCheck.allowed) {
      throw new Error(categoryCheck.reason || "Limite de categorias atingido. Faça upgrade para criar mais categorias.");
    }

    const { workspaceId } = await requireAdminWorkspace();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para criação de categoria.");
  }

  const existing = await prisma.category.findFirst({
    where: { workspaceId, name: parsed.data.name, type: parsed.data.type }
  });

  if (existing) {
    throw new Error("Já existe uma categoria com esse nome e tipo neste workspace.");
  }

  await prisma.category.create({
    data: {
      workspaceId,
      name: parsed.data.name,
      type: parsed.data.type
    }
  });

    revalidatePath("/app/settings/categories");
    revalidatePath("/app/cashflow");
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao criar categoria.");
  }
}

export async function updateCategory(formData: FormData) {
  try {
  const { workspaceId } = await requireAdminWorkspace();

  const parsedId = idSchema.safeParse({
    id: formData.get("id")
  });

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type")
  });

  if (!parsedId.success || !parsed.success) {
    throw new Error("Dados inválidos para atualização de categoria.");
  }

  const current = await prisma.category.findFirst({
    where: { id: parsedId.data.id, workspaceId }
  });

  if (!current) {
    throw new Error("Categoria não encontrada no workspace atual.");
  }

  const collision = await prisma.category.findFirst({
    where: {
      workspaceId,
      name: parsed.data.name,
      type: parsed.data.type,
      NOT: { id: current.id }
    }
  });

  if (collision) {
    throw new Error("Já existe uma categoria com esse nome e tipo neste workspace.");
  }

  await prisma.category.update({
    where: { id: current.id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type
    }
  });

    revalidatePath("/app/settings/categories");
    revalidatePath("/app/cashflow");
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao atualizar categoria.");
  }
}

export async function deleteCategory(formData: FormData) {
  try {
  const { workspaceId } = await requireAdminWorkspace();

  const parsed = idSchema.safeParse({
    id: formData.get("id")
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos para exclusão de categoria.");
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.id, workspaceId },
    include: {
      _count: { select: { expenses: true, incomes: true } }
    }
  });

  if (!category) {
    throw new Error("Categoria não encontrada no workspace atual.");
  }

  if (category._count.expenses > 0 || category._count.incomes > 0) {
    throw new Error("Esta categoria está em uso e não pode ser excluída.");
  }

  await prisma.category.delete({
    where: { id: category.id }
  });

    revalidatePath("/app/settings/categories");
    revalidatePath("/app/cashflow");
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao excluir categoria.");
  }
}


