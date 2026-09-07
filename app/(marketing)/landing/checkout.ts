"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adsContextFromRequest, trackLicenseFunnel } from "@/lib/ads/meta";
import { stripe } from "@/lib/billing/stripe";
import {
  DESKTOP_LICENSE_PRODUCT,
  getPricedLicenseOffer,
} from "@/lib/license/catalog";
import {
  pixCheckoutRef,
  recordLicenseOrderCreated,
} from "@/lib/license/orders";
import {
  createPushinPayPix,
  pushinPayReady,
} from "@/lib/payments/pushinpay";
import type { LicenseDuration, LicenseEdition } from "@/lib/prisma-enums";

export type { LicenseEdition, LicenseDuration };

export type CheckoutTraffic = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  eventId?: string | null;
};

function stripeReady() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const isStripeKey =
    key.startsWith("sk_test_") || key.startsWith("sk_live_");
  return isStripeKey && !key.includes("not_used") && key.length > 40;
}

function originFromHeaders(headerList: Headers) {
  return (
    headerList.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://127.0.0.1:3456"
  );
}

function funnelContent(
  offer: NonNullable<ReturnType<typeof getPricedLicenseOffer>>
) {
  return {
    contentName: offer.name,
    contentIds: [`desktop-license:${offer.edition}:${offer.duration}`],
    valueCents: offer.amountCents,
  };
}

export async function startLicenseCheckout(
  edition: LicenseEdition,
  duration: LicenseDuration,
  traffic?: CheckoutTraffic
) {
  const offer = getPricedLicenseOffer(edition, duration);
  if (!offer) {
    return {
      error:
        "Este prazo ainda não está à venda. Escolhe outro ou volta mais tarde.",
    };
  }

  const headerList = await headers();
  const origin = originFromHeaders(headerList);

  if (!stripeReady()) {
    return {
      error:
        "O pagamento ainda não está configurado neste ambiente. Confirma a STRIPE_SECRET_KEY no servidor.",
    };
  }

  let checkoutUrl: string;
  const ads = await adsContextFromRequest({
    eventId: traffic?.eventId,
    fbp: traffic?.fbp,
    fbc: traffic?.fbc,
    sourceUrl: `${origin}/#planos`,
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "pt-BR",
      payment_method_types: ["card"],
      customer_creation: "always",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: offer.amountCents,
            product_data: {
              name: offer.name,
              description: offer.description,
            },
          },
        },
      ],
      success_url: `${origin}/compra/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/compra/cancelado?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        product: DESKTOP_LICENSE_PRODUCT,
        edition: offer.edition,
        duration: offer.duration,
      },
      payment_intent_data: {
        metadata: {
          product: DESKTOP_LICENSE_PRODUCT,
          edition: offer.edition,
          duration: offer.duration,
        },
      },
    });

    if (!session.url) {
      return { error: "Não foi possível abrir o pagamento. Tente de novo." };
    }

    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null;

    try {
      await recordLicenseOrderCreated({
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntent,
        provider: "stripe",
        edition: offer.edition,
        duration: offer.duration,
        amountCents: offer.amountCents,
        traffic,
      });
    } catch (error) {
      console.error("[checkout/license] pedido financeiro:", error);
    }

    const eventId = ads.eventId || session.id;
    void trackLicenseFunnel({
      stage: "initiate",
      eventId,
      ads,
      content: funnelContent(offer),
    });
    void trackLicenseFunnel({
      stage: "order",
      eventId: session.id,
      ads,
      content: funnelContent(offer),
    });

    checkoutUrl = session.url;
  } catch (error) {
    console.error("[checkout/license]", error);
    return {
      error:
        "O pagamento ainda não está disponível neste ambiente. Tente de novo em instantes.",
    };
  }

  redirect(checkoutUrl);
}

export async function startPixCheckout(
  edition: LicenseEdition,
  duration: LicenseDuration,
  email: string,
  traffic?: CheckoutTraffic
) {
  const offer = getPricedLicenseOffer(edition, duration);
  if (!offer) {
    return {
      error:
        "Este prazo ainda não está à venda. Escolhe outro ou volta mais tarde.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    return { error: "Informa um e-mail válido. É nele que a chave chega." };
  }

  if (!pushinPayReady()) {
    return {
      error:
        "O PIX ainda não está configurado neste ambiente. Confirma o token da Pushin Pay, ou paga no cartão.",
    };
  }

  const headerList = await headers();
  const origin = originFromHeaders(headerList);
  const ads = await adsContextFromRequest({
    eventId: traffic?.eventId,
    fbp: traffic?.fbp,
    fbc: traffic?.fbc,
    email: normalizedEmail,
    sourceUrl: `${origin}/#planos`,
  });

  let checkoutRef: string;

  try {
    const tx = await createPushinPayPix({
      valueCents: offer.amountCents,
      description: offer.name,
      webhookUrl: `${origin}/api/webhooks/pushinpay`,
    });

    checkoutRef = pixCheckoutRef(tx.id);
    await recordLicenseOrderCreated({
      stripeSessionId: checkoutRef,
      provider: "pushinpay",
      pixTransactionId: tx.id,
      pixQrCode: tx.qr_code || null,
      pixQrCodeBase64: tx.qr_code_base64 || null,
      email: normalizedEmail,
      edition: offer.edition,
      duration: offer.duration,
      amountCents: offer.amountCents,
      traffic,
    });

    const eventId = ads.eventId || tx.id;
    void trackLicenseFunnel({
      stage: "initiate",
      eventId,
      ads,
      content: funnelContent(offer),
      email: normalizedEmail,
    });
    void trackLicenseFunnel({
      stage: "order",
      eventId: tx.id,
      ads,
      content: funnelContent(offer),
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("[checkout/pix]", error);
    return {
      error:
        "Não foi possível gerar o PIX agora. Tenta de novo ou paga no cartão.",
    };
  }

  redirect(`/compra/pix?session_id=${encodeURIComponent(checkoutRef)}`);
}
