"use server";

import { isDesktopMode } from "@/lib/desktop";
import {
  applyDesktopHeartbeat,
  evaluateStoredDesktopLicense,
  getOrCreateDesktopCopyId,
  isPackagedDesktop,
  licenseApiBaseUrl,
  markDesktopHeartbeatOffline,
  readDesktopEntitlement,
  shouldCallRemoteLicenseApi,
  shouldHeartbeatNow,
} from "@/lib/desktop-license";
import { verifyLicenseCopy } from "@/lib/license/heartbeat";
import type { LicenseHeartbeatResult } from "@/lib/license/heartbeat";
import type { DesktopLeaseDecision } from "@/lib/license/lease";

const HEARTBEAT_TIMEOUT_MS = 5000;

async function heartbeatOnDomain(
  machineId: string
): Promise<LicenseHeartbeatResult | { status: "offline" }> {
  if (!shouldCallRemoteLicenseApi()) {
    if (isPackagedDesktop() && !licenseApiBaseUrl()) {
      return { status: "offline" };
    }
    return verifyLicenseCopy({ machineId });
  }

  const base = licenseApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/license/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId }),
      cache: "no-store",
      signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS),
    });
    const data = (await res.json()) as LicenseHeartbeatResult;
    if (
      data &&
      typeof data === "object" &&
      (data.status === "active" ||
        data.status === "expired" ||
        data.status === "revoked" ||
        data.status === "unknown")
    ) {
      return data;
    }
    return { status: "offline" };
  } catch {
    return { status: "offline" };
  }
}

export async function refreshDesktopLicenseAccess(options?: {
  force?: boolean;
}): Promise<DesktopLeaseDecision> {
  if (!isDesktopMode()) return { allowed: true, reason: "ok" };

  const local = evaluateStoredDesktopLicense();
  const due = options?.force || shouldHeartbeatNow() || !local.allowed;

  if (!due) return local;

  if (!readDesktopEntitlement() && local.allowed === false && local.reason === "missing") {
    return local;
  }

  const machineId = getOrCreateDesktopCopyId();
  const remote = await heartbeatOnDomain(machineId);

  if (remote.status === "offline") {
    markDesktopHeartbeatOffline();
    return evaluateStoredDesktopLicense();
  }

  return applyDesktopHeartbeat(remote);
}

export async function syncDesktopLicenseHeartbeat(): Promise<DesktopLeaseDecision> {
  return refreshDesktopLicenseAccess({ force: true });
}
