import { Decimal } from "@prisma/client/runtime/library";

export type MoneyLike = number | string | Decimal;

function toDecimal(value: MoneyLike): Decimal {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

type FeeConfig = {
  checkoutPercentage: MoneyLike;
  gatewayFeePerSale: MoneyLike;
  taxPercentage: MoneyLike;
};

/**
 * Checkout = revenue * checkoutPercentage
 * Gateway  = sales * gatewayFeePerSale
 * Imposto  = revenue * taxPercentage
 * Fee total = soma de tudo
 */
export function calculateFee(params: {
  sales: number;
  revenue: MoneyLike;
} & FeeConfig): Decimal {
  const revenue = toDecimal(params.revenue);
  const sales = new Decimal(params.sales);

  const checkout = revenue.mul(toDecimal(params.checkoutPercentage));
  const gateway = sales.mul(toDecimal(params.gatewayFeePerSale));
  const tax = revenue.mul(toDecimal(params.taxPercentage));

  return checkout.add(gateway).add(tax);
}

/**
 * ROI = revenue / (investment + fee)
 * Profit = revenue - (investment + fee)
 */
export function calculateRoiAndProfit(params: {
  investment: MoneyLike;
  revenue: MoneyLike;
  sales: number;
} & FeeConfig): { fee: Decimal; roi: Decimal; profit: Decimal } {
  const investment = toDecimal(params.investment);
  const revenue = toDecimal(params.revenue);
  const fee = calculateFee(params);
  const totalCost = investment.add(fee);

  const roi =
    totalCost.equals(0) === false ? revenue.div(totalCost) : new Decimal(0);

  const profit = revenue.sub(totalCost);

  return { fee, roi, profit };
}

/**
 * Ticket médio = revenue / sales
 * ROI diário = mesma fórmula geral, aplicada ao dia.
 */
export function calculateDailyMetrics(params: {
  investment: MoneyLike;
  revenue: MoneyLike;
  sales: number;
} & FeeConfig) {
  const { fee, roi, profit } = calculateRoiAndProfit(params);
  const revenue = toDecimal(params.revenue);
  const salesDecimal = new Decimal(params.sales || 0);

  const ticketAverage =
    params.sales > 0 ? revenue.div(salesDecimal) : new Decimal(0);

  return {
    fee,
    roi,
    profit,
    ticketAverage
  };
}
