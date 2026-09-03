export type DesktopEdition = "pro" | "pessoal";

function readEdition(): string {
  return (
    process.env.DESKTOP_EDITION?.trim() ||
    process.env.NEXT_PUBLIC_DESKTOP_EDITION?.trim() ||
    "pro"
  ).toLowerCase();
}

export function getDesktopEdition(): DesktopEdition {
  return readEdition() === "pessoal" ? "pessoal" : "pro";
}

export function isPersonalEdition() {
  return getDesktopEdition() === "pessoal";
}

export function desktopProductName(edition: DesktopEdition = getDesktopEdition()) {
  return edition === "pessoal" ? "Cashflow Pessoal" : "Cashflow Pro";
}

export function isPersonalBlockedPath(pathname: string) {
  return (
    pathname === "/app/offers" ||
    pathname.startsWith("/app/offers/") ||
    pathname === "/app/dashboard" ||
    pathname.startsWith("/app/dashboard/") ||
    pathname === "/app/settings/fees" ||
    pathname.startsWith("/app/settings/fees/") ||
    pathname === "/app/settings/fee-profiles" ||
    pathname.startsWith("/app/settings/fee-profiles/")
  );
}
