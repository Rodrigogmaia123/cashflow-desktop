export const FRESH_DESKTOP_EMAIL = "eu@local";
export const FRESH_DESKTOP_NAME = "Usuário";
export const DESKTOP_WORKSPACE_NAME = "Meu workspace";

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export const DESKTOP_USER_EMAIL =
  readEnv("DESKTOP_USER_EMAIL") || FRESH_DESKTOP_EMAIL;

export function isDesktopMode(): boolean {
  const authUrl = process.env.NEXTAUTH_URL?.trim() || "";
  const listen = (process.env.HOSTNAME || process.env.HOST || "").trim();
  // LP no Dokploy: nunca tratar o site público como o .exe, mesmo se
  // DESKTOP_MODE=true vazar no painel ou no build (NEXT_PUBLIC_*).
  if (/getcashflow\.pro/i.test(authUrl) || listen === "0.0.0.0") {
    return false;
  }

  return (
    process.env.DESKTOP_MODE === "true" ||
    process.env.NEXT_PUBLIC_DESKTOP_MODE === "true"
  );
}
