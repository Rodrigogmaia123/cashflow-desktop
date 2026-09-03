"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export type DonutSlice = {
  id: string;
  label: string;
  amount: number;
  percentage: number; // fração (0..1)
  color: string;
};

type Props = {
  data: DonutSlice[];
  currency: CurrencyCode;
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
  const item = (payload?.[0]?.payload as DonutSlice | undefined);
  if (!item) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-card px-4 py-3 text-xs shadow-lg backdrop-blur-sm">
      <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider">{item.label}</div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-bold text-foreground">{formatMoney(item.amount, currency)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Percentual</span>
          <span className="font-bold text-foreground">{formatPercent(item.percentage)}</span>
        </div>
      </div>
    </div>
  );
}

export function DonutChart({ data, currency }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="h-64 w-full">
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
            innerRadius={60}
            outerRadius={100}
            paddingAngle={0.5}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={1.5}
          >
            {data.map((d) => (
              <Cell key={d.id} fill={d.color} fillOpacity={1} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
