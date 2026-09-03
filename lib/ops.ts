import { isDesktopMode } from "@/lib/desktop";

/** Site (domínio): operação. Desktop: produto Cashflow. */
export function isOpsSite(): boolean {
  return !isDesktopMode();
}

export function postAuthAppPath(user: { isAdmin: boolean } | null | undefined): string {
  if (isOpsSite() && user?.isAdmin) return "/app/admin";
  return "/app/overview";
}

/** Rotas da dash de operação (admin no site). */
export function isOpsShellPath(pathname: string): boolean {
  return pathname === "/app/admin" || pathname.startsWith("/app/admin/");
}
