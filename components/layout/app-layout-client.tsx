"use client";

import { useEffect, useState } from "react";
import { MobileHeader } from "./mobile-header";
import { MobileSidebar } from "./mobile-sidebar";
import { Sidebar } from "./sidebar";
import type { SidebarProps } from "./sidebar";
import { DesktopUpdateBanner } from "@/components/desktop/desktop-update-banner";
import { ReleaseNotesDialog } from "@/components/release-notes/release-notes-dialog";
import { QuickCaptureProvider } from "@/components/quick-capture/quick-capture-provider";

type AppLayoutClientProps = SidebarProps & {
  children: React.ReactNode;
  appVersion: string;
  announceUpdates: boolean;
};

export function AppLayoutClient({
  children,
  appVersion,
  announceUpdates,
  ...sidebarProps
}: AppLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("cf-app");
    return () => document.documentElement.classList.remove("cf-app");
  }, []);

  return (
    <QuickCaptureProvider>
      <ReleaseNotesDialog version={appVersion} enabled={announceUpdates} />
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

      <div className="cf-app flex h-screen overflow-hidden">
        {/* Desktop Sidebar - Visível apenas em desktop */}
        <div className="hidden lg:block">
          <Sidebar {...sidebarProps} variant="desktop" />
        </div>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto scrollbar-thin">
          {/* Mobile: adicionar padding-top para o header fixo */}
          <div className="lg:pt-0 pt-14">
            <div className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:px-9 lg:py-7">
              {sidebarProps.desktopMode ? <DesktopUpdateBanner /> : null}
              {children}
            </div>
          </div>
        </main>
      </div>
    </QuickCaptureProvider>
  );
}

