/**
 * Sistema RBAC (Role-Based Access Control)
 * 
 * Define permissões por role e validações de acesso.
 */

import type { WorkspaceRole } from "@/lib/prisma-enums";

export type Permission = 
  | "read"
  | "create"
  | "edit"
  | "delete"
  | "manage_users"
  | "manage_settings"
  | "manage_api_keys"
  | "*"; // Todas as permissões

/**
 * Mapa de permissões por role
 */
const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  OWNER: ["*"], // Todas as permissões
  ADMIN: [
    "read",
    "create",
    "edit",
    "delete",
    "manage_users",
    "manage_settings",
    "manage_api_keys",
  ],
  MEMBER: [
    "read",
    "create",
    "edit",
  ],
  VIEWER: [
    "read",
  ],
};

/**
 * Verifica se uma role tem uma permissão específica
 */
export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  
  // OWNER tem todas as permissões
  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(permission);
}

/**
 * Verifica se uma role pode gerenciar outra role
 * OWNER pode gerenciar todos
 * ADMIN pode gerenciar MEMBER e VIEWER
 * MEMBER e VIEWER não podem gerenciar ninguém
 */
export function canManageRole(managerRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  if (managerRole === "OWNER") {
    return true;
  }

  if (managerRole === "ADMIN") {
    return targetRole === "MEMBER" || targetRole === "VIEWER";
  }

  return false;
}

/**
 * Retorna todas as roles que uma role pode gerenciar
 */
export function getManageableRoles(role: WorkspaceRole): WorkspaceRole[] {
  if (role === "OWNER") {
    return ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
  }

  if (role === "ADMIN") {
    return ["MEMBER", "VIEWER"];
  }

  return [];
}

/**
 * Descrição amigável de cada role
 */
export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  OWNER: "Acesso total. Pode gerenciar tudo, incluindo workspace e billing.",
  ADMIN: "Pode criar, editar e excluir dados. Pode gerenciar membros e configurações.",
  MEMBER: "Pode criar e editar dados, mas não pode excluir ou gerenciar membros.",
  VIEWER: "Apenas visualização. Não pode criar, editar ou excluir dados.",
};

