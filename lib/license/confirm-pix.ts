import { trackLicenseFunnel } from "@/lib/ads/meta";
import { getPricedLicenseOffer } from "@/lib/license/catalog";
import { deliverIssuedLicenseById } from "@/lib/license/deliver";
import {
  fulfillPixLicenseTransaction,
  type FulfillOutcome,
} from "@/lib/license/fulfill-checkout";
import type { PushinPayTransaction } from "@/lib/payments/pushinpay";

type PixOrderAds = {
  edition: string;
  duration: string;
  amountCents: number;
  email: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export async function deliverFulfilledPixLicense(
  result: FulfillOutcome,
  order: PixOrderAds,
  eventId: string
) {
  if (result.outcome !== "created" && result.outcome !== "exists") return result;

  try {
    await deliverIssuedLicenseById(result.licenseId);
  } catch (error) {
    console.error("[license/confirm-pix] entrega:", eventId, error);
  }

  const offer = getPricedLicenseOffer(order.edition, order.duration);
  if (offer) {
    void trackLicenseFunnel({
      stage: "purchase",
      eventId,
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

  return result;
}

export async function fulfillAndDeliverPixTransaction(
  tx: Pick<PushinPayTransaction, "id" | "status" | "value">,
  order: PixOrderAds
) {
  const result = await fulfillPixLicenseTransaction(tx);
  await deliverFulfilledPixLicense(result, order, tx.id);
  return result;
}
