import {
  appInstallerVersion,
  installerMacUrlForEdition,
  installerUrlForEdition,
} from "@/lib/license/installers";
import type { LicenseEdition } from "@/lib/prisma-enums";

export type DesktopUpdatePlatform = "win" | "mac";

export type DesktopLatestPayload = {
  version: string;
  notes: string;
  downloads: {
    win: Record<LicenseEdition, string>;
    mac: Record<LicenseEdition, string>;
  };
};

export type DesktopUpdateCheck =
  | {
      available: false;
    }
  | {
      available: true;
      currentVersion: string;
      latestVersion: string;
      notes: string;
      downloadUrl: string;
    };

function parseVersionParts(value: string): number[] {
  const core = value.trim().replace(/^v/i, "").split("-")[0] ?? "";
  return core.split(".").map((part) => {
    const n = Number.parseInt(part, 10);
    return Number.isFinite(n) ? n : 0;
  });
}

export function isDesktopVersionNewer(latest: string, current: string): boolean {
  const a = parseVersionParts(latest);
  const b = parseVersionParts(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return false;
}

export function installedDesktopVersion(): string {
  return process.env.DESKTOP_APP_VERSION?.trim() || appInstallerVersion();
}

export function desktopLatestNotes(): string {
  return (
    process.env.DESKTOP_LATEST_NOTES?.trim() ||
    "Baixe e instale por cima da versão atual. Seus dados e a licença permanecem no computador."
  );
}

export function desktopLatestVersion(): string {
  return process.env.DESKTOP_LATEST_VERSION?.trim() || appInstallerVersion();
}

function toPublicDownloadUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") {
      parsed.protocol = "https:";
      parsed.host = "getcashflow.pro";
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export function buildDesktopLatestPayload(): DesktopLatestPayload {
  return {
    version: desktopLatestVersion(),
    notes: desktopLatestNotes(),
    downloads: {
      win: {
        pro: toPublicDownloadUrl(installerUrlForEdition("pro")),
        pessoal: toPublicDownloadUrl(installerUrlForEdition("pessoal")),
      },
      mac: {
        pro: toPublicDownloadUrl(installerMacUrlForEdition("pro")),
        pessoal: toPublicDownloadUrl(installerMacUrlForEdition("pessoal")),
      },
    },
  };
}

export function parseDesktopLatestPayload(
  data: unknown
): DesktopLatestPayload | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Partial<DesktopLatestPayload>;
  if (typeof raw.version !== "string" || !raw.version.trim()) return null;
  if (!raw.downloads || typeof raw.downloads !== "object") return null;
  const win = raw.downloads.win;
  const mac = raw.downloads.mac;
  if (!win || typeof win.pro !== "string" || typeof win.pessoal !== "string") {
    return null;
  }
  if (!mac || typeof mac.pro !== "string" || typeof mac.pessoal !== "string") {
    return null;
  }
  return {
    version: raw.version.trim(),
    notes:
      typeof raw.notes === "string" && raw.notes.trim()
        ? raw.notes.trim()
        : desktopLatestNotes(),
    downloads: {
      win: { pro: win.pro, pessoal: win.pessoal },
      mac: { pro: mac.pro, pessoal: mac.pessoal },
    },
  };
}

export function desktopUpdatePlatform(): DesktopUpdatePlatform {
  return process.platform === "darwin" ? "mac" : "win";
}
