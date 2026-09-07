import type Stripe from "stripe";
import { createPaidLicense } from "./store";
import {
  findLicenseOrderByPixId,
  markLicenseOrderPaid,
  pixCheckoutRef,
} from "./orders";
import {
  DESKTOP_LICENSE_PRODUCT,
  getPricedLicenseOffer,
} from "./catalog";
import { isPushinPaid, type PushinPayTransaction } from "@/lib/payments/pushinpay";

export type DesktopLicenseSession = Pick<
  Stripe.Checkout.Session,
  "id" | "mode" | "payment_status" | "amount_total" | "customer_email"
> & {
  payment_intent?: Stripe.Checkout.Session["payment_intent"];
  metadata?: Stripe.Metadata | null;
  customer_details?: { email?: string | null } | null;
};

export type FulfillOutcome =
  | { outcome: "ignored"; reason: string }
  | { outcome: "created"; licenseId: string }
  | { outcome: "exists"; licenseId: string };

function sessionEmail(session: DesktopLicenseSession): string | null {
  const email =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    "";
  return email.includes("@") ? email.toLowerCase() : null;
}

export async function fulfillDesktopLicenseSession(
  session: DesktopLicenseSession
): Promise<FulfillOutcome> {
  const product = session.metadata?.product;
  if (product !== DESKTOP_LICENSE_PRODUCT) {
    return { outcome: "ignored", reason: "not_desktop_license" };
  }

  if (session.mode !== "payment") {
    return { outcome: "ignored", reason: "not_one_time_payment" };
  }

  if (session.payment_status !== "paid") {
    return { outcome: "ignored", reason: "not_paid" };
  }

  const offer = getPricedLicenseOffer(
    session.metadata?.edition ?? "",
    session.metadata?.duration ?? ""
  );
  if (!offer) {
    return { outcome: "ignored", reason: "unpriced_or_invalid" };
  }

  if (session.amount_total !== offer.amountCents) {
    console.error(
      "[license/fulfill] valor pago não bate com o catálogo",
      session.id,
      session.amount_total,
      offer.amountCents
    );
    return { outcome: "ignored", reason: "amount_mismatch" };
  }

  const email = sessionEmail(session);
  if (!email) {
    return { outcome: "ignored", reason: "missing_email" };
  }

  const result = await createPaidLicense({
    edition: offer.edition,
    duration: offer.duration,
    email,
    stripeSessionId: session.id,
  });

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent &&
          typeof session.payment_intent === "object" &&
          "id" in session.payment_intent
        ? String(session.payment_intent.id)
        : null;

  try {
    await markLicenseOrderPaid({
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntent,
      email,
      amountCents: session.amount_total ?? offer.amountCents,
      licenseId: result.license.id,
      edition: offer.edition,
      duration: offer.duration,
    });
  } catch (error) {
    console.error("[license/fulfill] pedido financeiro:", session.id, error);
  }

  return result.alreadyExisted
    ? { outcome: "exists", licenseId: result.license.id }
    : { outcome: "created", licenseId: result.license.id };
}

export async function fulfillPixLicenseTransaction(
  tx: Pick<PushinPayTransaction, "id" | "status" | "value">
): Promise<FulfillOutcome> {
  if (!isPushinPaid(tx.status)) {
    return { outcome: "ignored", reason: "not_paid" };
  }

  const order = await findLicenseOrderByPixId(tx.id);
  if (!order) {
    return { outcome: "ignored", reason: "order_not_found" };
  }

  const offer = getPricedLicenseOffer(order.edition, order.duration);
  if (!offer) {
    return { outcome: "ignored", reason: "unpriced_or_invalid" };
  }

  if (tx.value !== offer.amountCents && tx.value !== order.amountCents) {
    console.error(
      "[license/fulfill-pix] valor pago não bate com o pedido",
      tx.id,
      tx.value,
      order.amountCents
    );
    return { outcome: "ignored", reason: "amount_mismatch" };
  }

  const email = order.email?.trim().toLowerCase() ?? "";
  if (!email.includes("@")) {
    return { outcome: "ignored", reason: "missing_email" };
  }

  const checkoutRef = order.stripeSessionId || pixCheckoutRef(tx.id);
  const result = await createPaidLicense({
    edition: offer.edition,
    duration: offer.duration,
    email,
    stripeSessionId: checkoutRef,
  });

  try {
    await markLicenseOrderPaid({
      stripeSessionId: checkoutRef,
      email,
      amountCents: order.amountCents,
      licenseId: result.license.id,
      edition: offer.edition,
      duration: offer.duration,
    });
  } catch (error) {
    console.error("[license/fulfill-pix] pedido financeiro:", tx.id, error);
  }

  return result.alreadyExisted
    ? { outcome: "exists", licenseId: result.license.id }
    : { outcome: "created", licenseId: result.license.id };
}
