"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDesktopMode } from "@/lib/desktop";
import { allowSupportRate } from "@/lib/support/rate-limit";
import {
  SUPPORT_SEND_MAX_PER_WINDOW,
  SUPPORT_SEND_WINDOW_MS,
} from "@/lib/support/constants";
import {
  adminAppendMessage,
  adminThreadSnapshot,
  listSupportThreads,
  resolveSupportThread,
} from "@/lib/support/store";
import type { SupportMessageDTO, SupportThreadDTO } from "@/lib/support/types";

async function requireDomainAdmin() {
  if (isDesktopMode()) return null;
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

export async function listAdminSupportThreads(): Promise<{
  ok: boolean;
  threads: SupportThreadDTO[];
}> {
  if (!(await requireDomainAdmin())) {
    return { ok: false, threads: [] };
  }
  return { ok: true, threads: await listSupportThreads() };
}

export async function getAdminSupportThread(threadId: string): Promise<{
  ok: boolean;
  thread?: SupportThreadDTO;
  messages?: SupportMessageDTO[];
}> {
  if (!(await requireDomainAdmin())) return { ok: false };
  const snapshot = await adminThreadSnapshot(threadId);
  if (!snapshot) return { ok: false };
  return { ok: true, ...snapshot };
}

export async function sendAdminSupportMessage(
  threadId: string,
  body: string
): Promise<{
  ok: boolean;
  reason?: string;
  thread?: SupportThreadDTO;
  messages?: SupportMessageDTO[];
}> {
  const admin = await requireDomainAdmin();
  if (!admin) return { ok: false, reason: "Sem permissão." };
  if (
    !allowSupportRate(
      `admin-send:${admin.id}`,
      SUPPORT_SEND_MAX_PER_WINDOW,
      SUPPORT_SEND_WINDOW_MS
    )
  ) {
    return { ok: false, reason: "Muitas mensagens seguidas." };
  }
  try {
    const snapshot = await adminAppendMessage(threadId, body);
    if (!snapshot) return { ok: false, reason: "Conversa não encontrada." };
    return { ok: true, ...snapshot };
  } catch (error) {
    if (error instanceof Error && error.message === "empty") {
      return { ok: false, reason: "Escreva uma mensagem." };
    }
    return { ok: false, reason: "Não foi possível enviar." };
  }
}

export async function resolveAdminSupportThread(threadId: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!(await requireDomainAdmin())) return { ok: false, reason: "Sem permissão." };
  const done = await resolveSupportThread(threadId);
  if (!done) return { ok: false, reason: "Conversa não encontrada." };
  return { ok: true };
}
