"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CURRENCY_OPTIONS, formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { updateWorkspaceFees } from "./actions";
import { field, surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

export function WorkspaceFeesForm({
  isAdmin,
  currency,
  checkoutPercentage,
  gatewayFeePerSale,
  taxPercentage
}: {
  isAdmin: boolean;
  currency: CurrencyCode;
  checkoutPercentage: number;
  gatewayFeePerSale: number;
  taxPercentage: number;
}) {
  const [values, setValues] = useState({
    currency,
    checkout: checkoutPercentage.toFixed(2),
    gateway: gatewayFeePerSale.toFixed(2),
    tax: taxPercentage.toFixed(2),
    revenue: "1000",
    sales: "10"
  });

  const revenue = Number(values.revenue) || 0;
  const sales = Number(values.sales) || 0;
  const checkoutAmount = revenue * (Number(values.checkout) || 0);
  const gatewayAmount = sales * (Number(values.gateway) || 0);
  const taxAmount = revenue * (Number(values.tax) || 0);
  const total = checkoutAmount + gatewayAmount + taxAmount;
  const share = revenue > 0 ? (total / revenue) * 100 : 0;
  const money = (amount: number) => formatMoney(amount, values.currency);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)]">
      <form action={updateWorkspaceFees} className={cn(surface, "space-y-5 p-5")}>
        <FeeField dot="bg-[#ac93ff]" label="Moeda da configuração" hint="Moeda do valor fixo de gateway nesta configuração.">
          <select
            id="currency"
            name="currency"
            value={values.currency}
            disabled={!isAdmin}
            onChange={(event) => setValues((current) => ({ ...current, currency: event.target.value as CurrencyCode }))}
            className={field}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>{option.label}</option>
            ))}
          </select>
        </FeeField>
        <FeeField dot="bg-[#6aa7ff]" label="Taxa de checkout (percentual)" hint="Fração do faturamento. Ex.: 0,10 = 10% do faturamento.">
          <input
            id="checkoutPercentage"
            name="checkoutPercentage"
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={values.checkout}
            disabled={!isAdmin}
            onChange={(event) => setValues((current) => ({ ...current, checkout: event.target.value }))}
            className={field}
          />
        </FeeField>
        <FeeField dot="bg-[#f0b35a]" label="Taxa de gateway (fixo)" hint="Valor fixo na moeda da configuração, cobrado por venda.">
          <input
            id="gatewayFeePerSale"
            name="gatewayFeePerSale"
            type="number"
            step="0.01"
            min={0}
            value={values.gateway}
            disabled={!isAdmin}
            onChange={(event) => setValues((current) => ({ ...current, gateway: event.target.value }))}
            className={field}
          />
        </FeeField>
        <FeeField dot="bg-[#f08a7a]" label="Imposto (percentual)" hint="Fração do faturamento. Ex.: 0,06 = 6% do faturamento.">
          <input
            id="taxPercentage"
            name="taxPercentage"
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={values.tax}
            disabled={!isAdmin}
            onChange={(event) => setValues((current) => ({ ...current, tax: event.target.value }))}
            className={field}
          />
        </FeeField>
        {isAdmin && (
          <Button type="submit" variant="accent" className="w-full">
            Salvar taxas do workspace
          </Button>
        )}
      </form>

      <aside className={cn(surface, "p-5")}>
        <h2 className="font-display text-base font-semibold">Simulação</h2>
        <p className="mt-1 text-xs text-[#9ca9a1]">Veja o efeito das taxas sobre um exemplo.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-[#9ca9a1]">
            Faturamento
            <input
              type="number"
              min={0}
              value={values.revenue}
              onChange={(event) => setValues((current) => ({ ...current, revenue: event.target.value }))}
              className={field}
            />
          </label>
          <label className="space-y-1 text-xs text-[#9ca9a1]">
            Vendas
            <input
              type="number"
              min={0}
              value={values.sales}
              onChange={(event) => setValues((current) => ({ ...current, sales: event.target.value }))}
              className={field}
            />
          </label>
        </div>
        <dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
          <Row label="Checkout" value={money(checkoutAmount)} />
          <Row label="Gateway" value={money(gatewayAmount)} />
          <Row label="Imposto" value={money(taxAmount)} />
          <Row label="Taxas totais" value={money(total)} highlight />
          <Row label="% do faturamento" value={`${share.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`} />
        </dl>
      </aside>
    </div>
  );
}

function FeeField({
  dot,
  label,
  hint,
  children
}: {
  dot: string;
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {label}
      </span>
      {children}
      <span className="block text-xs text-[#64706a]">{hint}</span>
    </label>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[#9ca9a1]">{label}</dt>
      <dd className={cn("font-mono", highlight && "font-medium text-[#c7f156]")}>{value}</dd>
    </div>
  );
}
