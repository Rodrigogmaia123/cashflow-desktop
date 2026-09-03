import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { calculateFee } from "@/lib/domain/finance";
import type { CurrencyCode } from "@/lib/domain/currency";
import type { CurrencyViewMode } from "@/lib/domain/currency-view";
import { resolveDisplayCurrency } from "@/lib/domain/currency-view";
import { projectAmountForView } from "@/lib/domain/currency-projection";
import {
  resolveDateRange,
  resolvePreviousDateRange,
  type DashboardRange
} from "@/lib/analytics/date-range";
import { resolveDateRange as resolveOfferDateRange, type AnalyticsRangeValue } from "@/lib/analytics/ranges";
import { measure } from "@/lib/observability/measure";

export type DashboardKpis = {
  investmentTotal: Decimal;
  revenueTotal: Decimal;
  feeTotal: Decimal;
  salesTotal: number;
  profitTotal: Decimal;
  roiWeighted: Decimal;
};

export type DashboardComparison = {
  previous: {
    profitTotal: Decimal;
    roiWeighted: Decimal;
  };
  delta: {
    profitPct: Decimal | null;
    roiPct: Decimal | null;
  };
};

export type DashboardSeriesPoint = {
  date: string; // YYYY-MM-DD
  investment: number;
  revenue: number;
  sales: number;
  fee: number;
  profit: number;
  roi: number;
  checkoutPct: number;
  taxPct: number;
  offers?: Array<{
    offerId: string;
    offerName: string;
    investment: number;
    revenue: number;
    fee: number;
    profit: number;
  }>;
};

export type WorkspaceTopOffer = {
  offerId: string;
  offerName: string;
  investment: number;
  revenue: number;
  sales: number;
  fee: number;
  profit: number;
  roi: number; // revenue / (investment + fee)
};

export type OfferDashboardKpis = {
  investmentTotal: Decimal;
  revenueTotal: Decimal;
  salesTotal: number;
  feeTotal: Decimal;
  profitTotal: Decimal;
  roiWeighted: Decimal;
};

export type OfferDashboardSeriesPoint = {
  date: string; // YYYY-MM-DD
  investment: number;
  revenue: number;
  sales: number;
  fee: number;
  profit: number;
  roi: number; // fração (ex: 1.25 = 125%)
  checkoutPct: number; // fração (ex: 0.1 = 10%)
  taxPct: number; // fração (ex: 0.06 = 6%)
};

function toDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function aggregateWorkspaceRange(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
  offerId?: string;
  currencyView: CurrencyViewMode;
}) {
  const rows = await prisma.dailyPerformance.findMany({
    where: {
      date: {
        gte: params.startDate,
        lte: params.endDate
      },
      offer: {
        workspaceId: params.workspaceId
      },
      ...(params.offerId ? { offerId: params.offerId } : {}),
      ...(params.currencyView !== "CONVERTED" ? { currency: params.currencyView } : {})
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
      const currency = r.currency as CurrencyCode;
      const rate = r.exchangeRateSnapshot;
      const project = (amount: Decimal) =>
        projectAmountForView({
          amount,
          currency,
          exchangeRateSnapshot: rate,
          view: params.currencyView
        });

      const investment = project(r.investment);
      const revenue = project(r.revenue);
      if (investment === null || revenue === null) return acc;

      const feeNative = calculateFee({
        revenue: r.revenue,
        sales: r.sales,
        checkoutPercentage: r.checkoutPercentageSnapshot,
        gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
        taxPercentage: r.taxPercentageSnapshot
      });
      const fee = project(feeNative);
      if (fee === null) return acc;

      const profitNative = r.revenue.sub(r.investment.add(feeNative));
      const profit = project(profitNative);
      if (profit === null) return acc;

      acc.investment = acc.investment.add(investment);
      acc.revenue = acc.revenue.add(revenue);
      acc.fee = acc.fee.add(fee);
      acc.profit = acc.profit.add(profit);
      acc.sales += r.sales;
      return acc;
    },
    {
      investment: new Decimal(0),
      revenue: new Decimal(0),
      fee: new Decimal(0),
      profit: new Decimal(0),
      sales: 0
    }
  );

  const denom = totals.investment.add(totals.fee);
  const roiWeighted = denom.equals(0) ? new Decimal(0) : totals.revenue.div(denom);

  return {
    rows,
    kpis: {
      investmentTotal: totals.investment,
      revenueTotal: totals.revenue,
      feeTotal: totals.fee,
      salesTotal: totals.sales,
      profitTotal: totals.profit,
      roiWeighted
    } satisfies DashboardKpis
  };
}

function pctChange(params: { current: Decimal; previous: Decimal }) {
  if (params.previous.equals(0)) return null;
  return params.current.sub(params.previous).div(params.previous.abs());
}

export async function getWorkspaceDashboard(params: {
  workspaceId: string;
  range: DashboardRange;
  offerId?: string;
  /** Default CONVERTED: consolida na baseCurrency via snapshot histórico */
  currencyView?: CurrencyViewMode;
}): Promise<{
  kpis: DashboardKpis;
  dailySeries: DashboardSeriesPoint[];
  cumulativeSeries: DashboardSeriesPoint[];
  topOffers: WorkspaceTopOffer[];
  comparison: DashboardComparison;
  resolvedRange: { startDate: Date; endDate: Date };
  displayCurrency: CurrencyCode;
  currencyView: CurrencyViewMode;
  baseCurrency: CurrencyCode;
}> {
  return measure(
    "dashboard.workspace",
    async () => {
      const { startDate, endDate } = resolveDateRange(params.range);

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    select: { baseCurrency: true }
  });
  const baseCurrency = (workspace?.baseCurrency ?? "BRL") as CurrencyCode;
  const currencyView: CurrencyViewMode = params.currencyView ?? "CONVERTED";
  const displayCurrency = resolveDisplayCurrency(currencyView, baseCurrency);

  const current = await aggregateWorkspaceRange({
    workspaceId: params.workspaceId,
    startDate,
    endDate,
    offerId: params.offerId,
    currencyView
  });

  const previousRange = resolvePreviousDateRange({ startDate, endDate });
  const previous = await aggregateWorkspaceRange({
    workspaceId: params.workspaceId,
    startDate: previousRange.startDate,
    endDate: previousRange.endDate,
    offerId: params.offerId,
    currencyView
  });

  // Série diária agregada (por dia)
  const byDay = new Map<
    string,
    {
      investment: Decimal;
      revenue: Decimal;
      fee: Decimal;
      profit: Decimal;
      sales: number;
      checkoutWeighted: Decimal;
      taxWeighted: Decimal;
    }
  >();

  const byDayOffers = new Map<
    string,
    Map<
      string,
      {
        offerId: string;
        offerName: string;
        investment: Decimal;
        revenue: Decimal;
        fee: Decimal;
        profit: Decimal;
        sales: number;
      }
    >
  >();

  const byOfferTotals = new Map<
    string,
    {
      offerId: string;
      offerName: string;
      investment: Decimal;
      revenue: Decimal;
      fee: Decimal;
      profit: Decimal;
      sales: number;
    }
  >();

  for (const r of current.rows) {
    const dayKey = toDateKey(startOfDayUTC(r.date));
    const offerId = r.offer.id;
    const offerName = r.offer.name;
    const currency = r.currency as CurrencyCode;
    const rate = r.exchangeRateSnapshot;
    const project = (amount: Decimal) =>
      projectAmountForView({
        amount,
        currency,
        exchangeRateSnapshot: rate,
        view: currencyView
      });

    const investment = project(r.investment);
    const revenue = project(r.revenue);
    if (investment === null || revenue === null) continue;

    const feeNative = calculateFee({
      revenue: r.revenue,
      sales: r.sales,
      checkoutPercentage: r.checkoutPercentageSnapshot,
      gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
      taxPercentage: r.taxPercentageSnapshot
    });
    const fee = project(feeNative);
    if (fee === null) continue;

    const profitNative = r.revenue.sub(r.investment.add(feeNative));
    const profit = project(profitNative);
    if (profit === null) continue;

    const day = byDay.get(dayKey) ?? {
      investment: new Decimal(0),
      revenue: new Decimal(0),
      fee: new Decimal(0),
      profit: new Decimal(0),
      sales: 0,
      checkoutWeighted: new Decimal(0),
      taxWeighted: new Decimal(0)
    };
    day.investment = day.investment.add(investment);
    day.revenue = day.revenue.add(revenue);
    day.fee = day.fee.add(fee);
    day.profit = day.profit.add(profit);
    day.sales += r.sales;
    day.checkoutWeighted = day.checkoutWeighted.add(
      revenue.mul(r.checkoutPercentageSnapshot)
    );
    day.taxWeighted = day.taxWeighted.add(revenue.mul(r.taxPercentageSnapshot));
    byDay.set(dayKey, day);

    // Atribuição por oferta no dia (para tooltip)
    const dayOffers = byDayOffers.get(dayKey) ?? new Map();
    const existingOffer = dayOffers.get(offerId) ?? {
      offerId,
      offerName,
      investment: new Decimal(0),
      revenue: new Decimal(0),
      fee: new Decimal(0),
      profit: new Decimal(0),
      sales: 0
    };
    existingOffer.investment = existingOffer.investment.add(investment);
    existingOffer.revenue = existingOffer.revenue.add(revenue);
    existingOffer.fee = existingOffer.fee.add(fee);
    existingOffer.profit = existingOffer.profit.add(profit);
    existingOffer.sales += r.sales;
    dayOffers.set(offerId, existingOffer);
    byDayOffers.set(dayKey, dayOffers);

    // Totais por oferta no período (para ranking)
    const offerTotals = byOfferTotals.get(offerId) ?? {
      offerId,
      offerName,
      investment: new Decimal(0),
      revenue: new Decimal(0),
      fee: new Decimal(0),
      profit: new Decimal(0),
      sales: 0
    };
    offerTotals.investment = offerTotals.investment.add(investment);
    offerTotals.revenue = offerTotals.revenue.add(revenue);
    offerTotals.fee = offerTotals.fee.add(fee);
    offerTotals.profit = offerTotals.profit.add(profit);
    offerTotals.sales += r.sales;
    byOfferTotals.set(offerId, offerTotals);
  }

  // Preenche dias faltantes com zero
  const dailySeries: DashboardSeriesPoint[] = [];
  const cursor = startOfDayUTC(startDate);
  const endDay = startOfDayUTC(endDate);
  while (cursor <= endDay) {
    const key = toDateKey(cursor);
    const v = byDay.get(key);
    const inv = v ? v.investment : new Decimal(0);
    const rev = v ? v.revenue : new Decimal(0);
    const fee = v ? v.fee : new Decimal(0);
    const profit = v ? v.profit : new Decimal(0);
    const denomDay = inv.add(fee);
    const roi = denomDay.equals(0) ? 0 : rev.div(denomDay).toNumber();
    const checkoutPct = rev.equals(0)
      ? 0
      : (v?.checkoutWeighted ?? new Decimal(0)).div(rev).toNumber();
    const taxPct = rev.equals(0)
      ? 0
      : (v?.taxWeighted ?? new Decimal(0)).div(rev).toNumber();

    const offers = (() => {
      const dayOffers = byDayOffers.get(key);
      if (!dayOffers) return undefined;
      const list = Array.from(dayOffers.values())
        .map((o) => ({
          offerId: o.offerId,
          offerName: o.offerName,
          investment: o.investment.toNumber(),
          revenue: o.revenue.toNumber(),
          fee: o.fee.toNumber(),
          profit: o.profit.toNumber()
        }))
        .filter((o) => o.investment !== 0 || o.revenue !== 0 || o.fee !== 0 || o.profit !== 0)
        .sort((a, b) => b.revenue - a.revenue);
      return list.length ? list : undefined;
    })();

    dailySeries.push({
      date: key,
      investment: inv.toNumber(),
      revenue: rev.toNumber(),
      sales: v ? v.sales : 0,
      fee: fee.toNumber(),
      profit: profit.toNumber(),
      roi,
      checkoutPct,
      taxPct,
      offers
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Série acumulada (server-side, para evitar cálculos no client)
  const cumulativeSeries: DashboardSeriesPoint[] = [];
  let cumInv = new Decimal(0);
  let cumRev = new Decimal(0);
  let cumFee = new Decimal(0);
  let cumProfit = new Decimal(0);
  let cumSales = 0;
  let cumCheckoutWeighted = new Decimal(0);
  let cumTaxWeighted = new Decimal(0);

  for (const p of dailySeries) {
    cumInv = cumInv.add(new Decimal(p.investment));
    cumRev = cumRev.add(new Decimal(p.revenue));
    cumFee = cumFee.add(new Decimal(p.fee));
    cumProfit = cumProfit.add(new Decimal(p.profit));
    cumSales += p.sales;
    cumCheckoutWeighted = cumCheckoutWeighted.add(
      new Decimal(p.revenue).mul(new Decimal(p.checkoutPct))
    );
    cumTaxWeighted = cumTaxWeighted.add(
      new Decimal(p.revenue).mul(new Decimal(p.taxPct))
    );

    const denomCum = cumInv.add(cumFee);
    const roi = denomCum.equals(0) ? 0 : cumRev.div(denomCum).toNumber();
    const checkoutPct = cumRev.equals(0) ? 0 : cumCheckoutWeighted.div(cumRev).toNumber();
    const taxPct = cumRev.equals(0) ? 0 : cumTaxWeighted.div(cumRev).toNumber();

    cumulativeSeries.push({
      date: p.date,
      investment: cumInv.toNumber(),
      revenue: cumRev.toNumber(),
      sales: cumSales,
      fee: cumFee.toNumber(),
      profit: cumProfit.toNumber(),
      roi,
      checkoutPct,
      taxPct
    });
  }

  const topOffers: WorkspaceTopOffer[] = Array.from(byOfferTotals.values())
    .map((o) => {
      const denomOffer = o.investment.add(o.fee);
      const roi = denomOffer.equals(0) ? 0 : o.revenue.div(denomOffer).toNumber();
      return {
        offerId: o.offerId,
        offerName: o.offerName,
        investment: o.investment.toNumber(),
        revenue: o.revenue.toNumber(),
        sales: o.sales,
        fee: o.fee.toNumber(),
        profit: o.profit.toNumber(),
        roi
      };
    })
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  return {
    kpis: current.kpis,
    dailySeries,
    cumulativeSeries,
    topOffers,
      comparison: {
        previous: {
          profitTotal: previous.kpis.profitTotal,
          roiWeighted: previous.kpis.roiWeighted
        },
        delta: {
          profitPct: pctChange({
            current: current.kpis.profitTotal,
            previous: previous.kpis.profitTotal
          }),
          roiPct: pctChange({
            current: current.kpis.roiWeighted,
            previous: previous.kpis.roiWeighted
          })
        }
      },
      resolvedRange: { startDate, endDate },
      displayCurrency,
      currencyView,
      baseCurrency
    };
  },
  {
    workspaceId: params.workspaceId,
    rangeType: params.range.type === "absolute" ? "absolute" : "relative"
  });
}

export async function getOfferDashboard(params: {
  workspaceId: string;
  offerId: string;
  range?: AnalyticsRangeValue | "today";
  startDate?: Date;
  endDate?: Date;
  /** Default: moeda nativa da oferta (sem conversão). Use CONVERTED para projetar via snapshot. */
  currencyView?: CurrencyViewMode;
}): Promise<{
  kpis: OfferDashboardKpis;
  dailySeries: OfferDashboardSeriesPoint[];
  cumulativeSeries: OfferDashboardSeriesPoint[];
  resolvedRange: { startDate: Date; endDate: Date };
  displayCurrency: CurrencyCode;
}> {
  return measure(
    "dashboard.offer",
    async () => {
      const offer = await prisma.offer.findFirst({
        where: { id: params.offerId, workspaceId: params.workspaceId }
      });

      if (!offer) {
        throw new Error("Oferta não encontrada no workspace atual.");
      }

      const offerCurrency = offer.currency as CurrencyCode;
      // Oferta é single-currency: nativo por padrão; só projeta se CONVERTED for pedido.
      const currencyView: CurrencyViewMode = params.currencyView ?? offerCurrency;

      const workspace = await prisma.workspace.findUnique({
        where: { id: params.workspaceId },
        select: { baseCurrency: true }
      });
      const baseCurrency = (workspace?.baseCurrency ?? "BRL") as CurrencyCode;
      const displayCurrency =
        currencyView === "CONVERTED" ? baseCurrency : offerCurrency;

      const resolvedRange =
        params.startDate && params.endDate
          ? resolveOfferDateRange({ startDate: params.startDate, endDate: params.endDate })
          : resolveOfferDateRange({ range: params.range ?? "30d" });

      const rows = await prisma.dailyPerformance.findMany({
        where: {
          offerId: offer.id,
          date: {
            gte: resolvedRange.startDate,
            lte: resolvedRange.endDate
          }
        },
        orderBy: { date: "asc" }
      });

      const totals = rows.reduce(
        (acc, r) => {
          const currency = r.currency as CurrencyCode;
          const rate = r.exchangeRateSnapshot;
          const project = (amount: Decimal) =>
            projectAmountForView({
              amount,
              currency,
              exchangeRateSnapshot: rate,
              view: currencyView
            });

          const investment = project(r.investment);
          const revenue = project(r.revenue);
          if (investment === null || revenue === null) return acc;

          const feeNative = calculateFee({
            revenue: r.revenue,
            sales: r.sales,
            checkoutPercentage: r.checkoutPercentageSnapshot,
            gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
            taxPercentage: r.taxPercentageSnapshot
          });
          const fee = project(feeNative);
          if (fee === null) return acc;

          const profitNative = r.revenue.sub(r.investment.add(feeNative));
          const profit = project(profitNative);
          if (profit === null) return acc;

          acc.investment = acc.investment.add(investment);
          acc.revenue = acc.revenue.add(revenue);
          acc.fee = acc.fee.add(fee);
          acc.profit = acc.profit.add(profit);
          acc.sales += r.sales;
          return acc;
        },
        {
          investment: new Decimal(0),
          revenue: new Decimal(0),
          fee: new Decimal(0),
          profit: new Decimal(0),
          sales: 0
        }
      );

      const denom = totals.investment.add(totals.fee);
      const roiWeighted = denom.equals(0) ? new Decimal(0) : totals.revenue.div(denom);

      // Agregação por dia (normalizada + zeros)
      const byDay = new Map<
        string,
        {
          investment: Decimal;
          revenue: Decimal;
          fee: Decimal;
          profit: Decimal;
          sales: number;
          checkoutPct: Decimal;
          taxPct: Decimal;
        }
      >();

      for (const r of rows) {
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

    const investment = project(r.investment);
    const revenue = project(r.revenue);
    if (investment === null || revenue === null) continue;

    const feeNative = calculateFee({
      revenue: r.revenue,
      sales: r.sales,
      checkoutPercentage: r.checkoutPercentageSnapshot,
      gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
      taxPercentage: r.taxPercentageSnapshot
    });
    const fee = project(feeNative);
    if (fee === null) continue;

    const profitNative = r.revenue.sub(r.investment.add(feeNative));
    const profit = project(profitNative);
    if (profit === null) continue;

    const current = byDay.get(dayKey) ?? {
      investment: new Decimal(0),
      revenue: new Decimal(0),
      fee: new Decimal(0),
      profit: new Decimal(0),
      sales: 0,
      checkoutPct: new Decimal(0),
      taxPct: new Decimal(0)
    };
    current.investment = current.investment.add(investment);
    current.revenue = current.revenue.add(revenue);
    current.fee = current.fee.add(fee);
    current.profit = current.profit.add(profit);
    current.sales += r.sales;
    // DailyPerformance é único por offerId+date, então snapshots por dia são estáveis.
    current.checkoutPct = r.checkoutPercentageSnapshot;
    current.taxPct = r.taxPercentageSnapshot;
    byDay.set(dayKey, current);
  }

  const dailySeries: OfferDashboardSeriesPoint[] = [];
  const cursor = startOfDayUTC(resolvedRange.startDate);
  const endDay = startOfDayUTC(resolvedRange.endDate);
  while (cursor <= endDay) {
    const key = toDateKey(cursor);
    const v = byDay.get(key);
    const inv = v ? v.investment : new Decimal(0);
    const rev = v ? v.revenue : new Decimal(0);
    const fee = v ? v.fee : new Decimal(0);
    const profit = v ? v.profit : new Decimal(0);
    const checkoutPct = v ? v.checkoutPct : new Decimal(0);
    const taxPct = v ? v.taxPct : new Decimal(0);
    const denomDay = inv.add(fee);
    const roi = denomDay.equals(0) ? 0 : rev.div(denomDay).toNumber();

    dailySeries.push({
      date: key,
      investment: inv.toNumber(),
      revenue: rev.toNumber(),
      sales: v ? v.sales : 0,
      fee: fee.toNumber(),
      profit: profit.toNumber(),
      roi,
      checkoutPct: checkoutPct.toNumber(),
      taxPct: taxPct.toNumber()
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Série acumulada (para gráfico “total”)
  const cumulativeSeries: OfferDashboardSeriesPoint[] = [];
  let cumInv = new Decimal(0);
  let cumRev = new Decimal(0);
  let cumFee = new Decimal(0);
  let cumProfit = new Decimal(0);
  let cumSales = 0;
  let cumCheckoutWeighted = new Decimal(0);
  let cumTaxWeighted = new Decimal(0);

  for (const p of dailySeries) {
    cumInv = cumInv.add(new Decimal(p.investment));
    cumRev = cumRev.add(new Decimal(p.revenue));
    cumFee = cumFee.add(new Decimal(p.fee));
    cumProfit = cumProfit.add(new Decimal(p.profit));
    cumSales += p.sales;
    // médias ponderadas por receita (quando receita = 0, mantém 0)
    cumCheckoutWeighted = cumCheckoutWeighted.add(
      new Decimal(p.revenue).mul(new Decimal(p.checkoutPct))
    );
    cumTaxWeighted = cumTaxWeighted.add(
      new Decimal(p.revenue).mul(new Decimal(p.taxPct))
    );
    const denomCum = cumInv.add(cumFee);
    const roi = denomCum.equals(0) ? 0 : cumRev.div(denomCum).toNumber();
    const checkoutPct = cumRev.equals(0) ? 0 : cumCheckoutWeighted.div(cumRev).toNumber();
    const taxPct = cumRev.equals(0) ? 0 : cumTaxWeighted.div(cumRev).toNumber();

    cumulativeSeries.push({
      date: p.date,
      investment: cumInv.toNumber(),
      revenue: cumRev.toNumber(),
      sales: cumSales,
      fee: cumFee.toNumber(),
      profit: cumProfit.toNumber(),
      roi,
      checkoutPct,
      taxPct
    });
  }

        return {
          kpis: {
            investmentTotal: totals.investment,
            revenueTotal: totals.revenue,
            salesTotal: totals.sales,
            feeTotal: totals.fee,
            profitTotal: totals.profit,
            roiWeighted
          },
          dailySeries,
          cumulativeSeries,
          resolvedRange,
          displayCurrency
        };
      },
      {
        workspaceId: params.workspaceId,
        offerId: params.offerId,
        rangeType: params.range ? "relative" : params.startDate ? "absolute" : "default"
      }
    );
  }

export type WorkspaceComparisonMetric = "revenue" | "profit" | "roi";

export type WorkspaceComparisonPoint = {
  date: string; // YYYY-MM-DD
  series: Array<{
    offerId: string;
    offerName: string;
    value: number;
    color: string;
  }>;
};

function endOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function iterateDateKeysUTC(params: { startDate: Date; endDate: Date }) {
  const keys: string[] = [];
  const cursor = startOfDayUTC(params.startDate);
  const end = startOfDayUTC(params.endDate);
  while (cursor <= end) {
    keys.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

const offerColorPalette = [
  "#16a34a", // green
  "#2563eb", // blue
  "#ea580c", // orange
  "#7c3aed", // violet
  "#dc2626", // red
  "#0ea5e9" // sky
] as const;

function colorForOfferId(offerId: string) {
  let hash = 0;
  for (let i = 0; i < offerId.length; i++) {
    hash = (hash * 31 + offerId.charCodeAt(i)) >>> 0;
  }
  return offerColorPalette[hash % offerColorPalette.length];
}

export async function getWorkspaceComparisonDashboard(params: {
  workspaceId: string;
  offerIds: string[];
  startDate: Date;
  endDate: Date;
  metric: WorkspaceComparisonMetric;
}): Promise<{
  points: WorkspaceComparisonPoint[];
  resolvedRange: { startDate: Date; endDate: Date };
  metric: WorkspaceComparisonMetric;
}> {
  const startDate = startOfDayUTC(params.startDate);
  const endDate = endOfDayUTC(params.endDate);

  // segurança multi-tenant: valida ofertas no workspace
  const offers = await prisma.offer.findMany({
    where: {
      workspaceId: params.workspaceId,
      id: { in: params.offerIds }
    },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" }
  });

  if (offers.length === 0) {
    return {
      points: [],
      resolvedRange: { startDate, endDate },
      metric: params.metric
    };
  }

  const offerNameById = new Map(offers.map((o) => [o.id, o.name]));

  const rows = await prisma.dailyPerformance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      offerId: { in: offers.map((o) => o.id) },
      offer: { workspaceId: params.workspaceId }
    },
    include: {
      offer: { select: { id: true, name: true } }
    },
    orderBy: { date: "asc" }
  });

  const byDateOffer = new Map<string, Map<string, number>>();

  for (const r of rows) {
    const key = toDateKey(startOfDayUTC(r.date));
    const fee = calculateFee({
      revenue: r.revenue,
      sales: r.sales,
      checkoutPercentage: r.checkoutPercentageSnapshot,
      gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
      taxPercentage: r.taxPercentageSnapshot
    });
    const profit = r.revenue.sub(r.investment.add(fee));
    const denom = r.investment.add(fee);
    const roi = denom.equals(0) ? 0 : r.revenue.div(denom).toNumber();

    const value =
      params.metric === "revenue"
        ? r.revenue.toNumber()
        : params.metric === "profit"
          ? profit.toNumber()
          : roi;

    const m = byDateOffer.get(key) ?? new Map<string, number>();
    m.set(r.offerId, value);
    byDateOffer.set(key, m);
  }

  const dateKeys = iterateDateKeysUTC({ startDate, endDate });
  const points: WorkspaceComparisonPoint[] = dateKeys.map((date) => {
    const values = byDateOffer.get(date) ?? new Map<string, number>();
    return {
      date,
      series: offers.map((o) => ({
        offerId: o.id,
        offerName: offerNameById.get(o.id) ?? o.name,
        value: values.get(o.id) ?? 0,
        color: colorForOfferId(o.id)
      }))
    };
  });

  return {
    points,
    resolvedRange: { startDate, endDate },
    metric: params.metric
  };
}

export type WorkspaceHeatmapMetric = "profit" | "revenue" | "roi";

export type WorkspaceHeatmapRow = {
  date: string; // YYYY-MM-DD
  offers: Array<{
    offerId: string;
    offerName: string;
    value: number;
    status: "positive" | "neutral" | "negative";
  }>;
};

export async function getWorkspaceHeatmap(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
  metric: WorkspaceHeatmapMetric;
  limitOffers?: number; // default: 8
}): Promise<{
  offers: Array<{ offerId: string; offerName: string }>;
  rows: WorkspaceHeatmapRow[];
  resolvedRange: { startDate: Date; endDate: Date };
  metric: WorkspaceHeatmapMetric;
}> {
  const startDate = startOfDayUTC(params.startDate);
  const endDate = endOfDayUTC(params.endDate);
  const limit = params.limitOffers ?? 8;

  const rows = await prisma.dailyPerformance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      offer: { workspaceId: params.workspaceId }
    },
    include: { offer: { select: { id: true, name: true } } },
    orderBy: { date: "asc" }
  });

  const totalsByOffer = new Map<string, { offerId: string; offerName: string; total: number }>();
  const byDateOffer = new Map<string, Map<string, number>>();

  for (const r of rows) {
    const key = toDateKey(startOfDayUTC(r.date));
    const fee = calculateFee({
      revenue: r.revenue,
      sales: r.sales,
      checkoutPercentage: r.checkoutPercentageSnapshot,
      gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
      taxPercentage: r.taxPercentageSnapshot
    });
    const profit = r.revenue.sub(r.investment.add(fee));
    const denom = r.investment.add(fee);
    const roi = denom.equals(0) ? 0 : r.revenue.div(denom).toNumber();

    const value =
      params.metric === "revenue"
        ? r.revenue.toNumber()
        : params.metric === "profit"
          ? profit.toNumber()
          : roi;

    const m = byDateOffer.get(key) ?? new Map<string, number>();
    m.set(r.offerId, value);
    byDateOffer.set(key, m);

    const t = totalsByOffer.get(r.offerId) ?? { offerId: r.offerId, offerName: r.offer.name, total: 0 };
    t.total += Math.abs(value);
    totalsByOffer.set(r.offerId, t);
  }

  const selectedOffers = Array.from(totalsByOffer.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((o) => ({ offerId: o.offerId, offerName: o.offerName }));

  const selectedOfferIds = new Set(selectedOffers.map((o) => o.offerId));

  const dateKeys = iterateDateKeysUTC({ startDate, endDate });
  const heatmapRows: WorkspaceHeatmapRow[] = dateKeys.map((date) => {
    const values = byDateOffer.get(date) ?? new Map<string, number>();
    return {
      date,
      offers: selectedOffers.map((o) => {
        const value = values.get(o.offerId) ?? 0;
        const status = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
        return { offerId: o.offerId, offerName: o.offerName, value, status };
      })
    };
  });

  // Caso o período tenha zero lançamentos, ainda retornamos colunas vazias.
  if (selectedOffers.length === 0 && rows.length > 0) {
    // fallback: pega até 8 ofertas distintas do período
    const fallback = new Map<string, string>();
    for (const r of rows) {
      if (fallback.size >= limit) break;
      fallback.set(r.offerId, r.offer.name);
    }
    const fallbackOffers = Array.from(fallback.entries()).map(([offerId, offerName]) => ({
      offerId,
      offerName
    }));
    return {
      offers: fallbackOffers,
      rows: dateKeys.map((date) => ({
        date,
        offers: fallbackOffers.map((o) => ({
          offerId: o.offerId,
          offerName: o.offerName,
          value: (byDateOffer.get(date)?.get(o.offerId) ?? 0),
          status: "neutral"
        }))
      })),
      resolvedRange: { startDate, endDate },
      metric: params.metric
    };
  }

  void selectedOfferIds;

  return {
    offers: selectedOffers,
    rows: heatmapRows,
    resolvedRange: { startDate, endDate },
    metric: params.metric
  };
}

export type WorkspaceCalendarDayOffer = {
  offerId: string;
  offerName: string;
  lucro: number;
  faturamento: number;
  roi: number;
};

export type WorkspaceCalendarDay = {
  date: string; // YYYY-MM-DD
  offers: WorkspaceCalendarDayOffer[];
};

export async function getWorkspaceCalendarData(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
  offerId?: string; // Se fornecido, filtra apenas esta oferta
}): Promise<{
  days: WorkspaceCalendarDay[];
  offers: Array<{ id: string; name: string }>;
  resolvedRange: { startDate: Date; endDate: Date };
}> {
  return measure(
    "analytics.workspaceCalendar",
    async () => {
      const startDate = startOfDayUTC(params.startDate);
      const endDate = endOfDayUTC(params.endDate);

      const rows = await prisma.dailyPerformance.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
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

      // Agrupar por data e oferta
      const byDate = new Map<string, Map<string, WorkspaceCalendarDayOffer>>();
      const offersSet = new Map<string, string>();

      for (const r of rows) {
        const dateKey = toDateKey(startOfDayUTC(r.date));
        const fee = calculateFee({
          revenue: r.revenue,
          sales: r.sales,
          checkoutPercentage: r.checkoutPercentageSnapshot,
          gatewayFeePerSale: r.gatewayFeePerSaleSnapshot,
          taxPercentage: r.taxPercentageSnapshot
        });
        const profit = r.revenue.sub(r.investment.add(fee));
        const denom = r.investment.add(fee);
        const roi = denom.equals(0) ? new Decimal(0) : r.revenue.div(denom);

        offersSet.set(r.offerId, r.offer.name);

        const dayOffers = byDate.get(dateKey) ?? new Map<string, WorkspaceCalendarDayOffer>();
        dayOffers.set(r.offerId, {
          offerId: r.offerId,
          offerName: r.offer.name,
          lucro: profit.toNumber(),
          faturamento: r.revenue.toNumber(),
          roi: roi.toNumber()
        });
        byDate.set(dateKey, dayOffers);
      }

      // Converter para array de dias
      const dateKeys = iterateDateKeysUTC({ startDate, endDate });
      const days: WorkspaceCalendarDay[] = dateKeys.map((date) => {
        const dayOffersMap = byDate.get(date) ?? new Map();
        const offers: WorkspaceCalendarDayOffer[] = Array.from(dayOffersMap.values());
        
        // Ordenar por ROI (maior primeiro)
        offers.sort((a, b) => b.roi - a.roi);

        return {
          date,
          offers
        };
      });

      return {
        days,
        offers: Array.from(offersSet.entries()).map(([id, name]) => ({ id, name })),
        resolvedRange: { startDate, endDate }
      };
    },
    {
      workspaceId: params.workspaceId
    }
  );
}


