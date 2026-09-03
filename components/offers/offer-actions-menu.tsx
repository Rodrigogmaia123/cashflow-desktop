"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Edit, Trash2, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateOffer, deleteOffer } from "@/app/app/offers/actions";

type Props = {
  offerId: string;
  offerName: string;
  offerStatus: "ACTIVE" | "PAUSED" | "DEAD";
  canEdit: boolean;
  canDelete: boolean;
};

export function OfferActionsMenu({
  offerId,
  offerName,
  offerStatus,
  canEdit,
  canDelete
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(offerName);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStatusChange = (newStatus: "ACTIVE" | "PAUSED" | "DEAD") => {
    if (!canEdit || newStatus === offerStatus) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", offerId);
        formData.append("name", offerName);
        formData.append("status", newStatus);
        await updateOffer(formData);
        router.refresh();
        setIsOpen(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao atualizar oferta.");
      }
    });
  };

  const handleEditName = () => {
    if (!canEdit) return;
    // Fechar o menu dropdown primeiro
    setIsOpen(false);
    // Pequeno delay para garantir que o menu seja fechado antes de abrir o dialog
    setTimeout(() => {
      setEditedName(offerName);
      setIsEditDialogOpen(true);
    }, 50);
  };

  const handleSaveName = () => {
    if (!canEdit || editedName.trim() === "" || editedName === offerName) {
      setIsEditDialogOpen(false);
      return;
    }

    if (editedName.length < 3) {
      alert("O nome da oferta deve ter pelo menos 3 caracteres.");
      return;
    }

    if (editedName.length > 120) {
      alert("O nome da oferta deve ter no máximo 120 caracteres.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", offerId);
        formData.append("name", editedName.trim());
        formData.append("status", offerStatus);
        await updateOffer(formData);
        router.refresh();
        setIsEditDialogOpen(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao atualizar nome da oferta.");
      }
    });
  };

  const handleDelete = () => {
    if (!canDelete) return;

    if (!confirm(`Tem certeza que deseja excluir a oferta "${offerName}"?\n\nEsta ação irá excluir:\n- A oferta\n- Todos os lançamentos de performance associados\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", offerId);
        await deleteOffer(formData);
        router.refresh();
        setIsOpen(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao excluir oferta.");
      }
    });
  };

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-muted"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isPending}
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </Button>

      {isOpen && !isEditDialogOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          
          {/* Menu */}
          <div
            className="absolute right-0 top-8 z-30 w-48 rounded-md border bg-card shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-1">
              {/* Editar Nome */}
              {canEdit && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditName();
                    }}
                    disabled={isPending}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm transition-colors hover:bg-muted text-foreground ${
                      isPending ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Editar nome</span>
                  </button>
                  <div className="my-1 border-t border-border" />
                </>
              )}

              {/* Mudar Status */}
              {canEdit && (
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase">
                    Status
                  </div>
                  {(["ACTIVE", "PAUSED", "DEAD"] as const).map((status) => {
                    const labels = {
                      ACTIVE: "Ativa",
                      PAUSED: "Pausada",
                      DEAD: "Inativa"
                    };
                    const isActive = status === offerStatus;
                    
                    return (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(status);
                        }}
                        disabled={isPending || isActive}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary cursor-default"
                            : "hover:bg-muted text-foreground"
                        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span>{labels[status]}</span>
                        {isActive && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Excluir */}
              {canDelete && (
                <>
                  {canEdit && <div className="my-1 border-t border-border" />}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={isPending}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm transition-colors hover:bg-destructive/10 hover:text-destructive ${
                      isPending ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{isPending ? "Excluindo..." : "Excluir oferta"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dialog para editar nome */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          // Garantir que o menu dropdown seja fechado quando o dialog abrir
          if (open) {
            setIsOpen(false);
          }
        }}
      >
        <DialogContent 
          onClick={(e) => e.stopPropagation()}
          className="z-[9999]"
        >
          <DialogHeader>
            <DialogTitle>Editar nome da oferta</DialogTitle>
            <DialogDescription>
              Altere o nome da oferta. O nome deve ter entre 3 e 120 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveName();
                }
                if (e.key === "Escape") {
                  setIsEditDialogOpen(false);
                }
              }}
              disabled={isPending}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Nome da oferta"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveName}
              disabled={isPending || editedName.trim() === "" || editedName === offerName}
            >
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

