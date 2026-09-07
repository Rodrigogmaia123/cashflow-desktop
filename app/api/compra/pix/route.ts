import { NextRequest, NextResponse } from "next/server";
import { trackLicenseFunnel } from "@/lib/ads/meta";
import { getPricedLicenseOffer } from "@/lib/license/catalog";
import { fulfillPixLicenseTransaction } from "@/lib/license/fulfill-checkout";
import { deliverIssuedLicenseById } from "@/lib/license/deliver";
import {
  findLicenseOrderByCheckoutRef,
  isPixCheckoutRef,
  touchPixConsultedAt,
} from "@/lib/license/orders";
import {
  getPushinPayTransaction,
  isPushinPaid,
} from "@/lib/payments/pushinpay";

export const dynamic = "force-dynamic";

const CONSULT_MIN_MS = 60_000;

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim() ?? "";
  if (!isPixCheckoutRef(sessionId)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const order = await findLicenseOrderByCheckoutRef(sessionId);
  if (!order) {
    return NextResponse.json({ status: "invalid" });
  }

  if (order.status === "paid") {
    return NextResponse.json({
      status: "paid",
      sessionId,
      email: order.email,
    });
  }

  if (order.status === "canceled") {
    return NextResponse.json({ status: "canceled" });
  }

  return NextResponse.json({
    status: "pending",
    sessionId,
    email: order.email,
    amountCents: order.amountCents,
    qrCode: order.pixQrCode,
    qrCodeImage: order.pixQrCodeBase64,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    session_id?: string;
  } | null;
  const sessionId = body?.session_id?.trim() ?? "";
  if (!isPixCheckoutRef(sessionId)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const order = await findLicenseOrderByCheckoutRef(sessionId);
  if (!order?.pixTransactionId) {
    return NextResponse.json({ status: "invalid" });
  }

  if (order.status === "paid") {
    return NextResponse.json({ status: "paid", sessionId });
  }

  const last = order.pixConsultedAt?.getTime() ?? 0;
  if (Date.now() - last < CONSULT_MIN_MS) {
    return NextResponse.json({
      status: "pending",
      wait: true,
      message: "Espere um minuto para confirmar de novo. O PIX cai pelo webhook.",
    });
  }

  await touchPixConsultedAt(sessionId);

  try {
    const tx = await getPushinPayTransaction(order.pixTransactionId);
    if (!tx || !isPushinPaid(tx.status)) {
      return NextResponse.json({ status: "pending" });
    }
    const result = await fulfillPixLicenseTransaction(tx);
    if (result.outcome === "created" || result.outcome === "exists") {
      try {
        await deliverIssuedLicenseById(result.licenseId);
      } catch (error) {
        console.error("[compra/pix] entrega:", error);
      }
      const offer = getPricedLicenseOffer(order.edition, order.duration);
      if (offer) {
        void trackLicenseFunnel({
          stage: "purchase",
          eventId: order.pixTransactionId,
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
      return NextResponse.json({ status: "paid", sessionId });
    }
  } catch (error) {
    console.error("[compra/pix] consulta", error);
  }

  return NextResponse.json({ status: "pending" });
}
