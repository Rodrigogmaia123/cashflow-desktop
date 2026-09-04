import { prisma } from "@/lib/db";
import { licensePriceCents } from "./catalog";
import {
  isLicenseDuration,
  isLicenseEdition,
} from "./types";
import type { LicenseOrderStatus } from "@/lib/prisma-enums";

const PAID: LicenseOrderStatus = "paid";

export type LicenseOrderTraffic = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

function trimUtm(value?: string | null) {
  const next = value?.trim() ?? "";
  return next ? next.slice(0, 120) : null;
}

function isPaidStatus(status: string) {
  return status === PAID;
}

export async function recordLicenseOrderCreated(input: {
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  edition: string;
  duration: string;
  amountCents: number;
  traffic?: LicenseOrderTraffic;
}) {
  const now = new Date();
  await prisma.licenseOrder.upsert({
    where: { stripeSessionId: input.stripeSessionId },
    create: {
      stripeSessionId: input.stripeSessionId,
      stripePaymentIntentId: input.stripePaymentIntentId || null,
      edition: input.edition,
      duration: input.duration,
      amountCents: input.amountCents,
      status: "generated",
      utmSource: trimUtm(input.traffic?.utmSource),
      utmMedium: trimUtm(input.traffic?.utmMedium),
      utmCampaign: trimUtm(input.traffic?.utmCampaign),
    },
    update: {
      stripePaymentIntentId:
        input.stripePaymentIntentId || undefined,
      updatedAt: now,
    },
  });
}

export async function markLicenseOrderPaid(input: {
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  email?: string | null;
  amountCents?: number;
  licenseId?: string | null;
  edition?: string;
  duration?: string;
}) {
  const email = input.email?.trim().toLowerCase() || null;
  const now = new Date();
  const existing = await prisma.licenseOrder.findUnique({
    where: { stripeSessionId: input.stripeSessionId },
  });

  if (!existing) {
    await prisma.licenseOrder.create({
      data: {
        stripeSessionId: input.stripeSessionId,
        stripePaymentIntentId: input.stripePaymentIntentId || null,
        email,
        edition: input.edition || "pro",
        duration: input.duration || "3m",
        amountCents: input.amountCents ?? 0,
        status: PAID,
        licenseId: input.licenseId || null,
        paidAt: now,
        failureReason: null,
      },
    });
    return;
  }

  await prisma.licenseOrder.update({
    where: { stripeSessionId: input.stripeSessionId },
    data: {
      status: PAID,
      email: email ?? existing.email,
      stripePaymentIntentId:
        input.stripePaymentIntentId || existing.stripePaymentIntentId,
      amountCents: input.amountCents ?? existing.amountCents,
      licenseId: input.licenseId ?? existing.licenseId,
      paidAt: existing.paidAt ?? now,
      failureReason: null,
      updatedAt: now,
    },
  });
}

async function findOrderBySessionOrPaymentIntent(input: {
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}) {
  if (input.stripeSessionId) {
    const bySession = await prisma.licenseOrder.findUnique({
      where: { stripeSessionId: input.stripeSessionId },
    });
    if (bySession) return bySession;
  }
  if (input.stripePaymentIntentId) {
    return prisma.licenseOrder.findFirst({
      where: { stripePaymentIntentId: input.stripePaymentIntentId },
    });
  }
  return null;
}

export async function markLicenseOrderFailed(input: {
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  email?: string | null;
  reason?: string | null;
}) {
  const existing = await findOrderBySessionOrPaymentIntent(input);
  if (!existing || isPaidStatus(existing.status)) return;

  const now = new Date();
  await prisma.licenseOrder.update({
    where: { id: existing.id },
    data: {
      status: "failed",
      email: input.email?.trim().toLowerCase() || existing.email,
      stripePaymentIntentId:
        input.stripePaymentIntentId || existing.stripePaymentIntentId,
      failureReason: (input.reason ?? "payment_failed").slice(0, 200),
      failedAt: existing.failedAt ?? now,
      updatedAt: now,
    },
  });
}

export async function markLicenseOrderCanceled(input: {
  stripeSessionId: string;
  email?: string | null;
}) {
  const existing = await prisma.licenseOrder.findUnique({
    where: { stripeSessionId: input.stripeSessionId },
  });
  if (!existing || isPaidStatus(existing.status)) return;
  if (existing.status === "failed") return;

  const now = new Date();
  await prisma.licenseOrder.update({
    where: { id: existing.id },
    data: {
      status: "canceled",
      email: input.email?.trim().toLowerCase() || existing.email,
      canceledAt: existing.canceledAt ?? now,
      updatedAt: now,
    },
  });
}

export async function backfillOrdersFromLicenses() {
  const licenses = await prisma.license.findMany({
    where: {
      NOT: { stripeSessionId: { startsWith: "admin:" } },
    },
    select: {
      id: true,
      email: true,
      edition: true,
      duration: true,
      stripeSessionId: true,
      createdAt: true,
    },
  });

  for (const license of licenses) {
    const existing = await prisma.licenseOrder.findUnique({
      where: { stripeSessionId: license.stripeSessionId },
    });
    if (existing) {
      if (!existing.licenseId || existing.status !== PAID) {
        await prisma.licenseOrder.update({
          where: { id: existing.id },
          data: {
            licenseId: existing.licenseId ?? license.id,
            email: existing.email ?? license.email,
            status: PAID,
            paidAt: existing.paidAt ?? license.createdAt,
            failureReason: null,
          },
        });
      }
      continue;
    }

    const amountCents = isLicenseDuration(license.duration)
      ? licensePriceCents(license.duration) ?? 0
      : 0;

    await prisma.licenseOrder.create({
      data: {
        stripeSessionId: license.stripeSessionId,
        email: license.email,
        edition: isLicenseEdition(license.edition) ? license.edition : "pro",
        duration: isLicenseDuration(license.duration)
          ? license.duration
          : "3m",
        amountCents,
        status: PAID,
        licenseId: license.id,
        paidAt: license.createdAt,
        createdAt: license.createdAt,
      },
    });
  }
}
