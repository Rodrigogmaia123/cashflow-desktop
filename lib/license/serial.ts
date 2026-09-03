import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { LicenseError } from "./types";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SERIAL_BODY_LENGTH = 16;

function pepper(): string {
  const secret =
    process.env.LICENSE_HASH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    throw new LicenseError(
      "missing_secret",
      "LICENSE_HASH_SECRET ou NEXTAUTH_SECRET é obrigatório para hashear serial."
    );
  }
  return secret;
}

export { formatSerialInput } from "./serial-format";

export function canonicalizeSerial(input: string): string {
  let compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.startsWith("CF")) compact = compact.slice(2);
  if (compact.length !== SERIAL_BODY_LENGTH) {
    throw new LicenseError("invalid_serial", "Serial inválido.");
  }
  return `CF-${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}`;
}

export function generateSerial(): string {
  const bytes = randomBytes(SERIAL_BODY_LENGTH);
  let body = "";
  for (let i = 0; i < SERIAL_BODY_LENGTH; i += 1) {
    body += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return canonicalizeSerial(body);
}

export function hashSerial(serial: string): string {
  const canonical = canonicalizeSerial(serial);
  return createHash("sha256").update(`${pepper()}:${canonical}`).digest("hex");
}

export function serialHashesMatch(left: string, right: string): boolean {
  try {
    const a = Buffer.from(left, "hex");
    const b = Buffer.from(right, "hex");
    if (a.length !== 32 || a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function cipherKey(): Buffer {
  return createHash("sha256").update(`license-cipher:${pepper()}`).digest();
}

/** Envelope AES-256-GCM. Só o servidor lê; lookup continua pelo hash. */
export function encryptSerial(serial: string): string {
  const canonical = canonicalizeSerial(serial);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cipherKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(canonical, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSerial(blob: string): string {
  try {
    const buf = Buffer.from(blob, "base64");
    if (buf.length < 29) {
      throw new Error("short");
    }
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", cipherKey(), iv);
    decipher.setAuthTag(tag);
    const serial = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
    return canonicalizeSerial(serial);
  } catch {
    throw new LicenseError("corrupt_license", "Não foi possível ler o serial gravado.");
  }
}
