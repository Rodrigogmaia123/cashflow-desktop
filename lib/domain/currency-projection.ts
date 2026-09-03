import { Decimal } from "@prisma/client/runtime/library";
import type { CurrencyCode } from "@/lib/domain/currency";
import type { CurrencyViewMode } from "@/lib/domain/currency-view";

/**
 * Converte valor nativo de um DailyPerformance para a view atual.
 * - CONVERTED: multiplica pelo exchangeRateSnapshot (offer → base no momento do write)
 * - filtro de moeda: retorna nativo se bater; null se deve excluir
 */
export function projectAmountForView(params: {
  amount: Decimal;
  currency: CurrencyCode;
  exchangeRateSnapshot: Decimal;
  view: CurrencyViewMode;
}): Decimal | null {
  const { amount, currency, exchangeRateSnapshot, view } = params;

  if (view === "CONVERTED") {
    return amount.mul(exchangeRateSnapshot);
  }

  if (currency !== view) {
    return null;
  }

  return amount;
}

/** Inclui valores da moeda base (expenses/manual/investments) na view? */
export function includeBaseCurrencyItems(
  view: CurrencyViewMode,
  baseCurrency: CurrencyCode
): boolean {
  return view === "CONVERTED" || view === baseCurrency;
}
