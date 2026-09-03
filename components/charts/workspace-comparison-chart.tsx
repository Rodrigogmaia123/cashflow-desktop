"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { parseLocalDate } from "@/lib/utils/date-local";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type Metric = "revenue" | "profit" | "roi";

export type ComparisonLine = {
  offerId: string;
  offerName: string;
  color: string;
};

export type ComparisonChartPoint = {
  date: string;
  values: Record<string, number>; // offerId -> value
};

type Props = {
  metric: Metric;
  lines: ComparisonLine[];
  data: ComparisonChartPoint[];
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

export function WorkspaceComparisonChart({ metric, lines, data, currency }: Props) {
  const isPercent = metric === "roi";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tickMargin={8}
            fontSize={11}
          />
          <YAxis
            tickMargin={8}
            fontSize={11}
            tickFormatter={(v) =>
              isPercent
                ? `${(Number(v) * 100).toFixed(0)}%`
                : formatMoney(Number(v), currency, { maximumFractionDigits: 0, minimumFractionDigits: 0 })
            }
          />
          <Tooltip
            formatter={(value: unknown, name: string) => {
              if (typeof value !== "number") return [String(value), name];
              return isPercent ? [`${(value * 100).toFixed(2)}%`, name] : [formatMoney(value, currency), name];
            }}
            labelFormatter={(label) => `Data: ${typeof label === "string" ? formatDate(label) : label}`}
          />

          {lines.map((l) => (
            <Line
              key={l.offerId}
              type="monotone"
              dataKey={(p: ComparisonChartPoint) => p.values[l.offerId] ?? 0}
              name={l.offerName}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


