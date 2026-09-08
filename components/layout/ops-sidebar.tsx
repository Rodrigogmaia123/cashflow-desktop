import { SidebarLink } from "./sidebar-link";
import { AvatarDropdown } from "./avatar-dropdown";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

type OpsSidebarProps = {
  userName?: string | null;
  userEmail?: string;
  userImage?: string | null;
  variant?: "desktop" | "mobile";
  onLinkClick?: () => void;
};

export function OpsSidebar({
  userName,
  userEmail,
  userImage,
  variant = "desktop",
  onLinkClick,
}: OpsSidebarProps) {
  const isMobile = variant === "mobile";

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-white/5 bg-background-secondary",
        isMobile ? "w-full h-full" : "w-64 h-screen flex-shrink-0"
      )}
    >
      <div
        className={cn(
          "border-b border-white/5 flex-shrink-0",
          isMobile ? "px-4 py-4" : "px-6 py-5"
        )}
      >
        <div className="flex items-center gap-2">
          <BrandMark size={32} />
          <div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Cashflow
            </span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Operação
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4 text-sm scrollbar-thin">
        <div className="space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operação
          </div>
          <SidebarLink
            href="/app/admin"
            label="Painel"
            exact
            onClick={onLinkClick}
          />
          <SidebarLink
            href="/app/admin/financeiro"
            label="Financeiro"
            onClick={onLinkClick}
          />
          <SidebarLink
            href="/app/admin/support"
            label="Suporte"
            onClick={onLinkClick}
          />
        </div>
      </nav>

      <div
        className={cn(
          "border-t border-white/5 bg-card/50 flex-shrink-0",
          isMobile ? "px-3 py-3" : "px-4 py-4"
        )}
      >
        <AvatarDropdown
          name={userName}
          email={userEmail}
          image={userImage}
          showProfile={false}
        />
      </div>
    </aside>
  );
}
