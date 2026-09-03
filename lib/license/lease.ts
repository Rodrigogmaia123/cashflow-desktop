export const DEFAULT_LICENSE_GRACE_DAYS = 7;
export const LICENSE_HEARTBEAT_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type LicenseCloudStatus = "active" | "expired" | "revoked" | "unknown";

export type DesktopLeaseSnapshot = {
  activatedAt: string;
  expiresAt: string | null;
  lifetime: boolean;
  lastYesAt?: string | null;
  lastCloudStatus?: LicenseCloudStatus | null;
};

export type DesktopLeaseDecision =
  | { allowed: true; reason: "ok" | "grace" }
  | {
      allowed: false;
      reason: "missing" | "expired" | "revoked" | "unknown" | "grace_over" | "period_over";
    };

export function licenseGraceDays(): number {
  const raw = process.env.LICENSE_GRACE_DAYS?.trim();
  const n = raw ? Number(raw) : DEFAULT_LICENSE_GRACE_DAYS;
  if (!Number.isInteger(n) || n < 1 || n > 90) return DEFAULT_LICENSE_GRACE_DAYS;
  return n;
}

export function licenseGraceMs(days = licenseGraceDays()): number {
  return days * 24 * 60 * 60 * 1000;
}

export function evaluateDesktopLease(
  lease: DesktopLeaseSnapshot | null | undefined,
  now: Date = new Date(),
  graceMs: number = licenseGraceMs()
): DesktopLeaseDecision {
  if (!lease?.activatedAt) return { allowed: false, reason: "missing" };

  if (lease.lastCloudStatus === "revoked") {
    return { allowed: false, reason: "revoked" };
  }
  if (lease.lastCloudStatus === "expired") {
    return { allowed: false, reason: "expired" };
  }
  if (lease.lastCloudStatus === "unknown") {
    return { allowed: false, reason: "unknown" };
  }

  const lastYesRaw = lease.lastYesAt || lease.activatedAt;
  const lastYes = Date.parse(lastYesRaw);
  if (!Number.isFinite(lastYes)) return { allowed: false, reason: "missing" };
  if (lastYes > now.getTime() + 60_000) {
    return { allowed: false, reason: "missing" };
  }

  if (!lease.lifetime && lease.expiresAt) {
    const expires = Date.parse(lease.expiresAt);
    if (Number.isFinite(expires) && expires <= now.getTime()) {
      return { allowed: false, reason: "period_over" };
    }
  }

  const age = now.getTime() - lastYes;
  if (age > graceMs) {
    return { allowed: false, reason: "grace_over" };
  }

  return { allowed: true, reason: age > LICENSE_HEARTBEAT_INTERVAL_MS ? "grace" : "ok" };
}

export function lockCopyForActivatePage(reason: DesktopLeaseDecision["reason"] | null): string | null {
  switch (reason) {
    case "revoked":
      return "Esta chave foi revogada. Cole outra, ou fale com quem vendeu.";
    case "expired":
    case "period_over":
      return "O prazo desta chave acabou. Compre de novo e cole o serial novo.";
    case "grace_over":
      return "Faz tempo demais sem confirmar a chave. Conecte a internet e tente de novo, ou cole o serial.";
    case "unknown":
      return "Esta cópia não tem uma chave reconhecida no servidor. Cole o serial.";
    default:
      return null;
  }
}
