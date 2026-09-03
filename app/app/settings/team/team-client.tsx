"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { inviteUserAction, removeMemberAction, updateMemberRoleAction } from "./actions";
import { UserPlus, Trash2, Mail, Crown, Shield, User, Eye } from "lucide-react";
import { ROLE_DESCRIPTIONS, getManageableRoles, canManageRole } from "@/lib/rbac/permissions";
import type { WorkspaceRole } from "@/lib/prisma-enums";

interface TeamMember {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface PendingInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  createdAt: Date;
  expiresAt: Date;
}

interface TeamClientProps {
  initialMembers: TeamMember[];
  initialInvites: PendingInvite[];
}

const ROLE_ICONS: Record<WorkspaceRole, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
};

export function TeamClient({ initialMembers, initialInvites }: TeamClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const handleInvite = async (formData: FormData) => {
    setIsInviting(true);
    try {
      await inviteUserAction(formData);
      setShowInviteForm(false);
      // Recarrega a página para atualizar lista
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao convidar usuário");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro do workspace?")) {
      return;
    }

    const formData = new FormData();
    formData.append("memberId", memberId);

    try {
      await removeMemberAction(formData);
      setMembers(members.filter((m) => m.userId !== memberId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao remover membro");
    }
  };

  const handleUpdateRole = async (memberId: string, role: WorkspaceRole) => {
    const formData = new FormData();
    formData.append("memberId", memberId);
    formData.append("role", role);

    try {
      await updateMemberRoleAction(formData);
      setMembers(
        members.map((m) => (m.userId === memberId ? { ...m, role } : m))
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao atualizar role");
    }
  };

  // TODO: Obter role do usuário atual do servidor
  // Por enquanto, assume que o primeiro membro é o usuário atual
  const currentUserRole: WorkspaceRole = members[0]?.role || "MEMBER";
  const manageableRoles = getManageableRoles(currentUserRole);

  return (
    <div className="space-y-6">
      {/* Formulário de convite */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Convidar Novo Membro</h3>
          </CardHeader>
          <CardContent>
            <form action={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="usuario@exemplo.com"
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-2">
                  Permissão
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {manageableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role} - {ROLE_DESCRIPTIONS[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isInviting} className="flex-1">
                  {isInviting ? "Enviando..." : "Enviar Convite"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Botão para mostrar formulário */}
      {!showInviteForm && (
        <Button
          onClick={() => setShowInviteForm(true)}
          className="w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Membro
        </Button>
      )}

      {/* Convites pendentes */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Convites Pendentes</h3>
          {invites.map((invite) => {
            const Icon = ROLE_ICONS[invite.role];
            return (
              <Card key={invite.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {invite.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lista de membros */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Membros do Workspace</h3>
        {members.map((member) => {
          const Icon = ROLE_ICONS[member.role];
          return (
            <Card key={member.userId}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name || ""}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {member.user.name || member.user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {member.role} - {ROLE_DESCRIPTIONS[member.role]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageRole(currentUserRole, member.role) && (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member.userId, e.target.value as WorkspaceRole)
                        }
                        className="text-xs rounded-lg border-0 bg-[#0F131A] px-2 py-1 text-foreground outline-none"
                      >
                        {manageableRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    )}
                    {canManageRole(currentUserRole, member.role) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemove(member.userId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

