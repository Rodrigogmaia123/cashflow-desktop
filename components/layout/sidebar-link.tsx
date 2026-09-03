"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

type SidebarLinkProps = {
  href: string;
  label: string;
  iconName?: string;
  badge?: string;
  exact?: boolean;
  onClick?: () => void;
};

// Mapeamento de ícones disponíveis
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
};

export function SidebarLink({ href, label, iconName, badge, exact, onClick }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || (href !== "/app" && pathname.startsWith(href));

  const dataTourAttr = 
    href === "/app/offers" ? { "data-tour": "offers-link" } : 
    href === "/app/cashflow" ? { "data-tour": "cashflow-link" } : 
    href === "/app/overview" ? { "data-tour": "overview-link" } : 
    href === "/app/dashboard" ? { "data-tour": "dashboard-link" } : 
    {};

  const Icon = iconName ? iconMap[iconName.toLowerCase()] : undefined;

  return (
    <Link
      href={href}
      {...dataTourAttr}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
        "min-h-[44px] touch-manipulation", // Mobile-friendly touch target
        isActive
          ? "bg-primary-soft text-primary font-medium"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      {Icon && (
        <Icon className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
      )}
      <span className="relative z-10 flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
          {badge}
        </span>
      )}
      {isActive && (
        <>
          <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-primary shadow-lg shadow-primary/50" />
        </>
      )}
    </Link>
  );
}
