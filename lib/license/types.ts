import type {
  LicenseDuration,
  LicenseEdition,
  LicenseStatus,
} from "@/lib/prisma-enums";

export const LICENSE_EDITIONS = ["pro", "pessoal"] as const;
export const LICENSE_DURATIONS = ["3m", "5m", "annual", "lifetime"] as const;
export const LICENSE_STATUSES = [
  "paid",
  "active",
  "revoked",
  "expired",
] as const;

export const LICENSE_DURATION_DAYS: Record<
  Exclude<LicenseDuration, "lifetime">,
  number
> = {
  "3m": 90,
  "5m": 150,
  annual: 365,
};

export type LicenseRecord = {
  id: string;
  serialHash: string;
  edition: LicenseEdition;
  duration: LicenseDuration;
  status: LicenseStatus;
  stripeSessionId: string;
  email: string;
  activatedAt: Date | null;
  expiresAt: Date | null;
  machineId: string | null;
  serialEmailedAt: Date | null;
  revokedAt: Date | null;
  revokedByUserId: string | null;
  revokedByEmail: string | null;
  revokeReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LicenseActivationResult = {
  ok: true;
  lifetime: boolean;
  expiresAt: string | null;
  activatedAt: string;
  edition: string;
  duration: string;
  validUntilLabel: string;
};

export type LicenseActivationError = {
  ok: false;
  code: string;
  message: string;
};

export type LicenseReveal =
  | { status: "waiting" }
  | { status: "unpaid" }
  | { status: "invalid" }
  | {
      status: "ready";
      serial: string;
      edition: string;
      duration: string;
      editionLabel: string;
      durationLabel: string;
      installerUrl: string;
      email: string;
      emailed: boolean;
    };

export class LicenseError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "LicenseError";
    this.code = code;
  }
}

export function isLicenseEdition(value: string): value is LicenseEdition {
  return (LICENSE_EDITIONS as readonly string[]).includes(value);
}

export function isLicenseDuration(value: string): value is LicenseDuration {
  return (LICENSE_DURATIONS as readonly string[]).includes(value);
}

export function isLicenseStatus(value: string): value is LicenseStatus {
  return (LICENSE_STATUSES as readonly string[]).includes(value);
}

export function expiresAtFromActivation(
  activatedAt: Date,
  duration: LicenseDuration
): Date | null {
  if (duration === "lifetime") return null;
  const days = LICENSE_DURATION_DAYS[duration];
  const expires = new Date(activatedAt.getTime());
  expires.setUTCDate(expires.getUTCDate() + days);
  return expires;
}
