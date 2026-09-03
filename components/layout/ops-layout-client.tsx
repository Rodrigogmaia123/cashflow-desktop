"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileAvatarButton } from "./mobile-avatar-button";
import { OpsSidebar } from "./ops-sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

type OpsLayoutClientProps = {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string;
  userImage?: string | null;
};

export function OpsLayoutClient({
  children,
  userName,
  userEmail,
  userImage,
}: OpsLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="h-10 w-10"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Operação
        </span>
        <MobileAvatarButton
          name={userName}
          email={userEmail}
          image={userImage}
          showProfile={false}
        />
      </header>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 border-r border-white/5"
        >
          <SheetTitle className="sr-only">Menu de operação</SheetTitle>
          <OpsSidebar
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            variant="mobile"
            onLinkClick={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden lg:block">
          <OpsSidebar
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            variant="desktop"
          />
        </div>
        <main className="flex-1 h-screen overflow-y-auto bg-background-secondary scrollbar-thin">
          <div className="lg:pt-0 pt-14">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
