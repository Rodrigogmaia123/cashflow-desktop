import type { OfferCountryCode } from "@/lib/domain/offer-country";

export const CURRENCIES = ["BRL", "USD", "ARS", "MXN", "COP"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

export type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  symbolHint: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "BRL", label: "Real (BRL)", symbolHint: "R$" },
  { code: "USD", label: "Dólar (USD)", symbolHint: "US$" },
  { code: "ARS", label: "Peso argentino (ARS)", symbolHint: "AR$" },
  { code: "MXN", label: "Peso mexicano (MXN)", symbolHint: "MX$" },
  { code: "COP", label: "Peso colombiano (COP)", symbolHint: "COL$" }
];

const LOCALE_BY_CURRENCY: Record<CurrencyCode, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  ARS: "es-AR",
  MXN: "es-MX",
  COP: "es-CO"
};

type MoneyAmount = number | string | { toNumber(): number };

function toNumberAmount(amount: MoneyAmount): number {
  if (typeof amount === "object" && amount !== null && "toNumber" in amount) {
    return amount.toNumber();
  }
  if (typeof amount === "string") {
    return Number(amount);
  }
  return amount;
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CURRENCIES.includes(value as CurrencyCode);
}

export function parseCurrency(
  value: FormDataEntryValue | null | undefined
): CurrencyCode | null {
  if (value == null || value === "") return null;
  const code = String(value);
  return isCurrencyCode(code) ? code : null;
}

export function suggestCurrencyFromCountry(
  country: OfferCountryCode | null | undefined
): CurrencyCode {
  switch (country) {
    case "AR":
      return "ARS";
    case "US":
      return "USD";
    case "MX":
      return "MXN";
    case "CO":
      return "COP";
    case "BR":
    default:
      return "BRL";
  }
}

export function formatMoney(
  amount: MoneyAmount,
  currency: CurrencyCode,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  const value = toNumberAmount(amount);
  const locale = LOCALE_BY_CURRENCY[currency] ?? "pt-BR";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2
  }).format(Number.isFinite(value) ? value : 0);
}

export function getCurrencyOption(
  currency: string | null | undefined
): CurrencyOption | null {
  if (!currency) return null;
  return CURRENCY_OPTIONS.find((option) => option.code === currency) ?? null;
}
