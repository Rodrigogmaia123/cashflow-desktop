/**
 * Helpers para verificar permissões do usuário no workspace
 */

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { hasPermission, type Permission } from "./permissions";
import type { WorkspaceRole } from "@/lib/prisma-enums";

/**
 * Obtém a role do usuário no workspace atual
 */
export async function getUserWorkspaceRole(workspaceId: string): Promise<WorkspaceRole | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
    select: {
      role: true,
    },
  });

  return membership?.role || null;
}

/**
 * Verifica se o usuário tem uma permissão específica no workspace
 */
export async function checkWorkspacePermission(
  workspaceId: string,
  permission: Permission
): Promise<{ allowed: boolean; role: WorkspaceRole | null; reason?: string }> {
  const role = await getUserWorkspaceRole(workspaceId);

  if (!role) {
    return {
      allowed: false,
      role: null,
      reason: "Usuário não é membro deste workspace",
    };
  }

  const allowed = hasPermission(role, permission);

  return {
    allowed,
    role,
    reason: allowed ? undefined : `Permissão '${permission}' não disponível para role '${role}'`,
  };
}

/**
 * Exige que o usuário tenha uma permissão específica no workspace
 * Lança erro se não tiver permissão
 */
export async function requireWorkspacePermission(
  workspaceId: string,
  permission: Permission
): Promise<WorkspaceRole> {
  const check = await checkWorkspacePermission(workspaceId, permission);

  if (!check.allowed || !check.role) {
    throw new Error(
      check.reason || `Permissão '${permission}' necessária. Sua role atual não permite esta ação.`
    );
  }

  return check.role;
}

