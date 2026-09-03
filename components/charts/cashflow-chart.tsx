"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";
import { parseLocalDate } from "@/lib/utils/date-local";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export type CashflowChartPoint = {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
};

type Visible = {
  inflow: boolean;
  outflow: boolean;
  balance: boolean;
};

type Props = {
  data: CashflowChartPoint[];
  visible: Visible;
  currency: CurrencyCode;
};

/**
 * Formata uma string de data (YYYY-MM-DD) para exibição no gráfico (DD/MM)
 * Usa parseLocalDate para evitar problemas de timezone
 */
function formatDate(dateStr: string): string {
  // dateStr vem como 'YYYY-MM-DD' do backend
  const date = parseLocalDate(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function CashflowTooltip({
  active,
  label,
  payload,
  visible,
  currency
}: TooltipProps<number, string> & { visible: Visible; currency: CurrencyCode }) {
  if (!active || !payload || payload.length === 0) return null;

  const byKey = new Map<string, number>();
  for (const p of payload) {
    if (typeof p.value !== "number") continue;
    byKey.set(String(p.dataKey ?? ""), p.value);
  }

  const items: Array<{ label: string; value: string }> = [];
  if (visible.inflow) items.push({ label: "Entradas", value: formatMoney(byKey.get("inflow") ?? 0, currency) });
  if (visible.outflow) items.push({ label: "Saídas", value: formatMoney(byKey.get("outflow") ?? 0, currency) });
  if (visible.balance) items.push({ label: "Saldo", value: formatMoney(byKey.get("balance") ?? 0, currency) });

  return (
    <div className="rounded-xl border border-white/10 bg-card px-4 py-3 text-xs shadow-lg backdrop-blur-sm">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {typeof label === "string" ? formatDate(label) : label}
      </div>
      <div className="mt-2 space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">{it.label}</span>
            <span className="font-bold text-foreground">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashflowChart({ data, visible, currency }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 12, right: 32, top: 20, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.08} stroke="rgba(255,255,255,0.04)" />
          <XAxis 
            dataKey="date"
            tickFormatter={formatDate}
            tickMargin={8} 
            fontSize={11} 
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: "rgba(255,255,255,0.5)" }}
            padding={{ left: 0, right: 0 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickMargin={8}
            fontSize={11}
            tickFormatter={(v) => formatMoney(Number(v), currency, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: "rgba(255,255,255,0.5)" }}
          />
          <Tooltip content={(props: TooltipProps<number, string>) => <CashflowTooltip {...props} visible={visible} currency={currency} />} />

          {visible.inflow && (
            <Bar dataKey="inflow" name="Entradas" fill="#7CFF6B" fillOpacity={1} radius={[6, 6, 0, 0]} stroke="#7CFF6B" strokeWidth={1} />
          )}
          {visible.outflow && (
            <Bar dataKey="outflow" name="Saídas" fill="#FF5C5C" fillOpacity={1} radius={[6, 6, 0, 0]} stroke="#FF5C5C" strokeWidth={1} />
          )}
          <defs>
            <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {visible.balance && (
            <Line
              type="monotone"
              dataKey="balance"
              name="Saldo"
              stroke="#A855F7"
              strokeWidth={3.5}
              dot={false}
              strokeLinecap="round"
              filter="url(#glow-purple)"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}


