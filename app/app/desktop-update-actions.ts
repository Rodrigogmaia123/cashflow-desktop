"use server";

import { getDesktopEdition } from "@/lib/desktop-edition";
import { isDesktopMode } from "@/lib/desktop";
import {
  licenseApiBaseUrl,
  shouldCallRemoteLicenseApi,
} from "@/lib/desktop-license";
import {
  desktopUpdatePlatform,
  installedDesktopVersion,
  isDesktopVersionNewer,
  parseDesktopLatestPayload,
  type DesktopUpdateCheck,
} from "@/lib/desktop-update";

const TIMEOUT_MS = 5000;

export async function checkDesktopAppUpdate(): Promise<DesktopUpdateCheck> {
  if (!isDesktopMode() || !shouldCallRemoteLicenseApi()) {
    return { available: false };
  }

  const base = licenseApiBaseUrl();
  const currentVersion = installedDesktopVersion();

  try {
    const res = await fetch(`${base}/api/desktop/latest`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { available: false };

    const latest = parseDesktopLatestPayload(await res.json());
    if (!latest) return { available: false };
    if (!isDesktopVersionNewer(latest.version, currentVersion)) {
      return { available: false };
    }

    const platform = desktopUpdatePlatform();
    const edition = getDesktopEdition();
    const downloadUrl = latest.downloads[platform][edition];
    if (!downloadUrl) return { available: false };

    return {
      available: true,
      currentVersion,
      latestVersion: latest.version,
      notes: latest.notes,
      downloadUrl,
    };
  } catch {
    return { available: false };
  }
}
