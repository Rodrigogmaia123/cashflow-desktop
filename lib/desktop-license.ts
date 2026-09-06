import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { isDesktopMode } from "@/lib/desktop";
import type { LicenseActivationResult } from "@/lib/license/types";
import {
  evaluateDesktopLease,
  LICENSE_HEARTBEAT_INTERVAL_MS,
  type DesktopLeaseDecision,
  type LicenseCloudStatus,
} from "@/lib/license/lease";
import type { LicenseHeartbeatResult } from "@/lib/license/heartbeat";

const COPY_FILE = "license-copy.json";

export type DesktopEntitlement = Omit<LicenseActivationResult, "ok"> & {
  lastYesAt: string;
  lastCheckAt: string | null;
  lastCloudStatus: LicenseCloudStatus;
};

export type DesktopLicenseFile = {
  machineId: string;
  entitlement: DesktopEntitlement | null;
  lockReason?: DesktopLeaseDecision["reason"] | null;
};

function sqliteFileFromUrl(url: string): string | null {
  if (!url.startsWith("file:")) return null;
  const raw = url.slice("file:".length);
  if (path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)) return raw;
  return path.resolve(process.cwd(), "prisma", raw);
}

export function desktopDataDir(): string | null {
  if (!isDesktopMode()) return null;
  const file = sqliteFileFromUrl(process.env.DATABASE_URL ?? "");
  if (!file) return null;
  return path.dirname(file);
}

function copyFilePath(): string | null {
  const dir = desktopDataDir();
  if (!dir) return null;
  return path.join(dir, COPY_FILE);
}

function normalizeEntitlement(
  raw: DesktopLicenseFile["entitlement"] | (Omit<LicenseActivationResult, "ok"> & Partial<DesktopEntitlement>) | null
): DesktopEntitlement | null {
  if (!raw?.activatedAt) return null;
  return {
    lifetime: Boolean(raw.lifetime),
    expiresAt: raw.expiresAt ?? null,
    activatedAt: raw.activatedAt,
    edition: raw.edition,
    duration: raw.duration,
    validUntilLabel: raw.validUntilLabel,
    lastYesAt: raw.lastYesAt || raw.activatedAt,
    lastCheckAt: raw.lastCheckAt ?? null,
    lastCloudStatus: raw.lastCloudStatus ?? "active",
  };
}

function readCopyFile(): DesktopLicenseFile | null {
  const file = copyFilePath();
  if (!file || !fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as DesktopLicenseFile;
    if (!parsed?.machineId || typeof parsed.machineId !== "string") return null;
    return {
      machineId: parsed.machineId.trim(),
      entitlement: normalizeEntitlement(parsed.entitlement),
      lockReason: parsed.lockReason ?? null,
    };
  } catch {
    return null;
  }
}

function writeCopyFile(data: DesktopLicenseFile) {
  const file = copyFilePath();
  const dir = desktopDataDir();
  if (!file || !dir) {
    throw new Error("Pasta de dados do app não encontrada.");
  }
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

export function getOrCreateDesktopCopyId(): string {
  const existing = readCopyFile();
  if (existing?.machineId) return existing.machineId;
  const machineId = randomUUID();
  writeCopyFile({ machineId, entitlement: null, lockReason: null });
  return machineId;
}

export function readDesktopLicenseFile(): DesktopLicenseFile | null {
  return readCopyFile();
}

export function readDesktopEntitlement(): DesktopEntitlement | null {
  return readCopyFile()?.entitlement ?? null;
}

export function evaluateStoredDesktopLicense(
  now = new Date()
): DesktopLeaseDecision {
  if (!isDesktopMode()) return { allowed: true, reason: "ok" };
  return evaluateDesktopLease(readDesktopEntitlement(), now);
}

export function hasActiveDesktopLicense(): boolean {
  return evaluateStoredDesktopLicense().allowed;
}

export function saveDesktopEntitlement(
  machineId: string,
  result: LicenseActivationResult
) {
  const current = getOrCreateDesktopCopyId();
  if (current !== machineId) {
    throw new Error("Esta cópia do app não bate com a ativação.");
  }
  const now = new Date().toISOString();
  const { ok: _ok, ...rest } = result;
  writeCopyFile({
    machineId: current,
    lockReason: null,
    entitlement: {
      ...rest,
      lastYesAt: now,
      lastCheckAt: now,
      lastCloudStatus: "active",
    },
  });
}

export function applyDesktopHeartbeat(
  result: LicenseHeartbeatResult
): DesktopLeaseDecision {
  const current = readCopyFile();
  const machineId = current?.machineId || getOrCreateDesktopCopyId();
  const now = new Date().toISOString();

  if (result.status === "active") {
    const { ok: _ok, status: _status, ...rest } = result;
    writeCopyFile({
      machineId,
      lockReason: null,
      entitlement: {
        ...rest,
        lastYesAt: now,
        lastCheckAt: now,
        lastCloudStatus: "active",
      },
    });
    return { allowed: true, reason: "ok" };
  }

  writeCopyFile({
    machineId,
    entitlement: null,
    lockReason: result.status,
  });
  return { allowed: false, reason: result.status };
}

export function markDesktopHeartbeatOffline() {
  const current = readCopyFile();
  if (!current?.entitlement) return;
  writeCopyFile({
    ...current,
    entitlement: {
      ...current.entitlement,
      lastCheckAt: new Date().toISOString(),
    },
  });
}

export function shouldHeartbeatNow(now = new Date()): boolean {
  const entitlement = readDesktopEntitlement();
  if (!entitlement) return false;
  if (!entitlement.lastCheckAt) return true;
  const last = Date.parse(entitlement.lastCheckAt);
  if (!Number.isFinite(last)) return true;
  return now.getTime() - last >= LICENSE_HEARTBEAT_INTERVAL_MS;
}

export function licenseApiBaseUrl(): string {
  const fromEnv = (
    process.env.LICENSE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_LICENSE_API_BASE_URL ||
    ""
  ).replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (isPackagedDesktop()) return "https://getcashflow.pro";
  return "";
}

function isLoopback(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "127.0.0.1" || host === "localhost";
  } catch {
    return false;
  }
}

export function shouldCallRemoteLicenseApi() {
  const base = licenseApiBaseUrl();
  if (!base) return false;
  if (isLoopback(base)) return false;
  if (licenseApiIsThisProcess(base)) return false;
  return true;
}

function licenseApiIsThisProcess(base: string) {
  try {
    const remote = new URL(base);
    const selfPort = String(process.env.PORT || "").trim();
    if (!selfPort) return false;
    const host = remote.hostname;
    const local =
      host === "127.0.0.1" || host === "localhost" || host === "::1";
    if (!local) return false;
    const remotePort = remote.port || (remote.protocol === "https:" ? "443" : "80");
    return remotePort === selfPort;
  } catch {
    return false;
  }
}

export function isPackagedDesktop() {
  return process.env.CASHFLOW_PACKAGED === "true";
}
