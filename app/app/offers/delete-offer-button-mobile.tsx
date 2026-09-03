"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteOffer } from "./actions";

interface DeleteOfferButtonMobileProps {
  offerId: string;
  offerName: string;
}

export function DeleteOfferButtonMobile({ offerId, offerName }: DeleteOfferButtonMobileProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm(`Tem certeza que deseja excluir a oferta "${offerName}"?\n\nEsta ação irá excluir:\n- A oferta\n- Todos os lançamentos de performance associados\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", offerId);
        await deleteOffer(formData);
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao excluir oferta. Tente novamente.");
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={handleDelete}
      disabled={isPending}
      className="h-8 text-xs px-3 hover:bg-destructive/10 hover:text-destructive"
    >
      {isPending ? "Excluindo..." : "Excluir"}
    </Button>
  );
}

