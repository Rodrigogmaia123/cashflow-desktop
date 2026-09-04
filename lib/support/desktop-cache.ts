import fs from "fs";
import path from "path";
import { isDesktopMode } from "@/lib/desktop";
import { desktopDataDir } from "@/lib/desktop-license";
import type { SupportMessageDTO, SupportThreadStatus } from "./types";

const FILE = "support-cache.json";

export type DesktopSupportAuth = {
  serial?: string;
  email?: string;
};

export type DesktopPendingMessage = {
  localId: string;
  body: string;
  createdAt: string;
};

export type DesktopSupportCache = {
  auth: DesktopSupportAuth;
  emailMasked: string | null;
  status: SupportThreadStatus;
  historyDays: number;
  messages: SupportMessageDTO[];
  pending: DesktopPendingMessage[];
};

const EMPTY: DesktopSupportCache = {
  auth: {},
  emailMasked: null,
  status: "open",
  historyDays: 30,
  messages: [],
  pending: [],
};

function cachePath(): string | null {
  if (!isDesktopMode()) return null;
  const dir = desktopDataDir();
  if (!dir) return null;
  return path.join(dir, FILE);
}

export function readDesktopSupportCache(): DesktopSupportCache {
  const file = cachePath();
  if (!file || !fs.existsSync(file)) return { ...EMPTY, pending: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as DesktopSupportCache;
    return {
      auth: {
        serial: parsed.auth?.serial?.trim() || undefined,
        email: parsed.auth?.email?.trim() || undefined,
      },
      emailMasked: parsed.emailMasked ?? null,
      status: parsed.status === "resolved" || parsed.status === "archived" ? parsed.status : "open",
      historyDays: parsed.historyDays || 30,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
    };
  } catch {
    return { ...EMPTY, pending: [] };
  }
}

export function writeDesktopSupportCache(data: DesktopSupportCache) {
  const file = cachePath();
  const dir = desktopDataDir();
  if (!file || !dir) return;
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

export function mergeDesktopSupportSnapshot(
  cache: DesktopSupportCache,
  snapshot: {
    emailMasked: string;
    status: SupportThreadStatus;
    historyDays: number;
    messages: SupportMessageDTO[];
  }
): DesktopSupportCache {
  const ids = new Set(snapshot.messages.map((m) => m.id));
  const pending = cache.pending.filter((item) => {
    return !snapshot.messages.some(
      (message) => message.author === "customer" && message.body === item.body
    );
  });
  return {
    ...cache,
    emailMasked: snapshot.emailMasked,
    status: snapshot.status,
    historyDays: snapshot.historyDays,
    messages: snapshot.messages,
    pending: pending.filter((item) => !ids.has(item.localId)),
  };
}
