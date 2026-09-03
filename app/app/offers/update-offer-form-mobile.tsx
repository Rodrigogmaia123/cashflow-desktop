"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SoftBadge } from "@/components/dashboard/soft-badge";
import { updateOffer } from "./actions";
import { DeleteOfferButtonMobile } from "./delete-offer-button-mobile";

interface UpdateOfferFormMobileProps {
  offerId: string;
  offerName: string;
  offerStatus: string;
  canEdit: boolean;
  canDelete: boolean;
}

function getStatusVariant(status: string): "success" | "warning" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "PAUSED") return "warning";
  return "danger";
}

export function UpdateOfferFormMobile({
  offerId,
  offerName,
  offerStatus,
  canEdit,
  canDelete,
}: UpdateOfferFormMobileProps) {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    await updateOffer(formData);
    router.refresh();
  };

  return (
    <form
      action={handleSubmit}
      className="md:hidden p-4 space-y-3 border-b border-white/5 last:border-b-0"
    >
      <input type="hidden" name="id" value={offerId} />
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <input
            name="name"
            defaultValue={offerName}
            disabled={!canEdit}
            readOnly={!canEdit}
            className={`flex-1 rounded-lg border-0 bg-[#0F131A] px-3 py-2 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder="Nome da oferta"
          />
          <SoftBadge variant={getStatusVariant(offerStatus)}>
            {offerStatus === "ACTIVE" ? "Ativa" : offerStatus === "PAUSED" ? "Pausada" : "Morta"}
          </SoftBadge>
        </div>
        <select
          name="status"
          defaultValue={offerStatus}
          disabled={!canEdit}
          className={`w-full rounded-lg border-0 bg-[#0F131A] px-3 py-2 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <option value="ACTIVE" className="bg-card">Ativa</option>
          <option value="PAUSED" className="bg-card">Pausada</option>
          <option value="DEAD" className="bg-card">Morta</option>
        </select>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Link href={`/app/offers/${offerId}`} className="flex-1">
          <Button type="button" size="sm" variant="ghost" className="w-full hover:bg-primary/10 hover:text-primary">
            Abrir
          </Button>
        </Link>
        {canEdit && (
          <Button type="submit" size="sm" variant="ghost" className="flex-1 hover:bg-primary/10 hover:text-primary">
            Salvar
          </Button>
        )}
        {canDelete && (
          <DeleteOfferButtonMobile offerId={offerId} offerName={offerName} />
        )}
      </div>
    </form>
  );
}

