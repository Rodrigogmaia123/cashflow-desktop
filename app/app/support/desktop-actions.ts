"use server";

import { randomUUID } from "crypto";
import { isDesktopMode } from "@/lib/desktop";
import {
  getOrCreateDesktopCopyId,
  isPackagedDesktop,
  licenseApiBaseUrl,
  readDesktopEntitlement,
  shouldCallRemoteLicenseApi,
} from "@/lib/desktop-license";
import { resolveSupportCustomer, type SupportProof } from "@/lib/support/identity";
import {
  appendSupportMessage,
  customerSnapshot,
} from "@/lib/support/store";
import {
  mergeDesktopSupportSnapshot,
  readDesktopSupportCache,
  writeDesktopSupportCache,
  type DesktopSupportCache,
} from "@/lib/support/desktop-cache";
import type {
  SupportCustomerError,
  SupportCustomerSnapshot,
} from "@/lib/support/types";

export type DesktopSupportView = {
  ok: true;
  offline: boolean;
  emailMasked: string | null;
  status: SupportCustomerSnapshot["status"];
  historyDays: number;
  messages: SupportCustomerSnapshot["messages"];
  pending: { localId: string; body: string; createdAt: string }[];
  needsProof: boolean;
};

function viewFromCache(
  cache: DesktopSupportCache,
  extra?: { offline?: boolean; needsProof?: boolean }
): DesktopSupportView {
  return {
    ok: true,
    offline: extra?.offline ?? false,
    emailMasked: cache.emailMasked,
    status: cache.status,
    historyDays: cache.historyDays,
    messages: cache.messages,
    pending: cache.pending,
    needsProof: extra?.needsProof ?? false,
  };
}

function usableSerial(value?: string): string | undefined {
  const serial = value?.trim() ?? "";
  if (serial.length < 10) return undefined;
  return serial;
}

function localProof(): SupportProof {
  const cache = readDesktopSupportCache();
  const activated = Boolean(readDesktopEntitlement());
  return {
    machineId: activated ? getOrCreateDesktopCopyId() : undefined,
    serial: usableSerial(cache.auth.serial),
    email: cache.auth.email,
  };
}

function hasProof(proof: SupportProof): boolean {
  return Boolean(proof.machineId || proof.serial?.trim() || proof.email?.trim());
}

async function callCloud(
  path: "/api/support/sync" | "/api/support/send",
  payload: Record<string, unknown>
): Promise<SupportCustomerSnapshot | SupportCustomerError | { ok: false; code: "offline"; message: string }> {
  if (!shouldCallRemoteLicenseApi()) {
    if (isPackagedDesktop() && !licenseApiBaseUrl()) {
      return {
        ok: false,
        code: "offline",
        message: "Sem endereço do servidor de suporte.",
      };
    }
    const proof = payload as SupportProof;
    const customer = await resolveSupportCustomer(proof);
    if (!customer) {
      return {
        ok: false,
        code: "not_found",
        message:
          "Não achamos uma compra com esses dados. Use o e-mail do pagamento ou a chave.",
      };
    }
    if (path === "/api/support/send") {
      try {
        const result = await appendSupportMessage({
          email: customer.email,
          author: "customer",
          body: String(payload.body ?? ""),
        });
        if ("ok" in result && result.ok) return result;
        return customerSnapshot(customer.email);
      } catch (error) {
        if (error instanceof Error && error.message === "empty") {
          return { ok: false, code: "empty", message: "Escreva uma mensagem." };
        }
        throw error;
      }
    }
    return customerSnapshot(customer.email);
  }

  const base = licenseApiBaseUrl();
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as SupportCustomerSnapshot | SupportCustomerError;
    if (data && typeof data === "object" && "ok" in data) return data;
    return { ok: false, code: "offline", message: "Resposta inválida do servidor." };
  } catch {
    return {
      ok: false,
      code: "offline",
      message: "Sem internet agora. A mensagem fica guardada neste PC.",
    };
  }
}

function applySnapshot(snapshot: SupportCustomerSnapshot): DesktopSupportView {
  const next = mergeDesktopSupportSnapshot(readDesktopSupportCache(), snapshot);
  writeDesktopSupportCache(next);
  return viewFromCache(next, { offline: false, needsProof: false });
}

async function flushPending(proof: SupportProof): Promise<DesktopSupportView | null> {
  const cache = readDesktopSupportCache();
  if (cache.pending.length === 0) return null;
  let latest: DesktopSupportView | null = null;
  for (const item of cache.pending) {
    const result = await callCloud("/api/support/send", { ...proof, body: item.body });
    if (!result.ok) {
      if (result.code === "offline") {
        return viewFromCache(readDesktopSupportCache(), { offline: true });
      }
      break;
    }
    latest = applySnapshot(result);
  }
  return latest;
}

export async function desktopSupportState(): Promise<DesktopSupportView> {
  if (!isDesktopMode()) {
    return {
      ok: true,
      offline: false,
      emailMasked: null,
      status: "open",
      historyDays: 30,
      messages: [],
      pending: [],
      needsProof: true,
    };
  }

  const proof = localProof();
  if (!hasProof(proof)) {
    return viewFromCache(readDesktopSupportCache(), { needsProof: true });
  }

  const flushed = await flushPending(proof);
  if (flushed?.offline) return flushed;

  const result = await callCloud("/api/support/sync", proof);
  if (!result.ok) {
    if (result.code === "offline") {
      return viewFromCache(readDesktopSupportCache(), { offline: true });
    }
    if (result.code === "not_found") {
      return viewFromCache(readDesktopSupportCache(), { needsProof: true });
    }
    return viewFromCache(readDesktopSupportCache(), { offline: false });
  }
  return applySnapshot(result);
}

export async function desktopSupportUnlock(input: {
  serial?: string;
  email?: string;
}): Promise<DesktopSupportView & { error?: string }> {
  if (!isDesktopMode()) {
    return { ...(await desktopSupportState()), error: "Só no programa instalado." };
  }
  const cache = readDesktopSupportCache();
  writeDesktopSupportCache({
    ...cache,
    auth: {
      serial: usableSerial(input.serial) || cache.auth.serial,
      email: input.email?.trim().toLowerCase() || cache.auth.email,
    },
  });
  const view = await desktopSupportState();
  if (view.needsProof) {
    return {
      ...view,
      error:
        "Não achamos uma compra com esses dados. Use o e-mail do pagamento ou a chave.",
    };
  }
  return view;
}

export async function desktopSupportSend(
  body: string
): Promise<DesktopSupportView & { error?: string }> {
  if (!isDesktopMode()) {
    return { ...(await desktopSupportState()), error: "Só no programa instalado." };
  }

  const text = body.trim();
  if (!text) {
    return { ...(await desktopSupportState()), error: "Escreva uma mensagem." };
  }

  const cache = readDesktopSupportCache();
  const pendingItem = {
    localId: randomUUID(),
    body: text,
    createdAt: new Date().toISOString(),
  };
  writeDesktopSupportCache({
    ...cache,
    pending: [...cache.pending, pendingItem],
  });

  const proof = localProof();
  if (!hasProof(proof)) {
    return viewFromCache(readDesktopSupportCache(), { needsProof: true });
  }

  const result = await callCloud("/api/support/send", { ...proof, body: text });
  if (!result.ok) {
    if (result.code === "offline") {
      return viewFromCache(readDesktopSupportCache(), { offline: true });
    }
    const rolled = readDesktopSupportCache();
    writeDesktopSupportCache({
      ...rolled,
      pending: rolled.pending.filter((item) => item.localId !== pendingItem.localId),
    });
    return {
      ...viewFromCache(readDesktopSupportCache()),
      error: result.message,
    };
  }
  return applySnapshot(result);
}
