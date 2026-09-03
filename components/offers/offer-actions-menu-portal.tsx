"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Check, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  OFFER_COUNTRY_OPTIONS,
  type OfferCountryCode
} from "@/lib/domain/offer-country";
import { useOfferActions } from "./offer-actions-context";
import { updateOffer, deleteOffer } from "@/app/app/offers/actions";

export function OfferActionsMenuPortal() {
  const { menu, closeMenu } = useOfferActions();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menu) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [menu, closeMenu]);

  useEffect(() => {
    if (menu) {
      setEditedName(menu.offerName);
    }
  }, [menu]);

  if (!mounted || !menu) {
    return null;
  }

  const { offerId, offerName, offerStatus, offerCountry, canEdit, canDelete, anchorRect } = menu;

  const appendOfferFields = (
    formData: FormData,
    overrides?: {
      name?: string;
      status?: "ACTIVE" | "PAUSED" | "DEAD";
      country?: OfferCountryCode | null;
    }
  ) => {
    formData.append("id", offerId);
    formData.append("name", overrides?.name ?? offerName);
    formData.append("status", overrides?.status ?? offerStatus);
    formData.append(
      "country",
      overrides && "country" in overrides
        ? overrides.country ?? ""
        : offerCountry ?? ""
    );
  };

  const handleStatusChange = (newStatus: "ACTIVE" | "PAUSED" | "DEAD") => {
    if (!canEdit || newStatus === offerStatus) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        appendOfferFields(formData, { status: newStatus });
        await updateOffer(formData);
        router.refresh();
        closeMenu();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao atualizar oferta.");
      }
    });
  };

  const handleCountryChange = (newCountry: OfferCountryCode | null) => {
    if (!canEdit || newCountry === offerCountry) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        appendOfferFields(formData, { country: newCountry });
        await updateOffer(formData);
        router.refresh();
        closeMenu();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao atualizar bandeira.");
      }
    });
  };

  const handleEditName = () => {
    if (!canEdit) return;
    closeMenu();
    setTimeout(() => {
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
        appendOfferFields(formData, { name: editedName.trim() });
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
        closeMenu();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao excluir oferta.");
      }
    });
  };

  // Calcular posição do menu (ajustar para não sair da tela)
  const menuWidth = 200;
  const gap = 8;
  
  // Posição horizontal: alinhar à direita do botão, mas não sair da tela
  let menuLeft = anchorRect.right - menuWidth;
  if (menuLeft < 16) {
    // Se não cabe à esquerda, posicionar à direita do botão
    menuLeft = anchorRect.right + gap;
    if (menuLeft + menuWidth > window.innerWidth - 16) {
      // Se ainda não cabe, alinhar à direita da tela
      menuLeft = window.innerWidth - menuWidth - 16;
    }
  }
  
  // Posição vertical: abaixo do botão
  const menuTop = anchorRect.bottom + gap;

  return createPortal(
    <>
      {/* Backdrop invisível */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={closeMenu}
      />

      {/* Menu */}
      <div
        className="fixed z-[9999] w-[200px] max-h-[min(420px,calc(100vh-24px))] overflow-y-auto rounded-xl border border-white/6 bg-gradient-to-b from-[#111827] to-[#0b0f1a] p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.45)] animate-[pop_0.12s_ease-out]"
        style={{
          top: `${menuTop}px`,
          left: `${menuLeft}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-[13px] rounded-lg transition-colors text-foreground hover:bg-white/6 ${
                isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Editar nome</span>
            </button>
            <div className="my-1 h-px bg-border" />
          </>
        )}

        {/* Mudar Status */}
        {canEdit && (
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase">
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary cursor-default"
                      : "text-foreground hover:bg-white/6"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span>{labels[status]}</span>
                  {isActive && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Bandeira / País */}
        {canEdit && (
          <>
            <div className="my-1 h-px bg-border" />
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase">
                Bandeira
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCountryChange(null);
                }}
                disabled={isPending || offerCountry === null}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] rounded-lg transition-colors ${
                  offerCountry === null
                    ? "bg-primary/10 text-primary cursor-default"
                    : "text-foreground hover:bg-white/6"
                } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>Sem bandeira</span>
                {offerCountry === null && <Check className="h-3.5 w-3.5" />}
              </button>
              {OFFER_COUNTRY_OPTIONS.map((country) => {
                const isActive = country.code === offerCountry;

                return (
                  <button
                    key={country.code}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCountryChange(country.code);
                    }}
                    disabled={isPending || isActive}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary cursor-default"
                        : "text-foreground hover:bg-white/6"
                    } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{country.flag}</span>
                      <span>{country.label}</span>
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Excluir */}
        {canDelete && (
          <>
            {canEdit && <div className="my-1 h-px bg-border" />}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isPending}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-[13px] rounded-lg transition-colors text-destructive hover:bg-destructive/10 ${
                isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isPending ? "Excluindo..." : "Excluir oferta"}</span>
            </button>
          </>
        )}
      </div>

      {/* Dialog para editar nome */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            closeMenu();
          }
        }}
      >
        <DialogContent onClick={(e) => e.stopPropagation()}>
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
    </>,
    document.body
  );
}
