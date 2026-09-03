export const OFFER_COUNTRIES = ["AR", "BR", "US", "MX", "CO"] as const;

export type OfferCountryCode = (typeof OFFER_COUNTRIES)[number];

export type OfferCountryOption = {
  code: OfferCountryCode;
  label: string;
  flag: string;
};

export const OFFER_COUNTRY_OPTIONS: OfferCountryOption[] = [
  { code: "AR", label: "Argentina", flag: "🇦🇷" },
  { code: "BR", label: "Brasil", flag: "🇧🇷" },
  { code: "US", label: "EUA", flag: "🇺🇸" },
  { code: "MX", label: "México", flag: "🇲🇽" },
  { code: "CO", label: "Colômbia", flag: "🇨🇴" }
];

export function getOfferCountryOption(
  country: string | null | undefined
): OfferCountryOption | null {
  if (!country) return null;
  return OFFER_COUNTRY_OPTIONS.find((option) => option.code === country) ?? null;
}

export function parseOfferCountry(
  value: FormDataEntryValue | null | undefined
): OfferCountryCode | null {
  if (value == null || value === "") return null;
  const code = String(value);
  return OFFER_COUNTRIES.includes(code as OfferCountryCode)
    ? (code as OfferCountryCode)
    : null;
}
