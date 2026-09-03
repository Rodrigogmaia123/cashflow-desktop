import { findLicenseByMachineId, markLicenseExpired } from "./store";
import { toActivationResult } from "./activate";
import type { LicenseActivationResult } from "./types";
import type { LicenseCloudStatus } from "./lease";

export type LicenseHeartbeatResult =
  | (LicenseActivationResult & { status: "active" })
  | { status: "expired" }
  | { status: "revoked" }
  | { status: "unknown" };

export async function verifyLicenseCopy(input: {
  machineId: string;
}): Promise<LicenseHeartbeatResult> {
  const machineId = input.machineId.trim();
  if (!machineId) {
    return { status: "unknown" };
  }

  const license = await findLicenseByMachineId(machineId);
  if (!license) {
    return { status: "unknown" };
  }

  if (license.status === "revoked") {
    return { status: "revoked" };
  }

  if (license.status === "expired") {
    return { status: "expired" };
  }

  if (license.status !== "active") {
    return { status: "unknown" };
  }

  const now = new Date();
  if (
    license.duration !== "lifetime" &&
    license.expiresAt &&
    license.expiresAt.getTime() <= now.getTime()
  ) {
    try {
      await markLicenseExpired(license.id);
    } catch {
      // a resposta ainda é expired
    }
    return { status: "expired" };
  }

  return { status: "active", ...toActivationResult(license) };
}

export function isDeniedCloudStatus(
  status: LicenseCloudStatus | LicenseHeartbeatResult["status"]
): status is Exclude<LicenseCloudStatus, "active"> {
  return status === "expired" || status === "revoked" || status === "unknown";
}
