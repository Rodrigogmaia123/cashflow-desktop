"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateWorkspace, deleteWorkspace, selectWorkspace } from "./actions";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { SoftBadge } from "@/components/dashboard/soft-badge";
import type { WorkspaceRole } from "@/lib/prisma-enums";
import { CURRENCY_OPTIONS } from "@/lib/domain/currency";

interface WorkspaceItemClientProps {
  workspaceId: string;
  workspaceName: string;
  baseCurrency: string;
  role: WorkspaceRole;
  isActive: boolean;
  canEdit: boolean; // OWNER ou ADMIN
  canChangeBaseCurrency: boolean;
}

export function WorkspaceItemClient({
  workspaceId,
  workspaceName,
  baseCurrency,
  role,
  isActive,
  canEdit,
  canChangeBaseCurrency,
}: WorkspaceItemClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(workspaceName);
  const [editedBaseCurrency, setEditedBaseCurrency] = useState(baseCurrency);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditedName(workspaceName);
    setEditedBaseCurrency(baseCurrency);
    setIsEditing(true);
    setError(null);
  };

  const handleSave = () => {
    if (editedName.trim().length < 3) {
      setError("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (editedName.trim().length > 120) {
      setError("O nome deve ter no máximo 120 caracteres.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("workspaceId", workspaceId);
        formData.append("name", editedName.trim());
        if (canChangeBaseCurrency) {
          formData.append("baseCurrency", editedBaseCurrency);
        }
        await updateWorkspace(formData);
        setIsEditing(false);
        setError(null);
        // Atualizar a página sem refresh completo
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atualizar workspace.");
      }
    });
  };

  const handleCancel = () => {
    setEditedName(workspaceName);
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("workspaceId", workspaceId);
        await deleteWorkspace(formData);
        setIsDeleteDialogOpen(false);
        // Atualizar a página sem refresh completo
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao deletar workspace.");
        setIsDeleteDialogOpen(false);
      }
    });
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={isPending}
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  } else if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
                autoFocus
              />
              {canChangeBaseCurrency ? (
                <select
                  value={editedBaseCurrency}
                  onChange={(e) => setEditedBaseCurrency(e.target.value)}
                  disabled={isPending}
                  className="h-8 w-full rounded-md border border-white/10 bg-[#0F131A] px-2 text-xs text-foreground"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      Moeda base: {c.code}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Moeda base: {baseCurrency} (bloqueada após o 1º lançamento)
                </p>
              )}
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isPending}
                  className="h-6 px-2"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold text-foreground">{workspaceName}</p>
                <SoftBadge variant="default">{baseCurrency}</SoftBadge>
                {isActive && (
                  <SoftBadge variant="primary">Ativo</SoftBadge>
                )}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                Papel: {role.toLowerCase()}
              </p>
            </>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEdit}
                  disabled={isPending}
                  className="h-8 w-8 p-0"
                  title="Editar nome"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isPending}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Deletar workspace"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <form
              action={async (formData) => {
                await selectWorkspace(formData);
                router.refresh();
              }}
            >
              <input
                type="hidden"
                name="workspaceId"
                value={workspaceId}
              />
              <Button
                type="submit"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={isActive ? "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90" : ""}
              >
                {isActive ? "Ativo" : "Ativar"}
              </Button>
            </form>
          </div>
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar workspace</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o workspace "{workspaceName}"? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão permanentemente removidos.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">Dados que serão removidos:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Ofertas e performances</li>
              <li>Despesas e receitas</li>
              <li>Categorias</li>
              <li>Configurações de taxas</li>
              <li>Chaves de API</li>
              <li>Relatórios salvos</li>
              <li>Membros e convites</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deletando..." : "Deletar permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

