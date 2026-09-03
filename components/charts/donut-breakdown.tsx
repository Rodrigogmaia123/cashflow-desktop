"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export type DonutBreakdownItem = {
  label: string;
  amount: number;
  percentage: number; // fração (0..1)
  color: string;
};

type Props = {
  data: DonutBreakdownItem[];
  currency?: CurrencyCode;
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

function DonutTooltip({
  active,
  payload,
  currency
}: TooltipProps<number, string> & { currency: CurrencyCode }) {
  if (!active) return null;
  const item = (payload?.[0]?.payload as DonutBreakdownItem | undefined);
  if (!item) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="text-[11px] font-medium text-muted-foreground">{item.label}</div>
      <div className="mt-1 flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Valor</span>
        <span className="font-medium">{formatMoney(item.amount, currency)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Percentual</span>
        <span className="font-medium">{formatPercent(item.percentage)}</span>
      </div>
    </div>
  );
}

export function DonutBreakdown({ data, currency = "BRL" }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={(props: TooltipProps<number, string>) => (
              <DonutTooltip {...props} currency={currency} />
            )}
          />
          <Pie
            data={data}
            dataKey="amount"
            nameKey="label"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            stroke="transparent"
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} fillOpacity={0.85} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
