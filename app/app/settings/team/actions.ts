"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { checkFeatureAccess } from "@/lib/plans/authorization";
import { checkUserLimit } from "@/lib/plans/authorization";
import { randomBytes } from "crypto";
import { trackEvent } from "@/lib/analytics/events";
import { sendWorkspaceInviteEmail } from "@/lib/email/send-email";
import type { WorkspaceRole } from "@/lib/prisma-enums";

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

export async function inviteUserAction(formData: FormData) {
  try {
    // Verifica feature access
    const featureCheck = await checkFeatureAccess("multi_user");
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason || "Multi-usuário disponível apenas no plano BUSINESS");
    }

    const workspaceId = await requireActiveWorkspaceId();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    // Verifica limite de usuários
    const limitCheck = await checkUserLimit(workspaceId);
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.reason || "Limite de usuários atingido");
    }

    // Verifica permissão
    const membership = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      throw new Error("Apenas OWNER ou ADMIN podem convidar usuários");
    }

    const parsed = inviteUserSchema.safeParse({
      email: formData.get("email"),
      role: formData.get("role"),
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para convite");
    }

    // Verifica se o usuário já está no workspace
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: {
        workspaces: {
          where: { workspaceId },
        },
      },
    });

    if (existingUser?.workspaces.length) {
      throw new Error("Usuário já é membro deste workspace");
    }

    // Busca informações do workspace e do usuário que está convidando
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    if (!workspace) {
      throw new Error("Workspace não encontrado");
    }

    // Gera token de convite
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: parsed.data.email,
        role: parsed.data.role as WorkspaceRole,
        token,
        invitedBy: user.id,
        expiresAt,
      },
    });

    // Envia email de convite
    await sendWorkspaceInviteEmail(
      parsed.data.email,
      workspace.name,
      user.name || "Um usuário",
      user.email,
      parsed.data.role,
      token
    );

    await trackEvent("team_member_invited", {
      workspaceId,
      metadata: { role: parsed.data.role },
    });

    revalidatePath("/app/settings/team");
  } catch (error) {
    console.error("Erro ao convidar usuário:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao convidar usuário");
  }
}

export async function removeMemberAction(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const user = await getCurrentUser();
    const memberId = formData.get("memberId");

    if (!user || typeof memberId !== "string") {
      throw new Error("Dados inválidos");
    }

    // Verifica permissão
    const membership = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      throw new Error("Apenas OWNER ou ADMIN podem remover membros");
    }

    // Não permite remover a si mesmo se for o único OWNER
    if (memberId === user.id) {
      const ownerCount = await prisma.userWorkspace.count({
        where: {
          workspaceId,
          role: "OWNER",
        },
      });

      if (ownerCount === 1) {
        throw new Error("Não é possível remover o único OWNER do workspace");
      }
    }

    await prisma.userWorkspace.delete({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
    });

    revalidatePath("/app/settings/team");
  } catch (error) {
    console.error("Erro ao remover membro:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao remover membro");
  }
}

export async function updateMemberRoleAction(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const user = await getCurrentUser();
    const memberId = formData.get("memberId");
    const role = formData.get("role");

    if (!user || typeof memberId !== "string" || typeof role !== "string") {
      throw new Error("Dados inválidos");
    }

    // Verifica permissão
    const membership = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      throw new Error("Apenas OWNER pode alterar roles");
    }

    await prisma.userWorkspace.update({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId,
        },
      },
      data: {
        role: role as WorkspaceRole,
      },
    });

    revalidatePath("/app/settings/team");
  } catch (error) {
    console.error("Erro ao atualizar role:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao atualizar role");
  }
}

export async function getTeamMembers(workspaceId: string) {
  return prisma.userWorkspace.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      role: "asc", // OWNER primeiro
    },
  });
}

export async function getPendingInvites(workspaceId: string) {
  return prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

