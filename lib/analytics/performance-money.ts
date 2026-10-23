import { Decimal } from "@prisma/client/runtime/library";
import { calculateFee } from "@/lib/domain/finance";
import type { CurrencyCode } from "@/lib/domain/currency";
import { projectAmountForView } from "@/lib/domain/currency-projection";
import type { CurrencyViewMode } from "@/lib/domain/currency-view";

type PerformanceRow = {
  revenue: Decimal;
  investment: Decimal;
  sales: number;
  currency: string;
  exchangeRateSnapshot: Decimal;
  checkoutPercentageSnapshot: Decimal;
  gatewayFeePerSaleSnapshot: Decimal;
  taxPercentageSnapshot: Decimal;
};

export type ViewedPerformanceMoney = {
  revenue: Decimal;
  investment: Decimal;
  fee: Decimal;
  profit: Decimal;
};

/** Projeta um lançamento diário para a moeda da tela. ROI nativo não muda, porque taxa é linear. */
export function performanceMoneyInView(
  row: PerformanceRow,
  view: CurrencyViewMode
): ViewedPerformanceMoney | null {
  const currency = row.currency as CurrencyCode;
  const project = (amount: Decimal) =>
    projectAmountForView({
      amount,
      currency,
      exchangeRateSnapshot: row.exchangeRateSnapshot,
      view
    });

  const revenue = project(row.revenue);
  const investment = project(row.investment);
  if (revenue === null || investment === null) return null;

  const feeNative = calculateFee({
    revenue: row.revenue,
    sales: row.sales,
    checkoutPercentage: row.checkoutPercentageSnapshot,
    gatewayFeePerSale: row.gatewayFeePerSaleSnapshot,
    taxPercentage: row.taxPercentageSnapshot
  });
  const fee = project(feeNative);
  if (fee === null) return null;

  return {
    revenue,
    investment,
    fee,
    profit: revenue.sub(investment).sub(fee)
  };
}
