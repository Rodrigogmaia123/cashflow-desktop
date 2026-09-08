"use client";

import { Menu } from "lucide-react";
import { MobileAvatarButton } from "./mobile-avatar-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDesktopEdition } from "@/components/desktop/edition-provider";
import { desktopProductName } from "@/lib/desktop-edition";
import { QuickCaptureTrigger } from "@/components/quick-capture/quick-capture-trigger";
import { BrandMark } from "@/components/brand/brand-mark";

type MobileHeaderProps = {
  userName?: string | null;
  userEmail?: string;
  userImage?: string | null;
  onMenuClick: () => void;
};

export function MobileHeader({
  userName,
  userEmail,
  userImage,
  onMenuClick,
}: MobileHeaderProps) {
  const productName = desktopProductName(useDesktopEdition());
  return (
    <header
      className={cn(
        "lg:hidden",
        "fixed top-0 left-0 right-0 z-50",
        "h-14 flex items-center justify-between",
        "px-4 border-b border-white/5",
        "bg-background/80 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/60"
      )}
    >
      {/* Botão de Menu */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="h-10 w-10"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <BrandMark size={28} />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {productName}
        </span>
      </div>

      {/* Captura + Avatar */}
      <div className="flex items-center gap-1">
        <QuickCaptureTrigger variant="header" />
        <MobileAvatarButton
          name={userName}
          email={userEmail}
          image={userImage}
        />
      </div>
    </header>
  );
}

