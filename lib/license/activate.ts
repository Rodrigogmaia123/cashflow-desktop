import { editionLabel } from "./catalog";
import { canonicalizeSerial } from "./serial";
import { findLicenseBySerial, markLicenseActivated } from "./store";
import {
  LicenseError,
  type LicenseActivationResult,
  type LicenseRecord,
} from "./types";
import type { LicenseEdition } from "@/lib/prisma-enums";

export function validUntilLabel(license: LicenseRecord): string {
  if (license.duration === "lifetime" || !license.expiresAt) {
    return "Vitalício";
  }
  const when = license.expiresAt.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `Válido até ${when}`;
}

export function toActivationResult(
  license: LicenseRecord
): LicenseActivationResult {
  const lifetime = license.duration === "lifetime" || license.expiresAt == null;
  return {
    ok: true,
    lifetime,
    expiresAt: license.expiresAt ? license.expiresAt.toISOString() : null,
    activatedAt: (license.activatedAt ?? new Date()).toISOString(),
    edition: license.edition,
    duration: license.duration,
    validUntilLabel: validUntilLabel(license),
  };
}

export async function activateLicenseCopy(input: {
  serial: string;
  machineId: string;
  edition?: string;
}): Promise<LicenseActivationResult> {
  const serial = canonicalizeSerial(input.serial);
  const machineId = input.machineId.trim();
  if (!machineId) {
    throw new LicenseError("missing_machine", "Cópia do app não identificada.");
  }

  const existing = await findLicenseBySerial(serial);
  if (!existing) {
    throw new LicenseError("not_found", "Serial não encontrado.");
  }

  if (input.edition) {
    const expected: LicenseEdition =
      input.edition === "pessoal" ? "pessoal" : "pro";
    if (existing.edition !== expected) {
      throw new LicenseError(
        "edition_mismatch",
        `Esta chave é do ${editionLabel(existing.edition)}, não do ${editionLabel(expected)}.`
      );
    }
  }

  const license = await markLicenseActivated({ serial, machineId });
  return toActivationResult(license);
}

export function activationErrorPayload(error: unknown): {
  ok: false;
  code: string;
  message: string;
} {
  if (error instanceof LicenseError) {
    return { ok: false, code: error.code, message: error.message };
  }
  console.error("[license/activate]", error);
  return {
    ok: false,
    code: "error",
    message: "Não foi possível ativar agora. Tente de novo.",
  };
}
