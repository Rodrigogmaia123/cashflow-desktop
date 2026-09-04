"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDesktopMode } from "@/lib/desktop";
import {
  editionLabel,
  licenseDurationLabel,
} from "@/lib/license/catalog";
import { backfillOrdersFromLicenses } from "@/lib/license/orders";
import { resendLicenseEmail } from "@/lib/license";
import {
  isLicenseDuration,
  isLicenseEdition,
} from "@/lib/license/types";
import type { LicenseOrderStatus } from "@/lib/prisma-enums";
import { revalidatePath } from "next/cache";

async function requireDomainAdmin() {
  if (isDesktopMode()) return null;
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

const ORDER_STATUSES: LicenseOrderStatus[] = [
  "generated",
  "paid",
  "failed",
  "canceled",
];

export type FinanceStatusFilter = "all" | LicenseOrderStatus;

export type AdminFinanceOrderRow = {
  id: string;
  email: string | null;
  editionLabel: string;
  durationLabel: string;
  amountCents: number;
  status: LicenseOrderStatus;
  failureReason: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  licenseId: string | null;
  licenseStatus: string | null;
  licenseActivatedAt: string | null;
  licenseEmailedAt: string | null;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
  canceledAt: string | null;
};

export type AdminFinanceSummary = {
  generated: number;
  paid: number;
  failed: number;
  canceled: number;
  open: number;
  revenueCents: number;
  conversionPct: number | null;
};

export type AdminFinanceResult = {
  summary: AdminFinanceSummary;
  orders: AdminFinanceOrderRow[];
};

function isOrderStatus(value: string): value is LicenseOrderStatus {
  return ORDER_STATUSES.includes(value as LicenseOrderStatus);
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export async function getAdminFinance(input?: {
  status?: FinanceStatusFilter;
  query?: string;
  from?: string;
  to?: string;
}): Promise<{
  success: boolean;
  reason?: string;
  data?: AdminFinanceResult;
}> {
  const admin = await requireDomainAdmin();
  if (!admin) {
    return {
      success: false,
      reason: "Acesso negado: apenas administradores do site",
    };
  }

  try {
    await backfillOrdersFromLicenses();
  } catch (error) {
    console.error("[admin/financeiro] backfill:", error);
  }

  const from = input?.from ? startOfDay(new Date(input.from)) : null;
  const to = input?.to ? endOfDay(new Date(input.to)) : null;
  const query = input?.query?.trim().toLowerCase() ?? "";

  const createdAt =
    from || to
      ? {
          ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
          ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
        }
      : undefined;

  const where = {
    ...(createdAt && Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    ...(query
      ? {
          OR: [
            { email: { contains: query } },
            { stripeSessionId: { contains: query } },
            { utmCampaign: { contains: query } },
            { utmSource: { contains: query } },
          ],
        }
      : {}),
  };

  const orders = await prisma.licenseOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const licenseIds = orders
    .map((order) => order.licenseId)
    .filter((id): id is string => Boolean(id));

  const licenses =
    licenseIds.length > 0
      ? await prisma.license.findMany({
          where: { id: { in: licenseIds } },
          select: {
            id: true,
            status: true,
            activatedAt: true,
            serialEmailedAt: true,
          },
        })
      : [];

  const licenseById = new Map(licenses.map((row) => [row.id, row]));

  const counts = {
    generated: 0,
    paid: 0,
    failed: 0,
    canceled: 0,
  };
  let revenueCents = 0;

  for (const order of orders) {
    if (isOrderStatus(order.status)) {
      counts[order.status] += 1;
    }
    if (order.status === "paid") {
      revenueCents += order.amountCents;
    }
  }

  const closedOrPaid = counts.paid + counts.failed + counts.canceled;
  const conversionPct =
    closedOrPaid + counts.generated > 0
      ? (counts.paid / (counts.generated + closedOrPaid)) * 100
      : null;

  const statusFilter = input?.status ?? "all";
  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const rows: AdminFinanceOrderRow[] = filtered.map((order) => {
    const license = order.licenseId
      ? licenseById.get(order.licenseId)
      : undefined;
    return {
      id: order.id,
      email: order.email,
      editionLabel: isLicenseEdition(order.edition)
        ? editionLabel(order.edition)
        : order.edition,
      durationLabel: isLicenseDuration(order.duration)
        ? licenseDurationLabel(order.duration)
        : order.duration,
      amountCents: order.amountCents,
      status: isOrderStatus(order.status) ? order.status : "generated",
      failureReason: order.failureReason,
      utmSource: order.utmSource,
      utmMedium: order.utmMedium,
      utmCampaign: order.utmCampaign,
      licenseId: order.licenseId,
      licenseStatus: license?.status ?? null,
      licenseActivatedAt: license?.activatedAt?.toISOString() ?? null,
      licenseEmailedAt: license?.serialEmailedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() ?? null,
      failedAt: order.failedAt?.toISOString() ?? null,
      canceledAt: order.canceledAt?.toISOString() ?? null,
    };
  });

  return {
    success: true,
    data: {
      summary: {
        generated: counts.generated + counts.paid + counts.failed + counts.canceled,
        paid: counts.paid,
        failed: counts.failed,
        canceled: counts.canceled,
        open: counts.generated,
        revenueCents,
        conversionPct,
      },
      orders: rows,
    },
  };
}

export async function resendFinanceLicenseEmail(licenseId: string): Promise<{
  success: boolean;
  reason?: string;
}> {
  const admin = await requireDomainAdmin();
  if (!admin) {
    return {
      success: false,
      reason: "Acesso negado: apenas administradores do site",
    };
  }

  const result = await resendLicenseEmail(licenseId);
  if (!result.ok) {
    return { success: false, reason: result.reason ?? "Falha ao reenviar" };
  }

  revalidatePath("/app/admin/financeiro");
  return { success: true };
}
