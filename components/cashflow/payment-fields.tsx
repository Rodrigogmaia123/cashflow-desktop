"use client";

import { useEffect, useState } from "react";
import { PaymentBrandMark } from "@/components/cashflow/payment-brand-mark";
import {
  PAYMENT_BRANDS,
  PAYMENT_METHODS,
  isPaymentBrand,
  isPaymentMethod,
  type PaymentBrandId,
  type PaymentMethodId
} from "@/lib/domain/payment";

const LAST_PAYMENT_KEY = "cashflowpro:last-payment";

function readLastPayment(): { method: PaymentMethodId | ""; brand: PaymentBrandId | "" } {
  try {
    const raw = window.localStorage.getItem(LAST_PAYMENT_KEY);
    if (!raw) return { method: "", brand: "" };
    const parsed = JSON.parse(raw) as { method?: string; brand?: string };
    return {
      method: isPaymentMethod(parsed.method) ? parsed.method : "",
      brand: isPaymentBrand(parsed.brand) ? parsed.brand : ""
    };
  } catch {
    return { method: "", brand: "" };
  }
}

function writeLastPayment(method: PaymentMethodId | "", brand: PaymentBrandId | "") {
  try {
    window.localStorage.setItem(LAST_PAYMENT_KEY, JSON.stringify({ method, brand }));
  } catch {
    // ignore
  }
}

export function PaymentFields({
  defaultMethod,
  defaultBrand,
  remember = true,
  compact = false
}: {
  defaultMethod?: string | null;
  defaultBrand?: string | null;
  remember?: boolean;
  compact?: boolean;
}) {
  const [method, setMethod] = useState<PaymentMethodId | "">(
    isPaymentMethod(defaultMethod) ? defaultMethod : ""
  );
  const [brand, setBrand] = useState<PaymentBrandId | "">(
    isPaymentBrand(defaultBrand) ? defaultBrand : ""
  );

  useEffect(() => {
    if (defaultMethod || defaultBrand || !remember) return;
    const last = readLastPayment();
    if (last.method) setMethod(last.method);
    if (last.brand) setBrand(last.brand);
  }, [defaultMethod, defaultBrand, remember]);

  function selectMethod(next: PaymentMethodId) {
    setMethod(next);
    const nextBrand = next === "CASH" ? "cash" : brand === "cash" ? "" : brand;
    setBrand(nextBrand);
    if (remember) writeLastPayment(next, nextBrand);
  }

  function selectBrand(next: PaymentBrandId) {
    setBrand(next);
    if (remember) writeLastPayment(method || "PIX", next);
  }

  const bankBrands = PAYMENT_BRANDS.filter((row) => row.id !== "cash");

  return (
    <div className="space-y-2">
      <input type="hidden" name="paymentMethod" value={method} />
      <input type="hidden" name="paymentBrand" value={brand} />
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Como pagou</label>
        <div className={`grid gap-1.5 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
          {PAYMENT_METHODS.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => selectMethod(row.id)}
              className={`h-8 rounded-md border px-2 text-[11px] font-medium ${
                method === row.id
                  ? "border-primary bg-primary-soft text-foreground"
                  : "border-white/10 text-muted-foreground hover:bg-white/5"
              }`}
            >
              {row.label}
            </button>
          ))}
        </div>
      </div>
      {method && method !== "CASH" ? (
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Bandeira / banco</label>
          <div className="grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4">
            {bankBrands.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => selectBrand(row.id)}
                className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1.5 text-left ${
                  brand === row.id
                    ? "border-primary bg-primary-soft"
                    : "border-white/10 hover:bg-white/5"
                }`}
                title={row.label}
              >
                <PaymentBrandMark brand={row.id} size={22} />
                <span className="truncate text-[10px] leading-tight text-foreground">{row.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
