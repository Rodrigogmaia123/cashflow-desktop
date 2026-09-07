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
  const got = req.headers.get(headerName);
  return got === expected;
}

type PushinWebhookBody = {
  id?: string;
  value?: number;
  status?: string;
};

export async function POST(req: NextRequest) {
  if (!webhookAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: PushinWebhookBody;
  try {
    body = (await req.json()) as PushinWebhookBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const id = body.id?.trim() ?? "";
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
