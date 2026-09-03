"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SoftBadge } from "@/components/dashboard/soft-badge";
import { updateOffer } from "./actions";
import { DeleteOfferButton } from "./delete-offer-button";

interface UpdateOfferFormProps {
  offerId: string;
  offerName: string;
  offerStatus: string;
  workspaceId: string;
  createdAt: Date;
  canEdit: boolean;
  canDelete: boolean;
}

function getStatusVariant(status: string): "success" | "warning" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "PAUSED") return "warning";
  return "danger";
}

export function UpdateOfferForm({
  offerId,
  offerName,
  offerStatus,
  workspaceId,
  createdAt,
  canEdit,
  canDelete,
}: UpdateOfferFormProps) {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    await updateOffer(formData);
    router.refresh();
  };

  return (
    <form
      action={handleSubmit}
      className="hidden md:grid grid-cols-5 items-center gap-4 px-6 py-4 text-xs sm:text-sm transition-colors hover:bg-white/5"
    >
      <input type="hidden" name="id" value={offerId} />
      <input
        name="name"
        defaultValue={offerName}
        disabled={!canEdit}
        readOnly={!canEdit}
        className={`w-full rounded-lg border-0 bg-[#0F131A] px-3 py-2 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      <div className="flex items-center gap-2">
        <select
          name="status"
          defaultValue={offerStatus}
          disabled={!canEdit}
          className={`w-full rounded-lg border-0 bg-[#0F131A] px-3 py-2 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <option value="ACTIVE" className="bg-card">Ativa</option>
          <option value="PAUSED" className="bg-card">Pausada</option>
          <option value="DEAD" className="bg-card">Morta</option>
        </select>
        <div className="flex-shrink-0">
          <SoftBadge variant={getStatusVariant(offerStatus)}>
            {offerStatus === "ACTIVE" ? "Ativa" : offerStatus === "PAUSED" ? "Pausada" : "Morta"}
          </SoftBadge>
        </div>
      </div>
      <span className="truncate text-xs text-muted-foreground font-medium">
        {workspaceId.slice(0, 8)}...
      </span>
      <span className="text-xs text-muted-foreground">
        {createdAt.toISOString().split("T")[0]}
      </span>
      <div className="flex items-center justify-end gap-2">
        <Link href={`/app/offers/${offerId}`}>
          <Button type="button" size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_8px_rgba(139,92,246,0.15)]">
            Abrir
          </Button>
        </Link>
        {canEdit && (
          <Button type="submit" size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_8px_rgba(139,92,246,0.15)]">
            Salvar
          </Button>
        )}
        {canDelete && (
          <DeleteOfferButton offerId={offerId} offerName={offerName} />
        )}
      </div>
    </form>
  );
}

