"use client";

import { useRef } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfferCountryCode } from "@/lib/domain/offer-country";
import { useOfferActions } from "./offer-actions-context";

type Props = {
  offerId: string;
  offerName: string;
  offerStatus: "ACTIVE" | "PAUSED" | "DEAD";
  offerCountry: OfferCountryCode | null;
  canEdit: boolean;
  canDelete: boolean;
};

export function OfferActionsTrigger({
  offerId,
  offerName,
  offerStatus,
  offerCountry,
  canEdit,
  canDelete
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { openMenu } = useOfferActions();

  if (!canEdit && !canDelete) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (triggerRef.current) {
      openMenu(
        offerId,
        offerName,
        offerStatus,
        offerCountry,
        canEdit,
        canDelete,
        triggerRef.current
      );
    }
  };

  return (
    <Button
      ref={triggerRef}
      type="button"
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 hover:bg-muted"
      onClick={handleClick}
    >
      <MoreVertical className="h-3.5 w-3.5" />
    </Button>
  );
}
