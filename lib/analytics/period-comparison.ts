import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import type { CurrencyViewMode } from "@/lib/domain/currency-view";
import { measure } from "@/lib/observability/measure";
import { performanceMoneyInView } from "./performance-money";

export type ComparisonMetric = {
  current: number;
  previous: number;
  delta: number;
  deltaPct: number;
};

export type PeriodComparisonResult = {
  investment: ComparisonMetric;
  revenue: ComparisonMetric;
  costs: ComparisonMetric;
  profit: ComparisonMetric;
  roi: ComparisonMetric;
};

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function aggregatePeriod(params: {
  workspaceId: string;
  offerId?: string;
  startDate: Date;
  endDate: Date;
  currencyView: CurrencyViewMode | "NATIVE";
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
      },
      ...(params.currencyView !== "CONVERTED" && params.currencyView !== "NATIVE"
        ? { currency: params.currencyView }
        : {})
    },
    orderBy: { date: "asc" }
  });

  const totals = rows.reduce(
    (acc, r) => {
      const money =
        params.currencyView === "NATIVE"
          ? performanceMoneyInView(r, r.currency as CurrencyViewMode)
          : performanceMoneyInView(r, params.currencyView);
      if (!money) return acc;

      acc.investment = acc.investment.add(money.investment);
      acc.revenue = acc.revenue.add(money.revenue);
      acc.fee = acc.fee.add(money.fee);
      acc.profit = acc.profit.add(money.profit);
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

  return {
    investment: totals.investment.toNumber(),
    revenue: totals.revenue.toNumber(),
    costs: costs.toNumber(),
    profit: totals.profit.toNumber(),
    roi: roi.toNumber()
  };
}

function calculateDeltaMetric(current: number, previous: number): ComparisonMetric {
  const delta = current - previous;
  const deltaPct = previous === 0 ? 0 : (delta / Math.abs(previous)) * 100;

  return {
    current,
    previous,
    delta,
    deltaPct
  };
}

export async function getPeriodComparison(params: {
  workspaceId: string;
  offerId?: string;
  current: { startDate: Date; endDate: Date };
  previous: { startDate: Date; endDate: Date };
  /** Sem offerId, o padrão converte para a moeda base. Uma oferta fica na moeda dela. */
  currencyView?: CurrencyViewMode;
}): Promise<PeriodComparisonResult> {
  return measure(
    "analytics.periodComparison",
    async () => {
      const currentStart = startOfDayUTC(params.current.startDate);
      const currentEnd = startOfDayUTC(params.current.endDate);
      const previousStart = startOfDayUTC(params.previous.startDate);
      const previousEnd = startOfDayUTC(params.previous.endDate);
      const currencyView: CurrencyViewMode | "NATIVE" =
        params.currencyView ?? (params.offerId ? "NATIVE" : "CONVERTED");

      const [current, previous] = await Promise.all([
        aggregatePeriod({
          workspaceId: params.workspaceId,
          offerId: params.offerId,
          startDate: currentStart,
          endDate: currentEnd,
          currencyView
        }),
        aggregatePeriod({
          workspaceId: params.workspaceId,
          offerId: params.offerId,
          startDate: previousStart,
          endDate: previousEnd,
          currencyView
        })
      ]);

      return {
        investment: calculateDeltaMetric(current.investment, previous.investment),
        revenue: calculateDeltaMetric(current.revenue, previous.revenue),
        costs: calculateDeltaMetric(current.costs, previous.costs),
        profit: calculateDeltaMetric(current.profit, previous.profit),
        roi: calculateDeltaMetric(current.roi, previous.roi)
      };
    },
    {
      workspaceId: params.workspaceId,
      offerId: params.offerId ?? null
    }
  );
}
