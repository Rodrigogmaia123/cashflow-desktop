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
  YAxis,
  type TooltipProps
} from "recharts";
import { parseLocalDate } from "@/lib/utils/date-local";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { numericSeriesIsSparse } from "@/components/charts/series-density";

export type OfferHeroChartPoint = {
  date: string;
  investment: number;
  revenue: number;
};

type OfferHeroChartProps = {
  data: OfferHeroChartPoint[];
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

function CustomTooltip({
  active,
  payload,
  label,
  currency
}: TooltipProps<number, string> & { currency: CurrencyCode }) {
  if (!active || !payload || payload.length === 0) return null;

  const investmentValue = payload.find((p) => p.dataKey === "investment")?.value;
  const revenueValue = payload.find((p) => p.dataKey === "revenue")?.value;

  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {formatDate(label)}
      </div>
      <div className="space-y-1.5">
        {typeof investmentValue === "number" && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Investimento</span>
            </div>
            <span className="text-xs font-semibold text-foreground">
              {formatMoney(investmentValue, currency)}
            </span>
          </div>
        )}
        {typeof revenueValue === "number" && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Retorno</span>
            </div>
            <span className="text-xs font-semibold text-accent">
              {formatMoney(revenueValue, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const heroSeries = [
  { key: "investment", name: "Investimento", stroke: "hsl(var(--primary))" },
  { key: "revenue", name: "Retorno", stroke: "hsl(var(--accent))" }
] as const;

export function OfferHeroChart({ data, currency }: OfferHeroChartProps) {
  const gradientPrefix = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sparseByKey = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!data?.length) return map;
    for (const series of heroSeries) {
      map.set(
        series.key,
        numericSeriesIsSparse(data.map((point) => point[series.key]))
      );
    }
    return map;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full rounded-lg bg-card border border-white/5 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Não há dados suficientes para exibir o gráfico
        </p>
      </div>
    );
  }

  const barSeries = heroSeries.filter((series) => sparseByKey.get(series.key));
  const curveSeries = heroSeries.filter((series) => !sparseByKey.get(series.key));
  const maxBarSize = barSeries.length <= 1 ? 22 : 12;
  const chartData = data.map((point) => {
    if (barSeries.length === 0) return point;
    const next: Record<string, unknown> = { ...point };
    for (const series of barSeries) {
      if (next[series.key] === 0) next[series.key] = null;
    }
    return next;
  });

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg bg-card border border-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Evolução da Oferta
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Comparação entre investimento e retorno ao longo do tempo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Investimento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Retorno</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              barGap={2}
              barCategoryGap="20%"
            >
              <defs>
                {heroSeries.map((series) => (
                  <linearGradient
                    key={series.key}
                    id={`${gradientPrefix}-${series.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={series.stroke} stopOpacity={sparseByKey.get(series.key) ? 0.72 : 0.2} />
                    <stop offset="100%" stopColor={series.stroke} stopOpacity={sparseByKey.get(series.key) ? 0.16 : 0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.2}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickMargin={8}
                stroke="hsl(var(--border))"
              />
              <YAxis
                domain={barSeries.length > 0 ? [0, "auto"] : undefined}
                tickFormatter={(value) =>
                  formatMoney(Number(value), currency, {
                    maximumFractionDigits: 0,
                    minimumFractionDigits: 0
                  })
                }
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickMargin={8}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    active={props.active}
                    payload={props.payload as TooltipProps<number, string>["payload"]}
                    label={props.label as string}
                    currency={currency}
                  />
                )}
              />
              {curveSeries.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.stroke}
                  strokeWidth={2}
                  fill={`url(#${gradientPrefix}-${series.key})`}
                  fillOpacity={1}
                />
              ))}
              {barSeries.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.name}
                  fill={`url(#${gradientPrefix}-${series.key})`}
                  stroke={series.stroke}
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
          <p className="mt-2 text-[11px] text-muted-foreground">
            Lançamentos com dias vazios no meio entram em barras, no dia do registro.
            A altura é o valor anotado.
          </p>
        )}
      </div>
    </div>
  );
}

