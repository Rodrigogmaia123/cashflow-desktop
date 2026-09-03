"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { parseLocalDate } from "@/lib/utils/date-local";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export type TimeSeriesPoint = {
  date: string; // YYYY-MM-DD
  investment: number;
  revenue: number;
  profit: number;
};

type Props = {
  data: TimeSeriesPoint[];
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

export function AreaTimeSeries({ data, currency }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
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
            tickFormatter={(v) => formatMoney(Number(v), currency, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
          />
          <Tooltip
            formatter={(value: unknown) => {
              if (typeof value === "number") return formatMoney(value, currency);
              return String(value);
            }}
            labelFormatter={(label) => `Data: ${typeof label === "string" ? formatDate(label) : label}`}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Faturamento"
            stroke="#C7F000"
            fill="#C7F000"
            fillOpacity={0.12}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="investment"
            name="Investimento"
            stroke="#A855F7"
            fill="#A855F7"
            fillOpacity={0.12}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Lucro"
            stroke="#4ADE80"
            fill="#4ADE80"
            fillOpacity={0.08}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


