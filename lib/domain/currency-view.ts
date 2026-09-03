import type { CurrencyCode } from "@/lib/domain/currency";
import { isCurrencyCode } from "@/lib/domain/currency";

export const CURRENCY_VIEW_COOKIE = "cf_currency_view";

/** CONVERTED = consolida tudo na baseCurrency via exchangeRateSnapshot */
export type CurrencyViewMode = CurrencyCode | "CONVERTED";

export function parseCurrencyViewMode(
  value: string | null | undefined
): CurrencyViewMode | null {
  if (!value) return null;
  if (value === "CONVERTED") return "CONVERTED";
  if (isCurrencyCode(value)) return value;
  return null;
}

export function isConvertedView(mode: CurrencyViewMode): boolean {
  return mode === "CONVERTED";
}

/**
 * Display currency for labels: when CONVERTED, use workspace base;
 * otherwise the filtered currency itself.
 */
export function resolveDisplayCurrency(
  mode: CurrencyViewMode,
  baseCurrency: CurrencyCode
): CurrencyCode {
  return mode === "CONVERTED" ? baseCurrency : mode;
}
