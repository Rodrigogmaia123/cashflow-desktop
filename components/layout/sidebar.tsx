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
  { href: "/app/anotacoes", label: "Anotações" },
  { href: "/app/reports", label: "Relatórios" },
  { href: "/app/notifications", label: "Notificações" },
  { href: "/app/support", label: "Suporte" },
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
  desktopMode?: boolean;
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
  desktopMode = false,
}: SidebarProps) {
  const isMobile = variant === "mobile";
  const productName = desktopProductName(edition);
  const editionBadge = edition === "pessoal" ? "PESSOAL" : "PRO";
  const mainItems = MAIN_NAV_ITEMS.filter((item) => visibleForEdition(item, edition)).filter(
    (item) => item.href !== "/app/support" || desktopMode
  );
  const settingsItems = SETTINGS_NAV_ITEMS.filter((item) => visibleForEdition(item, edition));
  const accountItems = ACCOUNT_NAV_ITEMS.filter((item) => visibleForEdition(item, edition));
  
  return (
    <aside className={cn(
      "flex flex-col border-r border-white/10 bg-background-secondary",
      isMobile ? "w-full h-full" : "w-[232px] h-screen flex-shrink-0"
    )}>
      <div className={cn(
        "flex-shrink-0",
        isMobile ? "px-3.5 pt-4" : "px-3.5 pt-[18px]"
      )} data-tour="sidebar-header">
        <div className="flex items-center gap-2.5 px-1.5 pb-4 font-display text-[17px] font-semibold text-foreground">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-[15px] font-bold text-accent-foreground">
            C
          </span>
          <span>Cashflow</span>
          <span className="rounded-[5px] border border-primary/40 px-1.5 py-px font-mono text-[10px] font-medium tracking-[0.08em] text-primary">
            {editionBadge}
          </span>
        </div>
        <span className="sr-only">{productName}</span>
        <QuickCaptureTrigger />
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 px-3.5 py-2 text-sm scrollbar-thin">
        <div className="space-y-0.5">
          <div className="px-2 pb-1 pt-3 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
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
          <div className="px-2 pb-1 pt-3 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
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
            <div className="px-2 pb-1 pt-3 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
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
          <div className="px-2 pb-1 pt-3 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
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
        "mt-auto border-t border-white/10 flex-shrink-0 space-y-2",
        isMobile ? "px-3.5 py-3" : "px-3.5 pb-4 pt-3"
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
        <OnboardingTrigger className="h-auto w-full justify-start px-2 py-0 text-[11px] font-normal text-muted hover:bg-transparent hover:text-foreground" />
      </div>
    </aside>
  );
}


