import { prisma } from "@/lib/db";
import { ensureSqliteSchemaOnce } from "@/lib/sqlite-schema-compat";
import { findLicensesByEmail, listLicenses } from "@/lib/license/store";
import { editionLabel } from "@/lib/license/catalog";
import { isLicenseEdition } from "@/lib/license/types";
import {
  maskSupportEmail,
  sanitizeSupportBody,
  SUPPORT_FETCH_LIMIT,
  SUPPORT_MAX_MESSAGES_PER_THREAD,
  supportHistoryDays,
} from "./constants";
import type {
  SupportAuthor,
  SupportCustomerSnapshot,
  SupportMessageDTO,
  SupportThreadDTO,
  SupportThreadStatus,
} from "./types";

function asStatus(value: string): SupportThreadStatus {
  if (value === "resolved" || value === "archived") return value;
  return "open";
}

function asAuthor(value: string): SupportAuthor {
  return value === "admin" ? "admin" : "customer";
}

function previewOf(body: string): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  return oneLine.length > 120 ? `${oneLine.slice(0, 117)}…` : oneLine;
}

function toMessageDTO(row: {
  id: string;
  author: string;
  body: string;
  createdAt: Date;
}): SupportMessageDTO {
  return {
    id: row.id,
    author: asAuthor(row.author),
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

async function pruneExpiredHistory(now = new Date()) {
  const days = supportHistoryDays();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const expired = await prisma.supportThread.findMany({
    where: {
      resolvedAt: { not: null, lt: cutoff },
      status: { not: "archived" },
    },
    select: { id: true },
    take: 40,
  });
  if (expired.length === 0) return;

  for (const thread of expired) {
    await prisma.$transaction([
      prisma.supportMessage.deleteMany({ where: { threadId: thread.id } }),
      prisma.supportThread.update({
        where: { id: thread.id },
        data: {
          status: "archived",
          archivedAt: now,
          lastPreview: `Histórico removido após ${days} dias.`,
          lastAuthor: null,
          unreadAdmin: 0,
          unreadCustomer: 0,
        },
      }),
    ]);
  }
}

async function trimThread(threadId: string) {
  const extra = await prisma.supportMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    skip: SUPPORT_MAX_MESSAGES_PER_THREAD,
    select: { id: true },
  });
  if (extra.length === 0) return;
  await prisma.supportMessage.deleteMany({
    where: { id: { in: extra.map((row) => row.id) } },
  });
}

async function loadMessages(threadId: string): Promise<SupportMessageDTO[]> {
  const rows = await prisma.supportMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    take: SUPPORT_FETCH_LIMIT,
  });
  return rows.reverse().map(toMessageDTO);
}

async function editionsLabelForEmail(email: string): Promise<string> {
  const licenses = await findLicensesByEmail(email);
  const labels = [
    ...new Set(
      licenses.map((license) =>
        isLicenseEdition(license.edition)
          ? editionLabel(license.edition)
          : license.edition
      )
    ),
  ];
  return labels.join(" · ") || "Licença";
}

export async function customerSnapshot(
  email: string
): Promise<SupportCustomerSnapshot> {
  await ensureSqliteSchemaOnce();
  await pruneExpiredHistory();

  const thread = await prisma.supportThread.findUnique({
    where: { email },
  });

  if (!thread) {
    return {
      ok: true,
      emailMasked: maskSupportEmail(email),
      status: "open",
      resolvedAt: null,
      historyDays: supportHistoryDays(),
      messages: [],
    };
  }

  if (thread.unreadCustomer > 0) {
    await prisma.supportThread.update({
      where: { id: thread.id },
      data: { unreadCustomer: 0 },
    });
  }

  return {
    ok: true,
    emailMasked: maskSupportEmail(email),
    status: asStatus(thread.status),
    resolvedAt: thread.resolvedAt?.toISOString() ?? null,
    historyDays: supportHistoryDays(),
    messages: await loadMessages(thread.id),
  };
}

export async function appendSupportMessage(input: {
  email: string;
  author: SupportAuthor;
  body: string;
}): Promise<SupportCustomerSnapshot | { threadId: string; message: SupportMessageDTO }> {
  await ensureSqliteSchemaOnce();
  await pruneExpiredHistory();

  const body = sanitizeSupportBody(input.body);
  if (!body) {
    throw new Error("empty");
  }

  const now = new Date();
  const existing = await prisma.supportThread.findUnique({
    where: { email: input.email },
  });

  const thread = existing
    ? await prisma.supportThread.update({
        where: { id: existing.id },
        data: {
          status: "open",
          lastMessageAt: now,
          lastPreview: previewOf(body),
          lastAuthor: input.author,
          resolvedAt: null,
          archivedAt: null,
          unreadAdmin:
            input.author === "customer" ? existing.unreadAdmin + 1 : 0,
          unreadCustomer:
            input.author === "admin" ? existing.unreadCustomer + 1 : 0,
          updatedAt: now,
        },
      })
    : await prisma.supportThread.create({
        data: {
          email: input.email,
          status: "open",
          lastMessageAt: now,
          lastPreview: previewOf(body),
          lastAuthor: input.author,
          unreadAdmin: input.author === "customer" ? 1 : 0,
          unreadCustomer: input.author === "admin" ? 1 : 0,
          updatedAt: now,
        },
      });

  const message = await prisma.supportMessage.create({
    data: {
      threadId: thread.id,
      author: input.author,
      body,
    },
  });

  await trimThread(thread.id);

  if (input.author === "customer") {
    return customerSnapshot(input.email);
  }

  return { threadId: thread.id, message: toMessageDTO(message) };
}

export async function listSupportThreads(): Promise<SupportThreadDTO[]> {
  await ensureSqliteSchemaOnce();
  await pruneExpiredHistory();

  const rows = await prisma.supportThread.findMany({
    where: { lastMessageAt: { not: null } },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
  });

  const licenses = await listLicenses();
  const editionByEmail = new Map<string, Set<string>>();
  for (const license of licenses) {
    const email = license.email.trim().toLowerCase();
    const set = editionByEmail.get(email) ?? new Set<string>();
    set.add(
      isLicenseEdition(license.edition)
        ? editionLabel(license.edition)
        : license.edition
    );
    editionByEmail.set(email, set);
  }

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    emailMasked: maskSupportEmail(row.email),
    status: asStatus(row.status),
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    lastPreview: row.lastPreview,
    lastAuthor: row.lastAuthor ? asAuthor(row.lastAuthor) : null,
    unreadAdmin: row.unreadAdmin,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    editionsLabel: [...(editionByEmail.get(row.email) ?? [])].join(" · ") || "Licença",
  }));
}

export async function adminThreadSnapshot(threadId: string): Promise<{
  thread: SupportThreadDTO;
  messages: SupportMessageDTO[];
} | null> {
  await ensureSqliteSchemaOnce();
  await pruneExpiredHistory();

  const row = await prisma.supportThread.findUnique({ where: { id: threadId } });
  if (!row) return null;

  if (row.unreadAdmin > 0) {
    await prisma.supportThread.update({
      where: { id: row.id },
      data: { unreadAdmin: 0 },
    });
    row.unreadAdmin = 0;
  }

  return {
    thread: {
      id: row.id,
      email: row.email,
      emailMasked: maskSupportEmail(row.email),
      status: asStatus(row.status),
      lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
      lastPreview: row.lastPreview,
      lastAuthor: row.lastAuthor ? asAuthor(row.lastAuthor) : null,
      unreadAdmin: 0,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      editionsLabel: await editionsLabelForEmail(row.email),
    },
    messages: await loadMessages(row.id),
  };
}

export async function resolveSupportThread(threadId: string): Promise<boolean> {
  await ensureSqliteSchemaOnce();
  const row = await prisma.supportThread.findUnique({ where: { id: threadId } });
  if (!row) return false;

  const now = new Date();
  const body =
    "Este atendimento foi encerrado. Se precisar de novo, envie outra mensagem.";

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        threadId,
        author: "admin",
        body,
      },
    }),
    prisma.supportThread.update({
      where: { id: threadId },
      data: {
        status: "resolved",
        resolvedAt: now,
        lastMessageAt: now,
        lastPreview: previewOf(body),
        lastAuthor: "admin",
        unreadAdmin: 0,
        unreadCustomer: row.unreadCustomer + 1,
        updatedAt: now,
      },
    }),
  ]);

  await trimThread(threadId);
  return true;
}

export async function adminAppendMessage(
  threadId: string,
  body: string
): Promise<{ thread: SupportThreadDTO; messages: SupportMessageDTO[] } | null> {
  const row = await prisma.supportThread.findUnique({ where: { id: threadId } });
  if (!row) return null;
  await appendSupportMessage({
    email: row.email,
    author: "admin",
    body,
  });
  return adminThreadSnapshot(threadId);
}
