import { NextRequest, NextResponse } from "next/server";
import { fulfillAndDeliverPixTransaction } from "@/lib/license/confirm-pix";
import {
  findLicenseOrderByPixId,
  markLicenseOrderCanceled,
} from "@/lib/license/orders";
import {
  getPushinPayTransaction,
  isPushinCanceled,
  isPushinPaid,
} from "@/lib/payments/pushinpay";
import {
  parsePushinWebhookText,
  webhookBodyPreview,
} from "@/lib/payments/pushinpay-webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function webhookAuthorized(req: NextRequest) {
  const expected = process.env.PUSHINPAY_WEBHOOK_SECRET?.trim();
  if (!expected) return process.env.NODE_ENV !== "production";
  const headerName = (
    process.env.PUSHINPAY_WEBHOOK_HEADER?.trim() || "x-pushinpay-token"
  ).toLowerCase();
  const got =
    req.headers.get(headerName) ||
    req.headers.get("x-pushinpay-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  return got === expected;
}

function isKnownPushinStatus(status: string) {
  const normalized = status.toLowerCase();
  return (
    isPushinPaid(normalized) ||
    isPushinCanceled(normalized) ||
    normalized === "created" ||
    normalized === "pending" ||
    normalized === "expired"
  );
}

async function resolvePixOrderId(candidates: string[]) {
  for (const id of candidates) {
    if (!id) continue;
    const order = await findLicenseOrderByPixId(id);
    if (order) return { id, order };
  }
  const first = candidates.find(Boolean) ?? "";
  return {
    id: first,
    order: first ? await findLicenseOrderByPixId(first) : null,
  };
}

export async function POST(req: NextRequest) {
  if (!webhookAuthorized(req)) {
    console.error("[webhook/pushinpay] header de autenticação não bateu");
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  let rawText = "";
  try {
    rawText = await req.text();
  } catch (error) {
    console.error("[webhook/pushinpay] falha ao ler o body", error);
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parsePushinWebhookText(rawText, contentType);
  const resolved = await resolvePixOrderId(parsed.ids.length ? parsed.ids : [parsed.id]);
  let id = resolved.id;
  let status = parsed.status;
  let value = parsed.value;

  if (!id) {
    console.error("[webhook/pushinpay] body sem id", {
      contentType,
      bytes: rawText.length,
      preview: webhookBodyPreview(rawText),
    });
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!parsed.id || !isKnownPushinStatus(status)) {
    console.error("[webhook/pushinpay] payload atípico, consultando API", {
      id,
      contentType,
      bytes: rawText.length,
      parsedStatus: status || "(vazio)",
      preview: webhookBodyPreview(rawText),
    });
    try {
      const tx = await getPushinPayTransaction(id);
      if (tx) {
        id = tx.id;
        status = tx.status;
        value = tx.value;
      }
    } catch (error) {
      console.error("[webhook/pushinpay] consulta de recuperação", id, error);
    }
  }

  const order = resolved.order ?? (await findLicenseOrderByPixId(id));
  if (!order) {
    return NextResponse.json({ ok: true, ignored: "unknown_transaction" });
  }

  if (isPushinCanceled(status)) {
    try {
      await markLicenseOrderCanceled({
        stripeSessionId: order.stripeSessionId,
        email: order.email,
      });
    } catch (error) {
      console.error("[webhook/pushinpay] cancel", id, error);
    }
    return NextResponse.json({ ok: true });
  }

  if (!isPushinPaid(status)) {
    return NextResponse.json({ ok: true, ignored: "not_paid" });
  }

  try {
    const result = await fulfillAndDeliverPixTransaction(
      {
        id,
        status: "paid",
        value: value ?? order.amountCents,
      },
      order
    );
    console.log("[webhook/pushinpay]", id, result);
  } catch (error) {
    console.error("[webhook/pushinpay] fulfill", id, error);
    return NextResponse.json({ error: "Falha ao registrar a licença" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
