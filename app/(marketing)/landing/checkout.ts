"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/billing/stripe";
import {
  DESKTOP_LICENSE_PRODUCT,
  getPricedLicenseOffer,
} from "@/lib/license/catalog";
import type { LicenseDuration, LicenseEdition } from "@/lib/prisma-enums";

export type { LicenseEdition, LicenseDuration };

function stripeReady() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const isStripeKey =
    key.startsWith("sk_test_") || key.startsWith("sk_live_");
  return isStripeKey && !key.includes("not_used") && key.length > 40;
}

export async function startLicenseCheckout(
  edition: LicenseEdition,
  duration: LicenseDuration
) {
  const offer = getPricedLicenseOffer(edition, duration);
  if (!offer) {
    return {
      error:
        "Este prazo ainda não está à venda. Escolhe outro ou volta mais tarde.",
    };
  }

  const headerList = await headers();
  const origin =
    headerList.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://127.0.0.1:3456";

  if (!stripeReady()) {
    return {
      error:
        "O pagamento ainda não está configurado neste ambiente. Confirma a STRIPE_SECRET_KEY no servidor.",
    };
  }

  let checkoutUrl: string;

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
      cancel_url: `${origin}/#planos`,
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
