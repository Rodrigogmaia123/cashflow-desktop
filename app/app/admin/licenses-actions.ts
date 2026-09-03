"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDesktopMode } from "@/lib/desktop";
import {
  listLicenses,
  markLicenseRevoked,
  resendLicenseEmail,
  issueAdminLicense,
} from "@/lib/license";
import { editionLabel, licenseDurationLabel } from "@/lib/license/catalog";
import {
  isLicenseDuration,
  isLicenseEdition,
} from "@/lib/license/types";
import { revalidatePath } from "next/cache";

async function requireDomainAdmin() {
  if (isDesktopMode()) return null;
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

export type AdminLicenseRow = {
  id: string;
  email: string;
  editionLabel: string;
  durationLabel: string;
  lifetime: boolean;
  status: string;
  issued: boolean;
  machineId: string | null;
  emailedAt: string | null;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedByEmail: string | null;
  revokeReason: string | null;
};

function formatDate(value: Date | null) {
  if (!value) return null;
  return value.toISOString();
}

function toRow(license: Awaited<ReturnType<typeof listLicenses>>[number]): AdminLicenseRow {
  return {
    id: license.id,
    email: license.email,
    editionLabel: editionLabel(license.edition),
    durationLabel: licenseDurationLabel(license.duration),
    lifetime: license.duration === "lifetime",
    status: license.status,
    issued: !license.serialHash.startsWith("pending:"),
    machineId: license.machineId,
    emailedAt: formatDate(license.serialEmailedAt),
    createdAt: license.createdAt.toISOString(),
    activatedAt: formatDate(license.activatedAt),
    expiresAt: formatDate(license.expiresAt),
    revokedAt: formatDate(license.revokedAt),
    revokedByEmail: license.revokedByEmail,
    revokeReason: license.revokeReason,
  };
}

export async function getAdminLicenses(query?: string): Promise<{
  success: boolean;
  reason?: string;
  data?: AdminLicenseRow[];
}> {
  const admin = await requireDomainAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores do site" };
  }

  const licenses = await listLicenses({ query, take: 80 });
  return {
    success: true,
    data: licenses.map(toRow),
  };
}

export async function resendAdminLicenseEmail(licenseId: string): Promise<{
  success: boolean;
  reason?: string;
}> {
  const admin = await requireDomainAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores do site" };
  }

  const result = await resendLicenseEmail(licenseId);
  if (!result.ok) {
    return { success: false, reason: result.reason ?? "Falha ao reenviar" };
  }

  revalidatePath("/app/admin");
  return { success: true };
}

export async function revokeAdminLicense(
  licenseId: string,
  reason?: string
): Promise<{ success: boolean; reason?: string }> {
  const admin = await requireDomainAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores do site" };
  }

  const license = await markLicenseRevoked(licenseId, {
    reason,
    actorUserId: admin.id,
    actorEmail: admin.email,
  });

  if (license.status !== "revoked") {
    return { success: false, reason: "Não foi possível revogar esta chave." };
  }

  revalidatePath("/app/admin");
  return { success: true };
}

export async function createAdminLicense(input: {
  email: string;
  edition: string;
  duration: string;
  sendEmail: boolean;
}): Promise<{
  success: boolean;
  reason?: string;
  serial?: string;
  emailed?: boolean;
}> {
  const admin = await requireDomainAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores do site" };
  }

  if (!isLicenseEdition(input.edition) || !isLicenseDuration(input.duration)) {
    return { success: false, reason: "Edição ou prazo inválido." };
  }

  const result = await issueAdminLicense({
    email: input.email,
    edition: input.edition,
    duration: input.duration,
    sendEmail: input.sendEmail,
  });

  if (!result.ok) {
    return { success: false, reason: result.reason };
  }

  revalidatePath("/app/admin");
  return {
    success: true,
    serial: result.serial,
    emailed: result.emailed,
  };
}
