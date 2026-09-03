export const FRESH_DESKTOP_EMAIL = "eu@local";
export const FRESH_DESKTOP_NAME = "Usuário";
export const DESKTOP_WORKSPACE_NAME = "Meu workspace";

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export const DESKTOP_USER_EMAIL =
  readEnv("DESKTOP_USER_EMAIL") || FRESH_DESKTOP_EMAIL;

export function isDesktopMode(): boolean {
  return (
    process.env.DESKTOP_MODE === "true" ||
    process.env.NEXT_PUBLIC_DESKTOP_MODE === "true"
  );
}
