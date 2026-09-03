import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { calculateFee } from "@/lib/domain/finance";
import { getFinancialHealth } from "@/lib/analytics/finance-health";
import { measure } from "@/lib/observability/measure";
import { requireHistoricalAnalysis } from "@/lib/plans/authorization";
import type { CurrencyCode } from "@/lib/domain/currency";
import type { CurrencyViewMode } from "@/lib/domain/currency-view";
import {
  includeBaseCurrencyItems,
  projectAmountForView
} from "@/lib/domain/currency-projection";
import { addDaysUTC, endOfDay, startOfDay } from "@/lib/analytics/date-range-utils";

export type CashflowKpis = {
  revenueFromOffers: Decimal;
  revenueFromManual: Decimal;
  totalRevenue: Decimal;
  totalAdInvestment: Decimal;
  totalFees: Decimal;
  totalExpenses: Decimal;
  totalInvestments: Decimal;
  totalOutflow: Decimal;
  netProfit: Decimal;
  endingBalance: Decimal;
};

export type IncomeBreakdown = {
  total: number;
  bySource: {
    offers: number;
    manual: number;
  };
  manualByCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
};

export type OutflowBreakdown = {
  total: number;
  bySource: {
    manualExpenses: number;
    adInvestment: number;
    offerCosts: number;
    investments: number;
  };
  manualByCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
  offerCostsByType: {
    checkoutFee: number;
    gatewayFee: number;
    tax: number;
  };
};

export type CashflowSeriesPoint = {
  date: string; // YYYY-MM-DD
  inflow: number; // revenue
  outflow: number; // investment + fees + expenses + investments
  net: number; // inflow - outflow
  balance: number; // acumulado do net
  breakdown: {
    adInvestment: number;
    fees: number;
    expenses: number;
    investments: number;
  };
};

export type ExpenseBreakdown = {
  total: number;
  byCategory: { category: string; amount: number; percentage: number }[];
  byType: { type: string; amount: number; percentage: number }[];
};

export async function getExpenseBreakdown(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
}): Promise<ExpenseBreakdown> {
  const expenses = await prisma.expense.findMany({
    where: {
      workspaceId: params.workspaceId,
      date: { gte: params.startDate, lte: params.endDate }
    },
    include: { category: true }
  });

  const total = expenses.reduce((acc, e) => acc + e.amount.toNumber(), 0);

  const byCategoryMap = new Map<string, number>();
  const byTypeMap = new Map<string, number>();

  for (const e of expenses) {
    const category = e.category?.name ?? "Sem categoria";
    const type = e.type ?? "VARIABLE";
    const amount = e.amount.toNumber();
    byCategoryMap.set(category, (byCategoryMap.get(category) ?? 0) + amount);
    byTypeMap.set(type, (byTypeMap.get(type) ?? 0) + amount);
  }

  const denom = total === 0 ? 1 : total;

  const byCategory = Array.from(byCategoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: amount / denom
    }))
    .sort((a, b) => b.amount - a.amount);

  const byType = Array.from(byTypeMap.entries())
    .map(([type, amount]) => ({
      type,
      amount,
      percentage: amount / denom
    }))
    .sort((a, b) => b.amount - a.amount);

  return { total, byCategory, byType };
}

export function calculateCashflowProjection(params: {
  dailySeries: {
    date: string;
    revenue: number;
    outflow: number;
  }[];
  days?: number;
}) {
  const days = params.days ?? 30;
  const n = params.dailySeries.length;

  if (n === 0 || days <= 0) {
    return { dailyNetAverage: 0, projectedBalance: 0, days };
  }

  const revenueAvg =
    params.dailySeries.reduce((acc, p) => acc + p.revenue, 0) / n;
  const outflowAvg =
    params.dailySeries.reduce((acc, p) => acc + p.outflow, 0) / n;

  const dailyNetAverage = revenueAvg - outflowAvg;
  const projectedBalance = dailyNetAverage * days;

  return { dailyNetAverage, projectedBalance, days };
}

function toDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getWorkspaceCashflow(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
  /** Default CONVERTED: consolida na baseCurrency via snapshot histórico */
  currencyView?: CurrencyViewMode;
}): Promise<{
  kpis: CashflowKpis;
  series: CashflowSeriesPoint[];
  projection: { days: number; dailyNetAverage: number; projectedBalance: number };
  health: { status: "healthy" | "neutral" | "risk"; label: string };
  incomeBreakdown: IncomeBreakdown;
  outflowBreakdown: OutflowBreakdown;
  resolvedRange: { startDate: Date; endDate: Date };
  displayCurrency: CurrencyCode;
  currencyView: CurrencyViewMode;
  baseCurrency: CurrencyCode;
}> {
  return measure(
    "cashflow.workspace",
    async () => {
      // Bloqueio: Verifica limite de 30 dias para FREE
      const historicalCheck = await requireHistoricalAnalysis({
        startDate: params.startDate,
        endDate: params.endDate
      });
      
      let startDate = params.startDate;
      let endDate = params.endDate;
      
      // Se não permitido, ajusta automaticamente para 30 dias (FREE)
      if (!historicalCheck.allowed) {
        startDate = addDaysUTC(startOfDay(endDate), -29);
      }

      const finalStartDate = startOfDay(startDate);
      const finalEndDate = endOfDay(endDate);

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    select: { baseCurrency: true }
  });
  const baseCurrency = (workspace?.baseCurrency ?? "BRL") as CurrencyCode;
  const currencyView: CurrencyViewMode = params.currencyView ?? "CONVERTED";
  const displayCurrency: CurrencyCode =
    currencyView === "CONVERTED" ? baseCurrency : currencyView;
  const includeBaseItems = includeBaseCurrencyItems(currencyView, baseCurrency);

  const [daily, expenses, manualIncomes, investments] = await Promise.all([
    prisma.dailyPerformance.findMany({
      where: {
        date: { gte: finalStartDate, lte: finalEndDate },
        offer: { workspaceId: params.workspaceId },
        ...(currencyView !== "CONVERTED" ? { currency: currencyView } : {})
      },
      orderBy: { date: "asc" }
    }),
    includeBaseItems
      ? prisma.expense.findMany({
          where: {
            workspaceId: params.workspaceId,
            date: { gte: finalStartDate, lte: finalEndDate }
          },
          include: { category: true },
          orderBy: { date: "asc" }
        })
      : Promise.resolve([]),
    includeBaseItems
      ? prisma.manualIncome.findMany({
          where: {
            workspaceId: params.workspaceId,
            date: { gte: finalStartDate, lte: finalEndDate }
          },
          include: { category: true },
          orderBy: { date: "asc" }
        })
      : Promise.resolve([]),
    includeBaseItems
      ? prisma.investment.findMany({
          where: {
            workspaceId: params.workspaceId,
            date: { gte: finalStartDate, lte: finalEndDate }
          },
          orderBy: { date: "asc" }
        })
      : Promise.resolve([])
  ]);

  const totals = {
    revenue: new Decimal(0),
    revenueFromOffers: new Decimal(0),
    revenueFromManual: new Decimal(0),
    adInvestment: new Decimal(0),
    fees: new Decimal(0),
    expenses: new Decimal(0),
    investments: new Decimal(0)
  };

  const offerCostsByType = {
    checkoutFee: new Decimal(0),
    gatewayFee: new Decimal(0),
    tax: new Decimal(0)
  };

  const byDay = new Map<
    string,
    { revenue: Decimal; adInvestment: Decimal; fees: Decimal; expenses: Decimal; investments: Decimal }
  >();

  for (const r of daily) {
    const dayKey = toDateKey(startOfDayUTC(r.date));
    const currency = r.currency as CurrencyCode;
    const rate = r.exchangeRateSnapshot;

    const project = (amount: Decimal) =>
      projectAmountForView({
        amount,
        currency,
        exchangeRateSnapshot: rate,
        view: currencyView
      });

    const revenue = project(r.revenue);
    const investment = project(r.investment);
    if (revenue === null || investment === null) continue;

    const checkoutFeeNative = r.revenue.mul(r.checkoutPercentageSnapshot);
    const gatewayFeeNative = new Decimal(r.sales).mul(r.gatewayFeePerSaleSnapshot);
    const taxNative = r.revenue.mul(r.taxPercentageSnapshot);
    const feeNative = calculateFee({
      revenue: r.revenue,
      sales: r.sales,
      checkoutPercentage: r.checkoutPercentageSnapshot,
      gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
      taxPercentage: r.taxPercentageSnapshot
    });

    const checkoutFee = project(checkoutFeeNative)!;
    const gatewayFee = project(gatewayFeeNative)!;
    const tax = project(taxNative)!;
    const fee = project(feeNative)!;

    totals.revenueFromOffers = totals.revenueFromOffers.add(revenue);
    totals.revenue = totals.revenue.add(revenue);
    totals.adInvestment = totals.adInvestment.add(investment);
    totals.fees = totals.fees.add(fee);

    offerCostsByType.checkoutFee = offerCostsByType.checkoutFee.add(checkoutFee);
    offerCostsByType.gatewayFee = offerCostsByType.gatewayFee.add(gatewayFee);
    offerCostsByType.tax = offerCostsByType.tax.add(tax);

    const current = byDay.get(dayKey) ?? {
      revenue: new Decimal(0),
      adInvestment: new Decimal(0),
      fees: new Decimal(0),
      expenses: new Decimal(0),
      investments: new Decimal(0)
    };
    current.revenue = current.revenue.add(revenue);
    current.adInvestment = current.adInvestment.add(investment);
    current.fees = current.fees.add(fee);
    byDay.set(dayKey, current);
  }

  for (const inc of manualIncomes) {
    const dayKey = toDateKey(startOfDayUTC(inc.date));

    totals.revenueFromManual = totals.revenueFromManual.add(inc.amount);
    totals.revenue = totals.revenue.add(inc.amount);

    const current = byDay.get(dayKey) ?? {
      revenue: new Decimal(0),
      adInvestment: new Decimal(0),
      fees: new Decimal(0),
      expenses: new Decimal(0),
      investments: new Decimal(0)
    };
    current.revenue = current.revenue.add(inc.amount);
    byDay.set(dayKey, current);
  }

  for (const e of expenses) {
    const dayKey = toDateKey(startOfDayUTC(e.date));

    totals.expenses = totals.expenses.add(e.amount);

    const current = byDay.get(dayKey) ?? {
      revenue: new Decimal(0),
      adInvestment: new Decimal(0),
      fees: new Decimal(0),
      expenses: new Decimal(0),
      investments: new Decimal(0)
    };
    current.expenses = current.expenses.add(e.amount);
    byDay.set(dayKey, current);
  }

  for (const inv of investments) {
    const dayKey = toDateKey(startOfDayUTC(inv.date));
    totals.investments = totals.investments.add(inv.amount);
    const current = byDay.get(dayKey) ?? {
      revenue: new Decimal(0),
      adInvestment: new Decimal(0),
      fees: new Decimal(0),
      expenses: new Decimal(0),
      investments: new Decimal(0)
    };
    current.investments = current.investments.add(inv.amount);
    byDay.set(dayKey, current);
  }

  const totalOutflow = totals.adInvestment.add(totals.fees).add(totals.expenses).add(totals.investments);
  const netProfit = totals.revenue.sub(totalOutflow);

  const series: CashflowSeriesPoint[] = [];
  let balance = new Decimal(0);

  const cursor = startOfDayUTC(finalStartDate);
  const endDay = startOfDayUTC(finalEndDate);
  while (cursor <= endDay) {
    const key = toDateKey(cursor);
    const v = byDay.get(key) ?? {
      revenue: new Decimal(0),
      adInvestment: new Decimal(0),
      fees: new Decimal(0),
      expenses: new Decimal(0),
      investments: new Decimal(0)
    };

    const inflow = v.revenue;
    const outflow = v.adInvestment.add(v.fees).add(v.expenses).add(v.investments);
    const net = inflow.sub(outflow);
    balance = balance.add(net);

    series.push({
      date: key,
      inflow: inflow.toNumber(),
      outflow: outflow.toNumber(),
      net: net.toNumber(),
      balance: balance.toNumber(),
      breakdown: {
        adInvestment: v.adInvestment.toNumber(),
        fees: v.fees.toNumber(),
        expenses: v.expenses.toNumber(),
        investments: v.investments.toNumber()
      }
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const projection = calculateCashflowProjection({
    dailySeries: series.map((p) => ({
      date: p.date,
      revenue: p.inflow,
      outflow: p.outflow
    })),
    days: 30
  });

  const incomeBreakdown: IncomeBreakdown = (() => {
    const offers = totals.revenueFromOffers.toNumber();
    const manual = totals.revenueFromManual.toNumber();
    const manualTotal = manual === 0 ? 1 : manual;

    const byCat = new Map<string, { categoryId: string | null; categoryName: string; amount: number }>();
    for (const inc of manualIncomes) {
      const categoryId = inc.categoryId ?? null;
      const categoryName = inc.category?.name ?? "Sem categoria";
      const key = categoryId ?? `null:${categoryName}`;
      const current = byCat.get(key) ?? { categoryId, categoryName, amount: 0 };
      current.amount += inc.amount.toNumber();
      byCat.set(key, current);
    }

    const manualByCategory = Array.from(byCat.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        amount: c.amount,
        percentage: manual === 0 ? 0 : c.amount / manualTotal
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      total: offers + manual,
      bySource: { offers, manual },
      manualByCategory
    };
  })();

  const outflowBreakdown: OutflowBreakdown = (() => {
    const manualExpenses = totals.expenses.toNumber();
    const adInvestment = totals.adInvestment.toNumber();
    const offerCosts = totals.fees.toNumber();
    const investmentsTotal = totals.investments.toNumber();
    const manualDenom = manualExpenses === 0 ? 1 : manualExpenses;

    const byCat = new Map<string, { categoryId: string | null; categoryName: string; amount: number }>();
    for (const e of expenses) {
      const categoryId = e.categoryId ?? null;
      const categoryName = e.category?.name ?? "Sem categoria";
      const key = categoryId ?? `null:${categoryName}`;
      const current = byCat.get(key) ?? { categoryId, categoryName, amount: 0 };
      current.amount += e.amount.toNumber();
      byCat.set(key, current);
    }

    const manualByCategory = Array.from(byCat.values())
      .map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        amount: c.amount,
        percentage: manualExpenses === 0 ? 0 : c.amount / manualDenom
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      total: manualExpenses + adInvestment + offerCosts + investmentsTotal,
      bySource: { manualExpenses, adInvestment, offerCosts, investments: investmentsTotal },
      manualByCategory,
      offerCostsByType: {
        checkoutFee: offerCostsByType.checkoutFee.toNumber(),
        gatewayFee: offerCostsByType.gatewayFee.toNumber(),
        tax: offerCostsByType.tax.toNumber()
      }
    };
  })();

  return {
    kpis: {
      revenueFromOffers: totals.revenueFromOffers,
      revenueFromManual: totals.revenueFromManual,
      totalRevenue: totals.revenue,
      totalAdInvestment: totals.adInvestment,
      totalFees: totals.fees,
      totalExpenses: totals.expenses,
      totalInvestments: totals.investments,
      totalOutflow,
      netProfit,
      endingBalance: balance
    },
    series,
    projection,
      health: getFinancialHealth(netProfit),
      incomeBreakdown,
      outflowBreakdown,
      resolvedRange: { startDate: finalStartDate, endDate: finalEndDate },
      displayCurrency,
      currencyView,
      baseCurrency
    };
  },
  {
    workspaceId: params.workspaceId
  });
}


