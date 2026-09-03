"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function acceptInviteAction(formData: FormData) {
  try {
    const token = formData.get("token");

    if (typeof token !== "string") {
      throw new Error("Token de convite inválido");
    }

    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }

    // Busca o convite
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      throw new Error("Convite não encontrado");
    }

    // Verifica se expirou
    if (invite.expiresAt < new Date()) {
      throw new Error("Convite expirado");
    }

    // Verifica se já foi aceito
    if (invite.status === "ACCEPTED") {
      throw new Error("Convite já foi aceito");
    }

    // Verifica se o email corresponde
    if (invite.email !== user.email) {
      throw new Error("Este convite não é para seu email");
    }

    // Verifica se já é membro
    const existingMembership = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (existingMembership) {
      // Atualiza o convite como aceito mesmo que já seja membro
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      revalidatePath("/app/settings/team");
      return;
    }

    // Aceita o convite em transação
    await prisma.$transaction(async (tx) => {
      // Cria a associação usuário-workspace
      await tx.userWorkspace.create({
        data: {
          userId: user.id,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      });

      // Atualiza o convite como aceito
      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });

    // Define o workspace como ativo se o usuário não tiver um
    if (!user.activeWorkspaceId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeWorkspaceId: invite.workspaceId },
      });
    }

    revalidatePath("/app/settings/team");
    revalidatePath("/app");
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao aceitar convite");
  }
}

