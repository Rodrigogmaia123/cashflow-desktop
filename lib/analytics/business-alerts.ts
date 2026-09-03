import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { calculateFee } from "@/lib/domain/finance";
import { getPeriodComparison } from "./period-comparison";
import { getComparisonDateRanges } from "./period-comparison-ranges";
import { startOfDay } from "./date-range-utils";
import { measure } from "@/lib/observability/measure";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export type BusinessAlertLevel = "INFO" | "WARNING" | "CRITICAL";

export type BusinessAlert = {
  id: string;
  level: BusinessAlertLevel;
  title: string;
  description: string;
};

function endOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

async function aggregatePeriodMetrics(params: {
  workspaceId: string;
  offerId?: string;
  startDate: Date;
  endDate: Date;
}) {
  const rows = await prisma.dailyPerformance.findMany({
    where: {
      date: {
        gte: params.startDate,
        lte: params.endDate
      },
      offer: {
        workspaceId: params.workspaceId,
        ...(params.offerId ? { id: params.offerId } : {})
      }
    },
    include: {
      offer: {
        select: { id: true, name: true }
      }
    },
    orderBy: { date: "asc" }
  });

  const totals = rows.reduce(
    (acc, r) => {
      const fee = calculateFee({
        revenue: r.revenue,
        sales: r.sales,
        checkoutPercentage: r.checkoutPercentageSnapshot,
        gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
        taxPercentage: r.taxPercentageSnapshot
      });
      const profit = r.revenue.sub(r.investment.add(fee));

      acc.investment = acc.investment.add(r.investment);
      acc.revenue = acc.revenue.add(r.revenue);
      acc.fee = acc.fee.add(fee);
      acc.profit = acc.profit.add(profit);
      return acc;
    },
    {
      investment: new Decimal(0),
      revenue: new Decimal(0),
      fee: new Decimal(0),
      profit: new Decimal(0)
    }
  );

  const costs = totals.investment.add(totals.fee);
  const denom = costs;
  const roi = denom.equals(0) ? new Decimal(0) : totals.revenue.div(denom);

  const byOffer = new Map<
    string,
    {
      offerId: string;
      offerName: string;
      revenue: Decimal;
    }
  >();

  for (const r of rows) {
    const existing = byOffer.get(r.offerId) ?? {
      offerId: r.offer.id,
      offerName: r.offer.name,
      revenue: new Decimal(0)
    };
    existing.revenue = existing.revenue.add(r.revenue);
    byOffer.set(r.offerId, existing);
  }

  const topOffer = Array.from(byOffer.values())
    .sort((a, b) => b.revenue.toNumber() - a.revenue.toNumber())[0];

  return {
    profit: totals.profit.toNumber(),
    roi: roi.toNumber(),
    totalRevenue: totals.revenue.toNumber(),
    topOffer: topOffer
      ? {
          offerId: topOffer.offerId,
          offerName: topOffer.offerName,
          revenue: topOffer.revenue.toNumber(),
          percentage: totals.revenue.equals(0)
            ? 0
            : topOffer.revenue.div(totals.revenue).mul(100).toNumber()
        }
      : null
  };
}

export async function getBusinessAlerts(params: {
  workspaceId: string;
  offerId?: string;
  startDate: Date;
  endDate: Date;
}): Promise<BusinessAlert[]> {
  return measure(
    "analytics.businessAlerts",
    async () => {
      const alerts: BusinessAlert[] = [];
      const startDate = startOfDay(params.startDate);
      const endDate = endOfDayUTC(params.endDate);

      const [currentMetrics, workspace, offer] = await Promise.all([
        aggregatePeriodMetrics({
          workspaceId: params.workspaceId,
          offerId: params.offerId,
          startDate,
          endDate
        }),
        prisma.workspace.findUnique({
          where: { id: params.workspaceId },
          select: { baseCurrency: true }
        }),
        params.offerId
          ? prisma.offer.findUnique({
              where: { id: params.offerId },
              select: { currency: true }
            })
          : Promise.resolve(null)
      ]);

      const currency = (offer?.currency ??
        workspace?.baseCurrency ??
        "BRL") as CurrencyCode;

      // CRITICAL: Lucro negativo no período
      if (currentMetrics.profit < 0) {
        alerts.push({
          id: "negative-profit",
          level: "CRITICAL",
          title: "Lucro negativo detectado",
          description: `O período está fechando com prejuízo de ${formatMoney(Math.abs(currentMetrics.profit), currency)}. Revise seus investimentos e custos.`
        });
      }

      // WARNING: ROI caiu > 20% vs período anterior
      try {
        const comparison = await getPeriodComparison({
          workspaceId: params.workspaceId,
          offerId: params.offerId,
          current: { startDate, endDate },
          previous: getComparisonDateRanges("30d").previous
        });

        if (comparison.roi.deltaPct < -20) {
          alerts.push({
            id: "roi-drop",
            level: "WARNING",
            title: "Queda significativa no ROI",
            description: `O ROI caiu ${Math.abs(comparison.roi.deltaPct).toFixed(1)}% em relação ao período anterior. Considere revisar a estratégia.`
          });
        }
      } catch (error) {
        // Ignora erros de comparação (pode não haver dados suficientes)
        void error;
      }

      // WARNING: 1 oferta > 70% do faturamento
      if (currentMetrics.topOffer && currentMetrics.topOffer.percentage > 70) {
        alerts.push({
          id: "concentration-risk",
          level: "WARNING",
          title: "Concentração de receita",
          description: `A oferta "${currentMetrics.topOffer.offerName}" representa ${currentMetrics.topOffer.percentage.toFixed(1)}% do faturamento total. Considere diversificar.`
        });
      }

      // INFO: Melhor oferta do período
      if (currentMetrics.topOffer && currentMetrics.topOffer.revenue > 0) {
        alerts.push({
          id: "top-offer",
          level: "INFO",
          title: "Melhor oferta do período",
          description: `"${currentMetrics.topOffer.offerName}" foi a melhor oferta, gerando ${formatMoney(currentMetrics.topOffer.revenue, currency)} (${currentMetrics.topOffer.percentage.toFixed(1)}% do total).`
        });
      }

      // INFO: ROI médio positivo
      if (currentMetrics.roi > 1 && currentMetrics.profit > 0) {
        alerts.push({
          id: "positive-roi",
          level: "INFO",
          title: "ROI positivo",
          description: `Período com ROI de ${(currentMetrics.roi * 100).toFixed(2)}% e lucro de ${formatMoney(currentMetrics.profit, currency)}. Continue monitorando.`
        });
      }

      return alerts.sort((a, b) => {
        const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
        return order[a.level] - order[b.level];
      });
    },
    {
      workspaceId: params.workspaceId,
      offerId: params.offerId ?? null
    }
  );
}
