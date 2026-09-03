"use client";

import { Sidebar, type SidebarProps } from "./sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

type MobileSidebarProps = Omit<SidebarProps, "variant" | "onLinkClick"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileSidebar({
  open,
  onOpenChange,
  ...sidebarProps
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 border-r border-white/5"
      >
        {/* Título oculto para acessibilidade */}
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <Sidebar
          {...sidebarProps}
          variant="mobile"
          onLinkClick={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

