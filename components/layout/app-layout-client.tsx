"use client";

import { useState } from "react";
import { MobileHeader } from "./mobile-header";
import { MobileSidebar } from "./mobile-sidebar";
import { Sidebar } from "./sidebar";
import type { SidebarProps } from "./sidebar";
import { QuickCaptureProvider } from "@/components/quick-capture/quick-capture-provider";

type AppLayoutClientProps = SidebarProps & {
  children: React.ReactNode;
};

export function AppLayoutClient({
  children,
  ...sidebarProps
}: AppLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <QuickCaptureProvider>
      {/* Mobile Header - Visível apenas em mobile (fixed) */}
      <MobileHeader
        userName={sidebarProps.userName}
        userEmail={sidebarProps.userEmail}
        userImage={sidebarProps.userImage}
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        {...sidebarProps}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar - Visível apenas em desktop */}
        <div className="hidden lg:block">
          <Sidebar {...sidebarProps} variant="desktop" />
        </div>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto bg-background-secondary scrollbar-thin">
          {/* Mobile: adicionar padding-top para o header fixo */}
          <div className="lg:pt-0 pt-14">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </QuickCaptureProvider>
  );
}

