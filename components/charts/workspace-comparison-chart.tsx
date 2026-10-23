"use client";

import { useId, useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { parseLocalDate } from "@/lib/utils/date-local";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { numericSeriesIsSparse } from "@/components/charts/series-density";

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
  const gradientPrefix = useId().replace(/[^a-zA-Z0-9]/g, "");
  const flat = useMemo(
    () => data.map((point) => ({ date: point.date, ...point.values })),
    [data]
  );
  const sparseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const line of lines) {
      if (numericSeriesIsSparse(flat.map((point) => point[line.offerId]))) {
        ids.add(line.offerId);
      }
    }
    return ids;
  }, [flat, lines]);

  const barLines = lines.filter((line) => sparseIds.has(line.offerId));
  const curveLines = lines.filter((line) => !sparseIds.has(line.offerId));
  const maxBarSize = barLines.length <= 1 ? 22 : 12;
  const chartData = flat.map((point) => {
    if (barLines.length === 0) return point;
    const next: Record<string, unknown> = { ...point };
    for (const line of barLines) {
      if (next[line.offerId] === 0) next[line.offerId] = null;
    }
    return next;
  });
  const lowest = chartData.reduce((min, point) => {
    for (const line of lines) {
      const value = point[line.offerId];
      if (typeof value === "number" && value < min) return value;
    }
    return min;
  }, 0);

  return (
    <>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
            barGap={2}
            barCategoryGap="20%"
          >
            {barLines.length > 0 && (
              <defs>
                {barLines.map((line) => {
                  const id = `${gradientPrefix}-${line.offerId.replace(/[^a-zA-Z0-9]/g, "")}`;
                  return (
                    <linearGradient key={line.offerId} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={line.color} stopOpacity={0.72} />
                      <stop offset="100%" stopColor={line.color} stopOpacity={0.16} />
                    </linearGradient>
                  );
                })}
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
              domain={barLines.length > 0 ? [lowest < 0 ? "auto" : 0, "auto"] : undefined}
              tickMargin={8}
              fontSize={11}
              tickFormatter={(v) =>
                isPercent
                  ? `${(Number(v) * 100).toFixed(0)}%`
                  : formatMoney(Number(v), currency, { maximumFractionDigits: 0, minimumFractionDigits: 0 })
              }
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              wrapperStyle={{ outline: "none" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const rows = payload.filter((item) => typeof item.value === "number");
                if (rows.length === 0) return null;
                return (
                  <div className="min-w-[170px] rounded-xl border border-white/15 bg-[#16221c] px-3 py-2.5 font-mono text-xs shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]">
                    <div className="mb-1 text-[#64706a]">
                      {typeof label === "string" ? formatDate(label) : String(label ?? "")}
                    </div>
                    {rows.map((item) => {
                      const value = item.value as number;
                      const text = isPercent
                        ? `${(value * 100).toFixed(2)}%`
                        : formatMoney(value, currency);
                      return (
                        <div key={String(item.dataKey)} className="mt-1 flex justify-between gap-4 text-[#9ca9a1]">
                          <span className="truncate">{item.name}</span>
                          <b className="font-medium text-[#f3f7f4]">{text}</b>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />

            {curveLines.map((line) => (
              <Line
                key={line.offerId}
                type="monotone"
                dataKey={line.offerId}
                name={line.offerName}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
            {barLines.map((line) => (
              <Bar
                key={line.offerId}
                dataKey={line.offerId}
                name={line.offerName}
                fill={`url(#${gradientPrefix}-${line.offerId.replace(/[^a-zA-Z0-9]/g, "")})`}
                stroke={line.color}
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
                maxBarSize={maxBarSize}
                barSize={maxBarSize}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {barLines.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Lançamentos com dias vazios no meio entram em barras, no dia do registro.
          A altura é o valor anotado.
        </p>
      )}
    </>
  );
}


