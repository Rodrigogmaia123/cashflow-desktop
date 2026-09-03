"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { OfferCountryCode } from "@/lib/domain/offer-country";

type MenuState = {
  offerId: string;
  offerName: string;
  offerStatus: "ACTIVE" | "PAUSED" | "DEAD";
  offerCountry: OfferCountryCode | null;
  canEdit: boolean;
  canDelete: boolean;
  anchorRect: DOMRect;
} | null;

type OfferActionsContextType = {
  menu: MenuState;
  openMenu: (
    offerId: string,
    offerName: string,
    offerStatus: "ACTIVE" | "PAUSED" | "DEAD",
    offerCountry: OfferCountryCode | null,
    canEdit: boolean,
    canDelete: boolean,
    anchorElement: HTMLElement
  ) => void;
  closeMenu: () => void;
};

const OfferActionsContext = createContext<OfferActionsContextType | undefined>(undefined);

export function OfferActionsProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuState>(null);

  const openMenu = (
    offerId: string,
    offerName: string,
    offerStatus: "ACTIVE" | "PAUSED" | "DEAD",
    offerCountry: OfferCountryCode | null,
    canEdit: boolean,
    canDelete: boolean,
    anchorElement: HTMLElement
  ) => {
    const rect = anchorElement.getBoundingClientRect();
    setMenu({
      offerId,
      offerName,
      offerStatus,
      offerCountry,
      canEdit,
      canDelete,
      anchorRect: rect
    });
  };

  const closeMenu = () => {
    setMenu(null);
  };

  return (
    <OfferActionsContext.Provider value={{ menu, openMenu, closeMenu }}>
      {children}
    </OfferActionsContext.Provider>
  );
}

export function useOfferActions() {
  const context = useContext(OfferActionsContext);
  if (!context) {
    throw new Error("useOfferActions must be used within OfferActionsProvider");
  }
  return context;
}
