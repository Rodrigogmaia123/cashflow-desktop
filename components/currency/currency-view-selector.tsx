"use client";

import { useRouter } from "next/navigation";
import { setCurrencyViewMode } from "@/app/app/currency-view/actions";
import { CURRENCY_OPTIONS, type CurrencyCode } from "@/lib/domain/currency";
import type { CurrencyViewMode } from "@/lib/domain/currency-view";

type Props = {
  current: CurrencyViewMode;
  baseCurrency: CurrencyCode;
  className?: string;
};

export function CurrencyViewSelector({ current, baseCurrency, className }: Props) {
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formData = new FormData();
    formData.set("currencyView", e.target.value);
    await setCurrencyViewMode(formData);
    router.refresh();
  };

  return (
    <div className={className}>
      <label className="sr-only" htmlFor="currencyView">
        Visualização de moeda
      </label>
      <select
        id="currencyView"
        name="currencyView"
        value={current}
        onChange={handleChange}
        className="rounded-lg border-0 bg-[#0F131A] px-3 py-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Filtrar por moeda ou consolidar na moeda base (taxa histórica do lançamento)"
      >
        <option value="CONVERTED">
          Convertido ({baseCurrency}) — taxa histórica
        </option>
        {CURRENCY_OPTIONS.map((c) => (
          <option key={c.code} value={c.code}>
            Somente {c.code}
            {c.code === baseCurrency ? " (base)" : ""}
          </option>
        ))}
      </select>
      {current === "CONVERTED" && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Valores convertidos com a taxa gravada em cada lançamento (não a taxa atual).
        </p>
      )}
    </div>
  );
}
