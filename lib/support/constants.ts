export const SUPPORT_MAX_BODY = 2000;
export const SUPPORT_MAX_MESSAGES_PER_THREAD = 200;
export const SUPPORT_DEFAULT_HISTORY_DAYS = 30;
export const SUPPORT_CUSTOMER_POLL_MS = 10_000;
export const SUPPORT_ADMIN_THREAD_POLL_MS = 4_000;
export const SUPPORT_ADMIN_LIST_POLL_MS = 12_000;
export const SUPPORT_FETCH_LIMIT = 80;
export const SUPPORT_SEND_MAX_PER_WINDOW = 12;
export const SUPPORT_SEND_WINDOW_MS = 5 * 60 * 1000;
export const SUPPORT_SYNC_MAX_PER_WINDOW = 40;
export const SUPPORT_SYNC_WINDOW_MS = 60 * 1000;

export function supportHistoryDays(): number {
  const raw = process.env.SUPPORT_HISTORY_DAYS?.trim();
  const n = raw ? Number(raw) : SUPPORT_DEFAULT_HISTORY_DAYS;
  if (!Number.isInteger(n) || n < 7 || n > 180) {
    return SUPPORT_DEFAULT_HISTORY_DAYS;
  }
  return n;
}

export function normalizeSupportEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function maskSupportEmail(email: string): string {
  const normalized = normalizeSupportEmail(email);
  const at = normalized.indexOf("@");
  if (at < 1) return "***";
  const user = normalized.slice(0, at);
  const domain = normalized.slice(at);
  const visible = user.slice(0, 1);
  return `${visible}***${domain}`;
}

export function sanitizeSupportBody(raw: string): string | null {
  const body = raw.replace(/\r\n/g, "\n").replace(/\0/g, "").trim();
  if (!body) return null;
  if (body.length > SUPPORT_MAX_BODY) return body.slice(0, SUPPORT_MAX_BODY);
  return body;
}
