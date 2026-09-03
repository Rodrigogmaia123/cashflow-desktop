import type { LicenseEdition } from "@/lib/prisma-enums";

function readUrl(key: string): string | null {
  const raw =
    process.env[key]?.trim() || process.env[`NEXT_PUBLIC_${key}`]?.trim() || "";
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3456"
  );
}

/** Sempre devolve um link. CDN via env; senão o download do próprio site. */
export function installerUrlForEdition(edition: LicenseEdition): string {
  const fromEnv =
    edition === "pessoal"
      ? readUrl("LICENSE_INSTALLER_PESSOAL_URL")
      : readUrl("LICENSE_INSTALLER_PRO_URL");
  if (fromEnv) return fromEnv;
  const slug = edition === "pessoal" ? "pessoal" : "pro";
  return `${appBaseUrl()}/download/${slug}`;
}
