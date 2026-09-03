"use client";

import { Menu } from "lucide-react";
import { MobileAvatarButton } from "./mobile-avatar-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDesktopEdition } from "@/components/desktop/edition-provider";
import { desktopProductName } from "@/lib/desktop-edition";
import { QuickCaptureTrigger } from "@/components/quick-capture/quick-capture-trigger";

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
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft">
          <svg
            className="h-4 w-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
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

