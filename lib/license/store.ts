import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ensureSqliteSchemaOnce } from "@/lib/sqlite-schema-compat";
import type { LicenseDuration, LicenseEdition } from "@/lib/prisma-enums";
import {
  decryptSerial,
  encryptSerial,
  generateSerial,
  hashSerial,
} from "./serial";
import {
  expiresAtFromActivation,
  isLicenseDuration,
  isLicenseEdition,
  LicenseError,
  type LicenseRecord,
} from "./types";

function pendingSerialHash(stripeSessionId: string): string {
  return `pending:${stripeSessionId}`;
}

export function licenseHasIssuedSerial(license: LicenseRecord): boolean {
  return !license.serialHash.startsWith("pending:");
}

type LicenseRow = {
  id: string;
  serialHash: string;
  serialCipher?: string | null;
  serialEmailedAt?: Date | null;
  edition: string;
  duration: string;
  status: string;
  stripeSessionId: string;
  email: string;
  activatedAt: Date | null;
  expiresAt: Date | null;
  machineId: string | null;
  revokedAt?: Date | null;
  revokedByUserId?: string | null;
  revokedByEmail?: string | null;
  revokeReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function asRecord(row: LicenseRow): LicenseRecord {
  if (!isLicenseEdition(row.edition) || !isLicenseDuration(row.duration)) {
    throw new LicenseError("corrupt_license", "Registro de licença inválido.");
  }
  return {
    id: row.id,
    serialHash: row.serialHash,
    edition: row.edition,
    duration: row.duration,
    status: row.status as LicenseRecord["status"],
    stripeSessionId: row.stripeSessionId,
    email: row.email,
    activatedAt: row.activatedAt,
    expiresAt: row.expiresAt,
    machineId: row.machineId,
    serialEmailedAt: row.serialEmailedAt ?? null,
    revokedAt: row.revokedAt ?? null,
    revokedByUserId: row.revokedByUserId ?? null,
    revokedByEmail: row.revokedByEmail ?? null,
    revokeReason: row.revokeReason ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serialFromCipher(cipher: string | null | undefined): string | null {
  if (!cipher) return null;
  try {
    return decryptSerial(cipher);
  } catch {
    return null;
  }
}

function parseMaybeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

async function hydrateRevocation(rows: LicenseRow[]): Promise<LicenseRow[]> {
  if (rows.length === 0) return rows;
  try {
    const extras = await prisma.$queryRaw<
      Array<{
        id: string;
        revokedAt: Date | string | null;
        revokedByUserId: string | null;
        revokedByEmail: string | null;
        revokeReason: string | null;
      }>
    >`
      SELECT "id", "revokedAt", "revokedByUserId", "revokedByEmail", "revokeReason"
      FROM "License"
      WHERE "id" IN (${Prisma.join(rows.map((row) => row.id))})
    `;
    const byId = new Map(extras.map((row) => [row.id, row]));
    return rows.map((row) => {
      const extra = byId.get(row.id);
      if (!extra) return row;
      return {
        ...row,
        revokedAt: parseMaybeDate(extra.revokedAt),
        revokedByUserId: extra.revokedByUserId,
        revokedByEmail: extra.revokedByEmail,
        revokeReason: extra.revokeReason,
      };
    });
  } catch {
    return rows;
  }
}

async function toRecord(row: LicenseRow): Promise<LicenseRecord> {
  const [hydrated] = await hydrateRevocation([row]);
  return asRecord(hydrated ?? row);
}

async function toRecords(rows: LicenseRow[]): Promise<LicenseRecord[]> {
  return (await hydrateRevocation(rows)).map(asRecord);
}

export async function findLicenseById(id: string): Promise<LicenseRecord | null> {
  await ensureSqliteSchemaOnce();
  const row = await prisma.license.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function findLicenseByStripeSession(
  stripeSessionId: string
): Promise<LicenseRecord | null> {
  await ensureSqliteSchemaOnce();
  const row = await prisma.license.findUnique({
    where: { stripeSessionId },
  });
  return row ? toRecord(row) : null;
}

export async function findLicenseBySerial(
  serial: string
): Promise<LicenseRecord | null> {
  await ensureSqliteSchemaOnce();
  const row = await prisma.license.findUnique({
    where: { serialHash: hashSerial(serial) },
  });
  return row ? toRecord(row) : null;
}

export async function findLicenseByMachineId(
  machineId: string
): Promise<LicenseRecord | null> {
  await ensureSqliteSchemaOnce();
  const id = machineId.trim();
  if (!id) return null;
  const row = await prisma.license.findFirst({
    where: { machineId: id },
    orderBy: { updatedAt: "desc" },
  });
  return row ? toRecord(row) : null;
}

export async function findLicensesByEmail(
  email: string
): Promise<LicenseRecord[]> {
  const rows = await prisma.license.findMany({
    where: { email: email.trim().toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
  return toRecords(rows);
}

export async function createPaidLicense(input: {
  edition: LicenseEdition;
  duration: LicenseDuration;
  email: string;
  stripeSessionId: string;
}): Promise<{ license: LicenseRecord; serial: string | null; alreadyExisted: boolean }> {
  if (!isLicenseEdition(input.edition) || !isLicenseDuration(input.duration)) {
    throw new LicenseError("invalid_payload", "Edição ou prazo inválido.");
  }

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new LicenseError("invalid_email", "E-mail da compra inválido.");
  }

  const existing = await findLicenseByStripeSession(input.stripeSessionId);
  if (existing) {
    return { license: existing, serial: null, alreadyExisted: true };
  }

  try {
    const row = await prisma.license.create({
      data: {
        serialHash: pendingSerialHash(input.stripeSessionId),
        edition: input.edition,
        duration: input.duration,
        status: "paid",
        stripeSessionId: input.stripeSessionId,
        email,
        activatedAt: null,
        expiresAt: null,
        machineId: null,
      },
    });

    return { license: asRecord(row), serial: null, alreadyExisted: false };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "P2002") {
      const raced = await findLicenseByStripeSession(input.stripeSessionId);
      if (raced) return { license: raced, serial: null, alreadyExisted: true };
    }
    throw error;
  }
}

/** Chave criada no admin, sem Stripe. O prazo só começa na ativação. */
export async function createAdminIssuedLicense(input: {
  edition: LicenseEdition;
  duration: LicenseDuration;
  email: string;
}): Promise<{ license: LicenseRecord; serial: string }> {
  await ensureSqliteSchemaOnce();

  if (!isLicenseEdition(input.edition) || !isLicenseDuration(input.duration)) {
    throw new LicenseError("invalid_payload", "Edição ou prazo inválido.");
  }

  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new LicenseError("invalid_email", "E-mail da chave inválido.");
  }

  const serial = generateSerial();
  const stripeSessionId = `admin:${crypto.randomUUID()}`;

  try {
    const row = await prisma.license.create({
      data: {
        serialHash: hashSerial(serial),
        serialCipher: encryptSerial(serial),
        edition: input.edition,
        duration: input.duration,
        status: "paid",
        stripeSessionId,
        email,
        activatedAt: null,
        expiresAt: null,
        machineId: null,
      },
    });

    return { license: asRecord(row), serial };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "P2002") {
      throw new LicenseError(
        "serial_collision",
        "Não foi possível gerar a chave. Tente de novo."
      );
    }
    throw error;
  }
}

export async function issueLicenseSerial(
  licenseId: string
): Promise<{ license: LicenseRecord; serial: string | null; alreadyIssued: boolean }> {
  await ensureSqliteSchemaOnce();
  const row = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!row) {
    throw new LicenseError("not_found", "Licença não encontrada.");
  }

  const license = asRecord(row);
  if (licenseHasIssuedSerial(license)) {
    return {
      license,
      serial: serialFromCipher(row.serialCipher),
      alreadyIssued: true,
    };
  }

  const serial = generateSerial();
  const updated = await prisma.license.updateMany({
    where: { id: licenseId, serialHash: license.serialHash },
    data: {
      serialHash: hashSerial(serial),
      serialCipher: encryptSerial(serial),
    },
  });

  if (updated.count === 0) {
    const raced = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!raced) {
      throw new LicenseError("not_found", "Licença não encontrada.");
    }
    return {
      license: asRecord(raced),
      serial: serialFromCipher(raced.serialCipher),
      alreadyIssued: true,
    };
  }

  const issued = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!issued) {
    throw new LicenseError("not_found", "Licença não encontrada.");
  }
  return { license: asRecord(issued), serial, alreadyIssued: false };
}

export async function markLicenseSerialEmailed(
  id: string,
  at = new Date()
): Promise<LicenseRecord> {
  const row = await prisma.license.update({
    where: { id },
    data: { serialEmailedAt: at },
  });
  return toRecord(row);
}

export async function listLicenses(input?: {
  query?: string;
  email?: string;
  take?: number;
}): Promise<LicenseRecord[]> {
  await ensureSqliteSchemaOnce();
  const take = Math.min(Math.max(input?.take ?? 50, 1), 100);
  const query = (input?.query ?? input?.email ?? "").trim();

  if (query) {
    try {
      const bySerial = await findLicenseBySerial(query);
      if (bySerial) return [bySerial];
    } catch (error) {
      if (!(error instanceof LicenseError) || error.code !== "invalid_serial") {
        throw error;
      }
    }
  }

  const email = query.toLowerCase();
  const rows = await prisma.license.findMany({
    where: email ? { email: { contains: email } } : undefined,
    orderBy: { createdAt: "desc" },
    take,
  });
  return toRecords(rows);
}

export async function markLicenseActivated(input: {
  serial: string;
  machineId: string;
  activatedAt?: Date;
}): Promise<LicenseRecord> {
  const machineId = input.machineId.trim();
  if (!machineId) {
    throw new LicenseError("missing_machine", "Cópia do app não identificada.");
  }

  const license = await findLicenseBySerial(input.serial);
  if (!license) {
    throw new LicenseError("not_found", "Serial não encontrado.");
  }
  if (license.status === "revoked") {
    throw new LicenseError("revoked", "Esta chave foi revogada.");
  }
  if (license.status === "expired") {
    throw new LicenseError("expired", "Esta chave expirou.");
  }

  if (license.status === "active") {
    if (license.machineId === machineId) {
      return license;
    }
    throw new LicenseError(
      "bound_other_copy",
      "Este serial já está ativo em outra cópia."
    );
  }

  if (license.status !== "paid") {
    throw new LicenseError("invalid_status", "Esta chave não pode ser ativada.");
  }

  const activatedAt = input.activatedAt ?? new Date();
  const expiresAt = expiresAtFromActivation(activatedAt, license.duration);
  const updated = await prisma.license.updateMany({
    where: { id: license.id, status: "paid" },
    data: {
      status: "active",
      machineId,
      activatedAt,
      expiresAt,
    },
  });

  if (updated.count === 0) {
    const raced = await findLicenseById(license.id);
    if (raced?.status === "active" && raced.machineId === machineId) {
      return raced;
    }
    if (raced?.status === "active") {
      throw new LicenseError(
        "bound_other_copy",
        "Este serial já está ativo em outra cópia."
      );
    }
    throw new LicenseError("invalid_status", "Esta chave não pode ser ativada.");
  }

  const row = await prisma.license.findUnique({ where: { id: license.id } });
  if (!row) {
    throw new LicenseError("not_found", "Licença não encontrada.");
  }
  return toRecord(row);
}

export async function markLicenseRevoked(
  id: string,
  input?: {
    reason?: string;
    actorUserId?: string;
    actorEmail?: string;
  }
): Promise<LicenseRecord> {
  const license = await findLicenseById(id);
  if (!license) {
    throw new LicenseError("not_found", "Licença não encontrada.");
  }
  if (license.status === "revoked") return license;

  const reason = input?.reason?.trim().slice(0, 500) || null;
  const actorEmail = input?.actorEmail?.trim().toLowerCase() || null;
  const actorUserId = input?.actorUserId?.trim() || null;
  const revokedAt = new Date();

  await prisma.license.update({
    where: { id },
    data: { status: "revoked" },
  });

  await prisma.$executeRaw`
    UPDATE "License"
    SET
      "revokedAt" = ${revokedAt.toISOString()},
      "revokedByUserId" = ${actorUserId},
      "revokedByEmail" = ${actorEmail},
      "revokeReason" = ${reason},
      "updatedAt" = ${revokedAt.toISOString()}
    WHERE "id" = ${id}
  `;

  const row = await prisma.license.findUnique({ where: { id } });
  if (!row) {
    throw new LicenseError("not_found", "Licença não encontrada.");
  }
  return toRecord(row);
}

export async function markLicenseExpired(id: string): Promise<LicenseRecord> {
  const license = await findLicenseById(id);
  if (!license) {
    throw new LicenseError("not_found", "Licença não encontrada.");
  }
  if (license.duration === "lifetime") {
    throw new LicenseError(
      "lifetime",
      "Chave vitalícia não expira. Use revogação."
    );
  }
  if (license.status === "revoked") {
    throw new LicenseError("revoked", "Esta chave já foi revogada.");
  }
  if (license.status === "expired") return license;

  const row = await prisma.license.update({
    where: { id },
    data: { status: "expired" },
  });
  return toRecord(row);
}
