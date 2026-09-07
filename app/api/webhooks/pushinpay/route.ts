import { NextRequest, NextResponse } from "next/server";
import { trackLicenseFunnel } from "@/lib/ads/meta";
import { getPricedLicenseOffer } from "@/lib/license/catalog";
import { deliverIssuedLicenseById } from "@/lib/license/deliver";
import { fulfillPixLicenseTransaction } from "@/lib/license/fulfill-checkout";
import {
  findLicenseOrderByPixId,
  markLicenseOrderCanceled,
} from "@/lib/license/orders";
import { isPushinCanceled, isPushinPaid } from "@/lib/payments/pushinpay";

export const dynamic = "force-dynamic";

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

function parsePushinWebhook(body: unknown): {
  id: string;
  value: number | null;
  status: string;
} {
  const root = asRecord(body);
  const nested = asRecord(root?.data) ?? asRecord(root?.transaction);
  const id =
    pickString(root, ["id", "transaction_id", "transactionId"]) ||
    pickString(nested, ["id", "transaction_id", "transactionId"]);
  const status =
    pickString(root, ["status"]) || pickString(nested, ["status"]);
  const rawValue = root?.value ?? nested?.value;
  const value =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string" && rawValue.trim()
        ? Number(rawValue)
        : null;
  return { id, value: Number.isFinite(value) ? value : null, status };
}

export async function POST(req: NextRequest) {
  if (!webhookAuthorized(req)) {
    console.error("[webhook/pushinpay] header de autenticação não bateu");
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const body = parsePushinWebhook(raw);
  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "id ausente" }, { status: 400 });
  }

  const order = await findLicenseOrderByPixId(id);
  if (!order) {
    return NextResponse.json({ ok: true, ignored: "unknown_transaction" });
  }

  if (isPushinCanceled(body.status)) {
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

  if (!isPushinPaid(body.status)) {
    return NextResponse.json({ ok: true, ignored: "not_paid" });
  }

  try {
    const result = await fulfillPixLicenseTransaction({
      id,
      status: "paid",
      value: body.value ?? order.amountCents,
    });
    console.log("[webhook/pushinpay]", id, result);

    if (result.outcome === "created" || result.outcome === "exists") {
      try {
        await deliverIssuedLicenseById(result.licenseId);
      } catch (error) {
        console.error("[webhook/pushinpay] entrega:", id, error);
      }

      const offer = getPricedLicenseOffer(order.edition, order.duration);
      if (offer) {
        void trackLicenseFunnel({
          stage: "purchase",
          eventId: id,
          ads: {
            fbp: order.fbp,
            fbc: order.fbc,
            email: order.email,
          },
          content: {
            contentName: offer.name,
            contentIds: [`desktop-license:${offer.edition}:${offer.duration}`],
            valueCents: order.amountCents,
          },
          email: order.email,
        });
      }
    }
  } catch (error) {
    console.error("[webhook/pushinpay] fulfill", id, error);
    return NextResponse.json({ error: "Falha ao registrar a licença" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
