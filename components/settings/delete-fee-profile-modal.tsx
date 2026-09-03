"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type OfferInUse = {
  id: string;
  name: string;
};

type DeleteFeeProfileModalProps = {
  profileId: string;
  profileName: string;
  offersInUse: OfferInUse[];
  deleteAction: (formData: FormData) => Promise<void>;
};

export function DeleteFeeProfileModal({
  profileId,
  profileName,
  offersInUse,
  deleteAction
}: DeleteFeeProfileModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBlocked = offersInUse.length > 0;
  const title = useMemo(() => {
    if (isBlocked) return "Não é possível excluir este perfil";
    return "Confirmar exclusão";
  }, [isBlocked]);

  function open() {
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={open}
      >
        Excluir
      </Button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-lg rounded-md border bg-background p-0 text-foreground shadow-lg"
      >
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button
              type="button"
              onClick={close}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Fechar"
            >
              Fechar
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Perfil: <span className="font-medium">{profileName}</span>
          </p>
        </div>

        <div className="space-y-3 px-4 py-3 text-xs">
          {isBlocked ? (
            <>
              <p className="rounded-md border border-warning/40 bg-warning/10 p-2 text-warning">
                Este perfil está em uso por uma ou mais ofertas. Para excluir,
                primeiro altere o perfil de taxas dessas ofertas.
              </p>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Ofertas usando este perfil:
                </p>
                <div className="max-h-48 overflow-auto rounded-md border">
                  {offersInUse.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
                    >
                      <span className="truncate">{o.name}</span>
                      <Link
                        href={`/app/offers/${o.id}`}
                        className="text-[11px] underline"
                      >
                        Abrir oferta
                      </Link>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Aviso: trocar o perfil na oferta afeta apenas lançamentos
                  futuros; os lançamentos antigos permanecem com snapshots.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-destructive">
                Esta ação é permanente. Deseja realmente excluir este perfil?
              </p>

              <form
                action={async (formData) => {
                  setIsSubmitting(true);
                  await deleteAction(formData);
                  close();
                }}
                className="flex items-center justify-end gap-2"
              >
                <input type="hidden" name="id" value={profileId} />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={close}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Excluindo..." : "Confirmar exclusão"}
                </Button>
              </form>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}


