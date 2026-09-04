import {
  findLicenseByMachineId,
  findLicenseBySerial,
  findLicensesByEmail,
} from "@/lib/license/store";
import { normalizeSupportEmail } from "./constants";

export type SupportProof = {
  machineId?: string;
  serial?: string;
  email?: string;
};

export type SupportCustomer = {
  email: string;
};

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function resolveSupportCustomer(
  proof: SupportProof
): Promise<SupportCustomer | null> {
  const machineId = proof.machineId?.trim() ?? "";
  if (machineId) {
    const license = await findLicenseByMachineId(machineId);
    if (license?.email) {
      return { email: normalizeSupportEmail(license.email) };
    }
  }

  const serial = proof.serial?.trim() ?? "";
  if (serial) {
    const license = await findLicenseBySerial(serial);
    if (license?.email) {
      return { email: normalizeSupportEmail(license.email) };
    }
  }

  const email = proof.email ? normalizeSupportEmail(proof.email) : "";
  if (email && looksLikeEmail(email)) {
    const licenses = await findLicensesByEmail(email);
    if (licenses.length > 0) {
      return { email };
    }
  }

  return null;
}
