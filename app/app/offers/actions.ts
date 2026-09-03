"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { requireWorkspacePermission } from "@/lib/rbac/workspace-permissions";
import { calculateOfferMetrics } from "@/lib/domain/offer-metrics";
import {
  OFFER_COUNTRIES,
  parseOfferCountry,
  type OfferCountryCode
} from "@/lib/domain/offer-country";
import {
  CURRENCIES,
  parseCurrency,
  suggestCurrencyFromCountry,
  type CurrencyCode
} from "@/lib/domain/currency";

const offerCountrySchema = z.enum(OFFER_COUNTRIES).nullable();
const currencySchema = z.enum(CURRENCIES);

const createOfferSchema = z.object({
  name: z.string().min(3).max(120),
  status: z.enum(["ACTIVE", "PAUSED", "DEAD"]),
  country: offerCountrySchema,
  currency: currencySchema
});

const updateOfferSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(3).max(120),
  status: z.enum(["ACTIVE", "PAUSED", "DEAD"]),
  country: offerCountrySchema.optional(),
  currency: currencySchema.optional()
});

const deleteOfferSchema = z.object({
  id: z.string().cuid()
});

export async function listOffers() {
  const workspaceId = await requireActiveWorkspaceId();

  return prisma.offer.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export type OfferWithMetrics = {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DEAD";
  country: OfferCountryCode | null;
  currency: CurrencyCode;
  createdAt: Date;
  hasDailyPerformances: boolean;
  metrics: {
    roi7d: number | null;
    roi30d: number | null;
    roiGeneral: number | null;
    totalRevenue: number | null;
    trendData: number[];
    performances: Array<{
      date: string;
      investment: number;
      revenue: number;
      sales: number;
      checkoutPercentage: number;
      gatewayFeePerSale: number;
      taxPercentage: number;
    }>;
  };
};

/**
 * Lista ofertas com métricas agregadas calculadas
 */
export async function listOffersWithMetrics(): Promise<OfferWithMetrics[]> {
  const workspaceId = await requireActiveWorkspaceId();

  const offers = await prisma.offer.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      dailyPerformances: {
        orderBy: { date: "desc" },
        take: 90
      },
      _count: {
        select: { dailyPerformances: true }
      }
    }
  });

  return offers.map((offer) => {
    const metrics = calculateOfferMetrics(
      offer.dailyPerformances.map((p) => ({
        date: p.date,
        investment: p.investment,
        revenue: p.revenue,
        sales: p.sales,
        checkoutPercentageSnapshot: p.checkoutPercentageSnapshot,
        gatewayFeePerSaleSnapshot: p.gatewayFeePerSaleSnapshot,
        taxPercentageSnapshot: p.taxPercentageSnapshot
      }))
    );

    return {
      id: offer.id,
      name: offer.name,
      status: offer.status,
      country: offer.country,
      currency: offer.currency,
      createdAt: offer.createdAt,
      hasDailyPerformances: offer._count.dailyPerformances > 0,
      metrics
    };
  });
}

export async function createOffer(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    await requireWorkspacePermission(workspaceId, "create");

    const country = parseOfferCountry(formData.get("country"));
    const currencyFromForm = parseCurrency(formData.get("currency"));

    const parsed = createOfferSchema.safeParse({
      name: formData.get("name"),
      status: formData.get("status") ?? "ACTIVE",
      country,
      currency: currencyFromForm ?? suggestCurrencyFromCountry(country)
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para criação de oferta.");
    }

    await prisma.offer.create({
      data: {
        workspaceId,
        name: parsed.data.name,
        status: parsed.data.status,
        country: parsed.data.country,
        currency: parsed.data.currency
      }
    });

    revalidatePath("/app/offers");
    revalidatePath("/app/dashboard");
  } catch (error) {
    console.error("Erro ao criar oferta:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao criar oferta.");
  }
}

export async function updateOffer(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    await requireWorkspacePermission(workspaceId, "edit");

    const parsed = updateOfferSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      status: formData.get("status"),
      ...(formData.has("country")
        ? { country: parseOfferCountry(formData.get("country")) }
        : {}),
      ...(formData.has("currency")
        ? { currency: parseCurrency(formData.get("currency")) }
        : {})
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para atualização de oferta.");
    }

    const existing = await prisma.offer.findFirst({
      where: {
        id: parsed.data.id,
        workspaceId
      },
      include: {
        _count: { select: { dailyPerformances: true } }
      }
    });

    if (!existing) {
      throw new Error("Oferta não encontrada no workspace atual.");
    }

    if (
      parsed.data.currency !== undefined &&
      parsed.data.currency !== existing.currency &&
      existing._count.dailyPerformances > 0
    ) {
      throw new Error(
        "Não é possível alterar a moeda da oferta após o primeiro lançamento diário."
      );
    }

    await prisma.offer.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        status: parsed.data.status,
        ...(parsed.data.country !== undefined
          ? { country: parsed.data.country }
          : {}),
        ...(parsed.data.currency !== undefined &&
        existing._count.dailyPerformances === 0
          ? { currency: parsed.data.currency }
          : {})
      }
    });

    revalidatePath("/app/offers");
    revalidatePath("/app/dashboard");
  } catch (error) {
    console.error("Erro ao atualizar oferta:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao atualizar oferta.");
  }
}

export async function deleteOffer(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    await requireWorkspacePermission(workspaceId, "delete");

    const parsed = deleteOfferSchema.safeParse({
      id: formData.get("id")
    });

    if (!parsed.success) {
      throw new Error("ID de oferta inválido.");
    }

    const existing = await prisma.offer.findFirst({
      where: {
        id: parsed.data.id,
        workspaceId
      },
      include: {
        _count: {
          select: {
            dailyPerformances: true
          }
        }
      }
    });

    if (!existing) {
      throw new Error("Oferta não encontrada no workspace atual.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.dailyPerformance.deleteMany({
        where: { offerId: parsed.data.id }
      });

      await tx.periodPerformance.deleteMany({
        where: { offerId: parsed.data.id }
      });

      await tx.offer.delete({
        where: { id: parsed.data.id }
      });
    });

    revalidatePath("/app/offers");
    revalidatePath("/app/dashboard");
  } catch (error) {
    console.error("Erro ao excluir oferta:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao excluir oferta.");
  }
}
