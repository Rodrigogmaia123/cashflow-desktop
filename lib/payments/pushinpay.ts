const PROD_BASE = "https://api.pushinpay.com.br";
const SANDBOX_BASE = "https://api-sandbox.pushinpay.com.br";

export type PushinPayStatus = "created" | "paid" | "canceled";

export type PushinPayTransaction = {
  id: string;
  status: PushinPayStatus | string;
  value: number;
  qr_code?: string | null;
  qr_code_base64?: string | null;
  end_to_end_id?: string | null;
  payer_name?: string | null;
  payer_national_registration?: string | null;
};

function token() {
  return process.env.PUSHINPAY_TOKEN?.trim() || "";
}

export function pushinPayReady() {
  return token().length > 10;
}

export function pushinPayBaseUrl() {
  const env = process.env.PUSHINPAY_ENV?.trim().toLowerCase();
  if (env === "sandbox") return SANDBOX_BASE;
  return PROD_BASE;
}

async function pushinFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${pushinPayBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    const message =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: unknown }).message)
        : text.slice(0, 240);
    throw new Error(message || `Pushin Pay ${res.status}`);
  }
  return json;
}

export async function createPushinPayPix(input: {
  valueCents: number;
  description: string;
  webhookUrl: string;
}): Promise<PushinPayTransaction> {
  const json = await pushinFetch("/api/pix/cashIn", {
    method: "POST",
    body: JSON.stringify({
      value: input.valueCents,
      description: input.description.slice(0, 255),
      webhook_url: input.webhookUrl,
      split_rules: [],
    }),
  });
  if (!json || typeof json !== "object" || !("id" in json)) {
    throw new Error("Pushin Pay não devolveu a cobrança PIX.");
  }
  return json as PushinPayTransaction;
}

export async function getPushinPayTransaction(
  id: string
): Promise<PushinPayTransaction | null> {
  const json = await pushinFetch(
    `/api/transactions/${encodeURIComponent(id)}`
  );
  if (Array.isArray(json)) return null;
  if (!json || typeof json !== "object" || !("id" in json)) return null;
  return json as PushinPayTransaction;
}

export function isPushinPaid(status: string | null | undefined) {
  return status?.toLowerCase() === "paid";
}

export function isPushinCanceled(status: string | null | undefined) {
  return status?.toLowerCase() === "canceled";
}
