import { cookies } from "next/headers";
import {
  CURRENCY_VIEW_COOKIE,
  parseCurrencyViewMode,
  type CurrencyViewMode
} from "@/lib/domain/currency-view";

export async function getCurrencyViewMode(
  fallback: CurrencyViewMode = "CONVERTED"
): Promise<CurrencyViewMode> {
  const jar = await cookies();
  const raw = jar.get(CURRENCY_VIEW_COOKIE)?.value;
  return parseCurrencyViewMode(raw) ?? fallback;
}
