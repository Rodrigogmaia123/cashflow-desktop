import { WorkspaceSelector } from "@/components/workspace/workspace-selector";
import { SidebarLink } from "./sidebar-link";
import { OnboardingTrigger } from "@/components/onboarding/onboarding-trigger";
import { AvatarDropdown } from "./avatar-dropdown";
import { NotificationBadge } from "@/components/notifications/notification-badge";
import { cn } from "@/lib/utils";
import { isFeatureComingSoon } from "@/lib/plans/feature-status";
import type { Feature } from "@/lib/plans/features";
import { isDesktopMode } from "@/lib/desktop";
import type { DesktopEdition } from "@/lib/desktop-edition";
import { desktopProductName } from "@/lib/desktop-edition";
import { QuickCaptureTrigger } from "@/components/quick-capture/quick-capture-trigger";

type NavItem = { href: string; label: string; editions?: DesktopEdition[] };

const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", editions: ["pro"] },
  { href: "/app/overview", label: "Visão geral" },
  { href: "/app/offers", label: "Ofertas", editions: ["pro"] },
  { href: "/app/cashflow", label: "Fluxo de caixa" },
  { href: "/app/plans", label: "Projetos" },
  { href: "/app/budgets", label: "Orçamentos" },
  { href: "/app/reports", label: "Relatórios" },
  { href: "/app/notifications", label: "Notificações" },
];

const SETTINGS_NAV_ITEMS: NavItem[] = [
  { href: "/app/workspaces", label: "Workspaces" },
  { href: "/app/settings/fees", label: "Taxas do workspace", editions: ["pro"] },
  { href: "/app/settings/exchange-rates", label: "Câmbio" },
  { href: "/app/settings/categories", label: "Categorias" },
  { href: "/app/settings/fee-profiles", label: "Perfis de taxas", editions: ["pro"] },
];

const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { href: "/app/billing", label: "Assinatura" },
];

function visibleForEdition(item: NavItem, edition: DesktopEdition) {
  if (!item.editions) return true;
  return item.editions.includes(edition);
}

export type SidebarProps = {
  workspaceName?: string | null;
  userName?: string | null;
  userEmail?: string;
  userImage?: string | null;
  workspaces?: Array<{ id: string; name: string }>;
  activeWorkspaceId?: string | null;
  isAdmin?: boolean;
  userPlan?: "FREE" | "PRO" | "BUSINESS";
  variant?: "desktop" | "mobile";
  onLinkClick?: () => void;
  edition?: DesktopEdition;
};

const BUSINESS_NAV_ITEMS_BASE: { href: string; label: string; feature?: Feature }[] = [
  { href: "/app/settings/api", label: "API", feature: "api_access" },
  { href: "/app/settings/team", label: "Equipe" },
  { href: "/app/settings/reports", label: "Relatórios" },
  { href: "/app/support", label: "Suporte" },
];

export function Sidebar({ 
  workspaceName, 
  userName, 
  userEmail, 
  userImage, 
  workspaces = [], 
  activeWorkspaceId, 
  isAdmin = false,
  userPlan = "FREE",
  variant = "desktop",
  onLinkClick,
  edition = "pro",
}: SidebarProps) {
  const isMobile = variant === "mobile";
  const productName = desktopProductName(edition);
  const mainItems = MAIN_NAV_ITEMS.filter((item) => visibleForEdition(item, edition));
  const settingsItems = SETTINGS_NAV_ITEMS.filter((item) => visibleForEdition(item, edition));
  const accountItems = ACCOUNT_NAV_ITEMS.filter((item) => visibleForEdition(item, edition));
  
  return (
    <aside className={cn(
      "flex flex-col border-r border-white/5 bg-background-secondary",
      isMobile ? "w-full h-full" : "w-64 h-screen flex-shrink-0"
    )}>
      {/* Header - Logo */}
      <div className={cn(
        "border-b border-white/5 flex-shrink-0",
        isMobile ? "px-4 py-4" : "px-6 py-5"
      )} data-tour="sidebar-header">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {productName}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4 text-sm scrollbar-thin">
        <div className="px-0 pb-3">
          <QuickCaptureTrigger />
        </div>
        <div className="space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navegação
          </div>
          {mainItems.map((item) => (
            <SidebarLink 
              key={item.href} 
              href={item.href} 
              label={item.label}
              onClick={onLinkClick}
            />
          ))}
        </div>
        <div className="space-y-1 pt-4">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Configurações
          </div>
          {settingsItems.map((item) => (
            <SidebarLink 
              key={item.href} 
              href={item.href} 
              label={item.label}
              onClick={onLinkClick}
            />
          ))}
        </div>
        {userPlan === "BUSINESS" && !isDesktopMode() && (
          <div className="space-y-1 pt-4">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Business
            </div>
            {BUSINESS_NAV_ITEMS_BASE.map((item) => {
              const badge = item.feature && isFeatureComingSoon(item.feature) ? "Em breve" : undefined;
              return (
                <SidebarLink 
                  key={item.href} 
                  href={item.href} 
                  label={item.label}
                  badge={badge}
                  onClick={onLinkClick}
                />
              );
            })}
          </div>
        )}
        {!isDesktopMode() && (
        <div className="space-y-1 pt-4">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Conta
          </div>
          {accountItems.map((item) => (
            <SidebarLink 
              key={item.href} 
              href={item.href} 
              label={item.label}
              onClick={onLinkClick}
            />
          ))}
          {isAdmin && (
            <SidebarLink 
              href="/app/admin" 
              label="Admin"
              onClick={onLinkClick}
            />
          )}
        </div>
        )}
      </nav>

      {/* Footer - Fixed (Workspace + Avatar) */}
      <div className={cn(
        "border-t border-white/5 space-y-3 bg-card/50 flex-shrink-0",
        isMobile ? "px-3 py-3" : "px-4 py-4"
      )} data-tour="workspace-selector">
        {workspaces.length > 0 && (
          <WorkspaceSelector
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId ?? null}
          />
        )}
        <AvatarDropdown
          name={userName}
          email={userEmail}
          image={userImage}
        />
        <OnboardingTrigger className="w-full justify-start" />
      </div>
    </aside>
  );
}


