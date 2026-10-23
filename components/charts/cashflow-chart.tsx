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
    <div className="min-w-[170px] rounded-xl border border-white/15 bg-[#16221c] px-3 py-2.5 font-mono text-xs shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]">
      <div className="mb-1 text-[#64706a]">
        {typeof label === "string" ? formatDate(label) : label}
      </div>
      {items.map((it) => (
        <div key={it.label} className="mt-1 flex justify-between gap-4 text-[#9ca9a1]">
          <span>{it.label}</span>
          <b className="font-medium text-[#f3f7f4]">{it.value}</b>
        </div>
      ))}
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
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            wrapperStyle={{ outline: "none" }}
            content={(props: TooltipProps<number, string>) => <CashflowTooltip {...props} visible={visible} currency={currency} />}
          />

          {visible.inflow && (
            <Bar dataKey="inflow" name="Entradas" fill="#c7f156" fillOpacity={0.9} radius={[2, 2, 0, 0]} maxBarSize={8} />
          )}
          {visible.outflow && (
            <Bar dataKey="outflow" name="Saídas" fill="#f08a7a" fillOpacity={0.9} radius={[2, 2, 0, 0]} maxBarSize={8} />
          )}
          {visible.balance && (
            <Line
              type="monotone"
              dataKey="balance"
              name="Saldo"
              stroke="#ac93ff"
              strokeWidth={2}
              dot={false}
              strokeLinecap="round"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}


