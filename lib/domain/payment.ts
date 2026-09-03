export const PAYMENT_METHODS = [
  { id: "PIX", label: "Pix" },
  { id: "CREDIT", label: "Crédito" },
  { id: "DEBIT", label: "Débito" },
  { id: "CASH", label: "Dinheiro" }
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const PAYMENT_BRANDS = [
  { id: "nubank", label: "Nubank" },
  { id: "inter", label: "Inter" },
  { id: "c6", label: "C6 Bank" },
  { id: "banrisul", label: "Banrisul" },
  { id: "sicoob", label: "Sicoob" },
  { id: "sicredi", label: "Sicredi" },
  { id: "itau", label: "Itaú" },
  { id: "bradesco", label: "Bradesco" },
  { id: "bb", label: "Banco do Brasil" },
  { id: "caixa", label: "Caixa" },
  { id: "santander", label: "Santander" },
  { id: "next", label: "Next" },
  { id: "picpay", label: "PicPay" },
  { id: "mercadopago", label: "Mercado Pago" },
  { id: "pagbank", label: "PagBank" },
  { id: "cash", label: "Dinheiro" },
  { id: "other", label: "Outro" }
] as const;

export type PaymentBrandId = (typeof PAYMENT_BRANDS)[number]["id"];

const methodIds = new Set<string>(PAYMENT_METHODS.map((row) => row.id));
const brandIds = new Set<string>(PAYMENT_BRANDS.map((row) => row.id));

export function isPaymentMethod(value: string | null | undefined): value is PaymentMethodId {
  return Boolean(value && methodIds.has(value));
}

export function isPaymentBrand(value: string | null | undefined): value is PaymentBrandId {
  return Boolean(value && brandIds.has(value));
}

export function parsePaymentFields(input: {
  paymentMethod?: unknown;
  paymentBrand?: unknown;
}): { paymentMethod: PaymentMethodId | null; paymentBrand: PaymentBrandId | null } {
  const methodRaw = String(input.paymentMethod ?? "").trim();
  const brandRaw = String(input.paymentBrand ?? "").trim();
  const paymentMethod = isPaymentMethod(methodRaw) ? methodRaw : null;
  if (!paymentMethod) {
    return { paymentMethod: null, paymentBrand: null };
  }
  if (paymentMethod === "CASH") {
    return { paymentMethod, paymentBrand: "cash" };
  }
  const paymentBrand = isPaymentBrand(brandRaw) && brandRaw !== "cash" ? brandRaw : null;
  return { paymentMethod, paymentBrand };
}

export function paymentMethodLabel(id: string | null | undefined): string | null {
  return PAYMENT_METHODS.find((row) => row.id === id)?.label ?? null;
}

export function paymentBrandLabel(id: string | null | undefined): string | null {
  return PAYMENT_BRANDS.find((row) => row.id === id)?.label ?? null;
}

export function paymentSummary(
  method: string | null | undefined,
  brand: string | null | undefined
): string | null {
  const methodText = paymentMethodLabel(method);
  const brandText = brand === "cash" ? null : paymentBrandLabel(brand);
  if (!methodText && !brandText) return null;
  if (methodText && brandText) return `${methodText} · ${brandText}`;
  return methodText ?? brandText;
}

export const BANK_BRANDS = PAYMENT_BRANDS.filter((row) => row.id !== "cash");

export function parsePaymentMethodFilters(raw?: string): PaymentMethodId[] {
  return (raw?.split(",") ?? []).filter(isPaymentMethod);
}

export function parsePaymentBrandFilters(raw?: string): PaymentBrandId[] {
  return (raw?.split(",") ?? []).filter((id): id is PaymentBrandId => isPaymentBrand(id) && id !== "cash");
}

export function expenseMatchesPaymentFilters(
  expense: { paymentMethod?: string | null; paymentBrand?: string | null },
  methods: PaymentMethodId[],
  brands: PaymentBrandId[]
): boolean {
  if (methods.length > 0 && (!expense.paymentMethod || !methods.includes(expense.paymentMethod as PaymentMethodId))) {
    return false;
  }
  if (brands.length > 0 && (!expense.paymentBrand || !brands.includes(expense.paymentBrand as PaymentBrandId))) {
    return false;
  }
  return true;
}
