import type { LicenseEdition } from "@/lib/prisma-enums";
import { readFileSync } from "fs";
import path from "path";

const GITHUB_INSTALLER_REPO = "Rodrigogmaia123/cashflow-desktop";

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

export function appInstallerVersion(): string {
  try {
    const raw = readFileSync(path.join(process.cwd(), "package.json"), "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version?.trim() || "0.2.0";
  } catch {
    return "0.2.0";
  }
}

export type InstallerPlatform = "win" | "mac";

export function githubInstallerFileName(
  edition: LicenseEdition,
  versioned = false,
  platform: InstallerPlatform = "win"
): string {
  const version = appInstallerVersion();
  const ext = platform === "mac" ? "dmg" : "exe";
  if (edition === "pessoal") {
    return versioned
      ? `Cashflow-Pessoal-Setup-${version}.${ext}`
      : `Cashflow-Pessoal-Setup.${ext}`;
  }
  return versioned
    ? `Cashflow-Pro-Setup-${version}.${ext}`
    : `Cashflow-Pro-Setup.${ext}`;
}

export function githubInstallerAssetUrl(
  edition: LicenseEdition,
  platform: InstallerPlatform = "win"
): string {
  return `https://github.com/${GITHUB_INSTALLER_REPO}/releases/latest/download/${githubInstallerFileName(edition, false, platform)}`;
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

export function installerMacUrlForEdition(edition: LicenseEdition): string {
  const fromEnv =
    edition === "pessoal"
      ? readUrl("LICENSE_INSTALLER_PESSOAL_MAC_URL")
      : readUrl("LICENSE_INSTALLER_PRO_MAC_URL");
  if (fromEnv) return fromEnv;
  const slug = edition === "pessoal" ? "pessoal" : "pro";
  return `${appBaseUrl()}/download/${slug}/mac`;
}
