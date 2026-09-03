"use server";

import { isDesktopMode } from "@/lib/desktop";
import { getDesktopEdition } from "@/lib/desktop-edition";
import {
  getOrCreateDesktopCopyId,
  isPackagedDesktop,
  licenseApiBaseUrl,
  saveDesktopEntitlement,
  shouldCallRemoteLicenseApi,
} from "@/lib/desktop-license";
import {
  activateLicenseCopy,
  activationErrorPayload,
} from "@/lib/license/activate";
import type {
  LicenseActivationError,
  LicenseActivationResult,
} from "@/lib/license/types";

export type ActivateDesktopResult =
  | LicenseActivationResult
  | LicenseActivationError;

function offlineError(): LicenseActivationError {
  return {
    ok: false,
    code: "offline",
    message:
      "Precisa de internet nesta hora para ativar a chave no servidor.",
  };
}

async function activateOnDomain(input: {
  serial: string;
  machineId: string;
  edition: string;
}): Promise<ActivateDesktopResult> {
  if (!shouldCallRemoteLicenseApi()) {
    if (isPackagedDesktop() && !licenseApiBaseUrl()) {
      return {
        ok: false,
        code: "no_server",
        message:
          "Este instalador ainda não sabe o endereço do servidor de licença.",
      };
    }
    try {
      return await activateLicenseCopy(input);
    } catch (error) {
      return activationErrorPayload(error);
    }
  }

  const base = licenseApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/license/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as ActivateDesktopResult;
    if (data && typeof data === "object" && "ok" in data) return data;
    return {
      ok: false,
      code: "error",
      message: "Resposta inválida do servidor de licença.",
    };
  } catch {
    return offlineError();
  }
}

export async function activateDesktopLicense(
  serial: string
): Promise<ActivateDesktopResult> {
  if (!isDesktopMode()) {
    return {
      ok: false,
      code: "not_desktop",
      message: "A ativação da chave é no programa instalado.",
    };
  }

  const machineId = getOrCreateDesktopCopyId();
  const result = await activateOnDomain({
    serial,
    machineId,
    edition: getDesktopEdition(),
  });

  if (result.ok) {
    saveDesktopEntitlement(machineId, result);
  }

  return result;
}
