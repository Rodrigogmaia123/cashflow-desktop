import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { calculateDailyMetrics } from "@/lib/domain/finance";
import type { CurrencyCode } from "@/lib/domain/currency";
import { resolveExchangeRate } from "@/lib/domain/exchange-rate";

type PersistInput = {
  workspaceId: string;
  offerId: string;
  date: Date;
  investment: number;
  revenue: number;
  sales: number;
  comment?: string | null;
  ifExists: "update" | "fail";
};

/**
 * Grava DailyPerformance com os mesmos snapshots de taxa do lançamento diário atual.
 * ifExists=update replica o formulário diário; fail é usado no fechamento semanal.
 */
export async function persistDailyPerformance(input: PersistInput) {
  const offer = await prisma.offer.findFirst({
    where: {
      id: input.offerId,
      workspaceId: input.workspaceId
    },
    include: {
      feeProfile: true,
      workspace: {
        include: { feeConfig: true }
      }
    }
  });

  if (!offer) {
    throw new Error("Oferta não encontrada no workspace atual.");
  }

  const offerCurrency = offer.currency as CurrencyCode;
  const baseCurrency = offer.workspace.baseCurrency as CurrencyCode;
  const feeProfile = offer.feeProfile;
  const workspaceConfig = offer.workspace.feeConfig;

  const feeCurrency = (feeProfile?.currency ??
    workspaceConfig?.currency ??
    offerCurrency) as CurrencyCode;

  if (feeCurrency !== offerCurrency) {
    throw new Error(
      `Moeda das taxas (${feeCurrency}) difere da moeda da oferta (${offerCurrency}). ` +
        `Use um perfil de taxas na mesma moeda ou ajuste as taxas do workspace.`
    );
  }

  const checkoutPercentage =
    feeProfile?.checkoutPercentage ?? workspaceConfig?.checkoutPercentage ?? new Decimal(0.1);
  const gatewayFeePerSale =
    feeProfile?.gatewayFeePerSale ?? workspaceConfig?.gatewayFeePerSale ?? new Decimal(0.3);
  const taxPercentage =
    feeProfile?.taxPercentage ?? workspaceConfig?.taxPercentage ?? new Decimal(0.06);

  const existingDaily = await prisma.dailyPerformance.findUnique({
    where: {
      offerId_date: {
        offerId: offer.id,
        date: input.date
      }
    }
  });

  if (existingDaily && input.ifExists === "fail") {
    throw new Error("Já existe lançamento neste dia. Use o formulário diário para editar.");
  }

  const daily = existingDaily
    ? await prisma.dailyPerformance.update({
        where: { id: existingDaily.id },
        data: {
          investment: new Decimal(input.investment),
          revenue: new Decimal(input.revenue),
          sales: input.sales,
          comment: input.comment ?? null,
          checkoutPercentageSnapshot: checkoutPercentage,
          gatewayFeePerSaleSnapshot: gatewayFeePerSale,
          taxPercentageSnapshot: taxPercentage
        }
      })
    : await prisma.dailyPerformance.create({
        data: {
          offerId: offer.id,
          date: input.date,
          investment: new Decimal(input.investment),
          revenue: new Decimal(input.revenue),
          sales: input.sales,
          comment: input.comment ?? null,
          checkoutPercentageSnapshot: checkoutPercentage,
          gatewayFeePerSaleSnapshot: gatewayFeePerSale,
          taxPercentageSnapshot: taxPercentage,
          currency: offerCurrency,
          exchangeRateSnapshot: await resolveExchangeRate(
            input.workspaceId,
            offerCurrency,
            baseCurrency
          )
        }
      });

  const metrics = calculateDailyMetrics({
    investment: daily.investment,
    revenue: daily.revenue,
    sales: daily.sales,
    checkoutPercentage: daily.checkoutPercentageSnapshot,
    gatewayFeePerSale: daily.gatewayFeePerSaleSnapshot,
    taxPercentage: daily.taxPercentageSnapshot
  });
  void metrics;

  return { offerId: offer.id, daily };
}
