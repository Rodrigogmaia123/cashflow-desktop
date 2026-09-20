const UUID_RE =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

export type ParsedPushinWebhook = {
  id: string;
  value: number | null;
  status: string;
  ids: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function pickValue(record: Record<string, unknown> | null) {
  if (!record) return null;
  const raw = record.value ?? record.amount ?? record.amount_cents;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceJson(value: unknown, depth = 0): unknown {
  if (depth > 3) return value;
  if (typeof value === "string") {
    const trimmed = stripBom(value).trim();
    if (!trimmed) return value;
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      try {
        return coerceJson(JSON.parse(trimmed), depth + 1);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (Array.isArray(value) && value.length === 1) {
    return coerceJson(value[0], depth + 1);
  }
  return value;
}

function stripBom(text: string) {
  return text.replace(/^\uFEFF/, "");
}

function formToObject(params: URLSearchParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of params.entries()) {
    const nested = key.match(/^([A-Za-z0-9_]+)\[([A-Za-z0-9_]+)\]$/);
    if (nested) {
      const parent = nested[1];
      const child = nested[2];
      const current = asRecord(out[parent]) ?? {};
      current[child] = value;
      out[parent] = current;
      continue;
    }
    out[key] = value;
  }
  return out;
}

function looksLikeForm(text: string, contentType: string) {
  if (contentType.includes("application/x-www-form-urlencoded")) return true;
  if (contentType.includes("application/json")) return false;
  if (text.startsWith("{") || text.startsWith("[")) return false;
  return /^\w+=/.test(text);
}

function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function extractPushinIds(raw: string): string[] {
  return [...new Set(raw.match(UUID_RE) ?? [])];
}

export function parsePushinWebhook(
  body: unknown
): Omit<ParsedPushinWebhook, "ids"> {
  const root = asRecord(coerceJson(body));
  const nested =
    asRecord(root?.data) ??
    asRecord(root?.transaction) ??
    asRecord(root?.payload);
  const id =
    pickString(root, ["id", "transaction_id", "transactionId", "txid"]) ||
    pickString(nested, ["id", "transaction_id", "transactionId", "txid"]);
  const status =
    pickString(root, ["status", "payment_status", "paymentStatus", "state"]) ||
    pickString(nested, ["status", "payment_status", "paymentStatus", "state"]);
  const value = pickValue(root) ?? pickValue(nested);
  return { id, value, status };
}

export function parsePushinWebhookText(
  rawText: string,
  contentType = ""
): ParsedPushinWebhook {
  const text = stripBom(rawText).trim();
  const ids = extractPushinIds(text);
  const type = contentType.toLowerCase();

  if (!text) {
    return { id: "", value: null, status: "", ids };
  }

  let parsed: unknown = null;

  if (looksLikeForm(text, type)) {
    parsed = formToObject(new URLSearchParams(text));
  } else {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = extractJsonObject(text);
      if (parsed == null && text.includes("=")) {
        parsed = formToObject(new URLSearchParams(text));
      }
    }
  }

  const fields = parsePushinWebhook(parsed);
  return {
    id: fields.id || ids[0] || "",
    value: fields.value,
    status: fields.status,
    ids: fields.id ? [fields.id, ...ids.filter((id) => id !== fields.id)] : ids,
  };
}

export function webhookBodyPreview(rawText: string) {
  return stripBom(rawText).replace(/\s+/g, " ").trim().slice(0, 220);
}
