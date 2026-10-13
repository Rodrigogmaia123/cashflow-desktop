"use client";

import { useId, useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { parseLocalDate } from "@/lib/utils/date-local";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { numericSeriesIsSparse } from "@/components/charts/series-density";

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

const timeSeries = [
  { key: "revenue", name: "Faturamento", color: "#C7F000" },
  { key: "investment", name: "Investimento", color: "#A855F7" },
  { key: "profit", name: "Lucro", color: "#4ADE80" }
] as const;

export function AreaTimeSeries({ data, currency }: Props) {
  const gradientPrefix = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sparseByKey = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!data?.length) return map;
    for (const series of timeSeries) {
      map.set(
        series.key,
        numericSeriesIsSparse(data.map((point) => point[series.key]))
      );
    }
    return map;
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  const barSeries = timeSeries.filter((series) => sparseByKey.get(series.key));
  const curveSeries = timeSeries.filter((series) => !sparseByKey.get(series.key));
  const maxBarSize = barSeries.length <= 1 ? 22 : 12;
  const chartData = data.map((point) => {
    if (barSeries.length === 0) return point;
    const next: Record<string, unknown> = { ...point };
    for (const series of barSeries) {
      if (next[series.key] === 0) next[series.key] = null;
    }
    return next;
  });
  const lowest = data.reduce((min, point) => {
    for (const series of timeSeries) {
      if (point[series.key] < min) return point[series.key];
    }
    return min;
  }, 0);

  return (
    <>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            barGap={2}
            barCategoryGap="20%"
          >
            {barSeries.length > 0 && (
              <defs>
                {barSeries.map((series) => (
                  <linearGradient
                    key={series.key}
                    id={`${gradientPrefix}-${series.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={series.color} stopOpacity={0.72} />
                    <stop offset="100%" stopColor={series.color} stopOpacity={0.16} />
                  </linearGradient>
                ))}
              </defs>
            )}
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tickMargin={8}
              fontSize={11}
            />
            <YAxis
              domain={barSeries.length > 0 ? [lowest < 0 ? "auto" : 0, "auto"] : undefined}
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
            {curveSeries.map((series) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={series.color}
                fill={series.color}
                fillOpacity={series.key === "profit" ? 0.08 : 0.12}
                strokeWidth={2.5}
              />
            ))}
            {barSeries.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={`url(#${gradientPrefix}-${series.key})`}
                stroke={series.color}
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
                maxBarSize={maxBarSize}
                barSize={maxBarSize}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {barSeries.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Lançamentos com dias vazios no meio entram em barras, no dia do registro.
          A altura é o valor anotado.
        </p>
      )}
    </>
  );
}


