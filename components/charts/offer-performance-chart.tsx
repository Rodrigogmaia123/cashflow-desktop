"use client";

import { useId, useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  Bar,
  type TooltipProps
} from "recharts";
import { parseLocalDate } from "@/lib/utils/date-local";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { numericSeriesIsSparse } from "@/components/charts/series-density";

export type PerformanceChartPoint = {
  date: string;
  investment: number;
  revenue: number;
  sales: number;
  fee: number;
  profit: number;
  roi: number;
  checkoutPct: number;
  taxPct: number;
  offers?: Array<{
    offerId: string;
    offerName: string;
    investment: number;
    revenue: number;
    fee: number;
    profit: number;
  }>;
};

export type OfferChartMetricId =
  | "revenue"
  | "investment"
  | "fee"
  | "profit"
  | "roi"
  | "sales"
  | "taxes";

type Props = {
  data: PerformanceChartPoint[];
  shown: Record<OfferChartMetricId, boolean>;
  focus: OfferChartMetricId;
  currency: CurrencyCode;
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

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

// Cores vibrantes premium: lime para receita, violeta para investimento
const colors = {
  revenue: "#C7F000", // Verde-lima vibrante (accent)
  investment: "#A855F7", // Violeta premium (primary)
  fee: "#A855F7", // Violeta para fees (mesma identidade)
  profit: "#4ADE80", // Verde vibrante para lucro positivo (success-vibrant)
  roi: "#A855F7", // Violeta para ROI
  sales: "#6b7280", // gray-500 (mantém neutro)
  checkout: "#0ea5e9", // sky-500
  tax: "#6366f1" // indigo-500
} as const;

type SeriesKind = "money" | "percent" | "count";

type SeriesConfig = {
  metricId: OfferChartMetricId;
  dataKey: keyof PerformanceChartPoint;
  name: string;
  kind: SeriesKind;
  color: string;
};

const seriesConfig: SeriesConfig[] = [
  { metricId: "revenue", dataKey: "revenue", name: "Faturamento", kind: "money", color: colors.revenue },
  { metricId: "investment", dataKey: "investment", name: "Investimento", kind: "money", color: colors.investment },
  { metricId: "fee", dataKey: "fee", name: "Fee", kind: "money", color: colors.fee },
  { metricId: "profit", dataKey: "profit", name: "Lucro", kind: "money", color: colors.profit },
  { metricId: "roi", dataKey: "roi", name: "ROI", kind: "percent", color: colors.roi },
  { metricId: "sales", dataKey: "sales", name: "Vendas", kind: "count", color: colors.sales },
  { metricId: "taxes", dataKey: "checkoutPct", name: "Checkout (%)", kind: "percent", color: colors.checkout },
  { metricId: "taxes", dataKey: "taxPct", name: "Imposto (%)", kind: "percent", color: colors.tax }
] as const;

function ActiveTooltip({
  active,
  label,
  payload,
  shown,
  currency
}: TooltipProps<number, string> & { shown: Props["shown"]; currency: CurrencyCode }) {
  if (!active || !payload || payload.length === 0) return null;

  const items: Array<{ label: string; value: string }> = [];

  const configByKey = new Map<string, SeriesConfig>();
  for (const c of seriesConfig) {
    configByKey.set(String(c.dataKey), c);
  }

  for (const p of payload) {
    if (typeof p.value !== "number") continue;

    const key = String(p.dataKey ?? "");
    const cfg = configByKey.get(key);
    if (!cfg) continue;
    if (!shown[cfg.metricId]) continue;

    const formatted =
      cfg.kind === "money"
        ? formatMoney(p.value, currency)
        : cfg.kind === "percent"
          ? formatPercent(p.value)
          : String(Math.round(p.value));

    items.push({ label: cfg.name, value: formatted });
  }

  if (items.length === 0) return null;

  const attribution = (payload?.[0]?.payload as PerformanceChartPoint | undefined)?.offers ?? null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="text-[11px] font-medium text-muted-foreground">
        Data: {typeof label === "string" ? formatDate(label) : label}
      </div>
      <div className="mt-1 space-y-1">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">{it.label}</span>
            <span className="font-medium">{it.value}</span>
          </div>
        ))}
      </div>

      {attribution && attribution.length > 0 && (
        <>
          <div className="mt-2 border-t pt-2 text-[11px] font-medium text-muted-foreground">
            Ofertas (por faturamento)
          </div>
          <div className="mt-1 space-y-1">
            {attribution.slice(0, 8).map((o) => (
              <div key={o.offerId} className="flex items-center justify-between gap-6">
                <span className="truncate text-muted-foreground">{o.offerName}</span>
                <span className="font-medium">{formatMoney(o.revenue, currency)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


export function OfferPerformanceChart({ data, shown, focus, currency }: Props) {
  const gradientPrefix = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sparseByKey = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!data || data.length === 0) return map;
    for (const series of seriesConfig) {
      const key = String(series.dataKey);
      map.set(key, numericSeriesIsSparse(data.map((point) => point[series.dataKey] as number)));
    }
    return map;
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  const visibleSeries = seriesConfig.filter((series) => shown[series.metricId]);
  const barSeries = visibleSeries.filter((series) => sparseByKey.get(String(series.dataKey)));
  const curveSeries = visibleSeries.filter((series) => !sparseByKey.get(String(series.dataKey)));
  const maxBarSize = barSeries.length <= 1 ? 22 : 12;
  const barKeys = new Set(barSeries.map((series) => String(series.dataKey)));
  const chartData = data.map((point) => {
    if (barKeys.size === 0) return point;
    const next: Record<string, unknown> = { ...point };
    for (const key of barKeys) {
      if (next[key] === 0) next[key] = null;
    }
    return next;
  });

  function axisMin(keys: string[]) {
    let min = 0;
    for (const point of data) {
      for (const key of keys) {
        const value = point[key as keyof PerformanceChartPoint];
        if (typeof value === "number" && value < min) min = value;
      }
    }
    return min < 0 ? "auto" : 0;
  }

  const showPercentAxis = Boolean(
    seriesConfig.some((c) => (c.kind === "percent" && shown[c.metricId]) || false)
  );
  const showCountAxis = Boolean(seriesConfig.some((c) => c.kind === "count" && shown[c.metricId]));

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
          {barSeries.length > 0 && (
            <defs>
              {barSeries.map((series) => {
                const key = String(series.dataKey);
                const focused = focus === series.metricId;
                return (
                  <linearGradient
                    key={key}
                    id={`${gradientPrefix}-${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={series.color}
                      stopOpacity={focused ? 0.72 : 0.34}
                    />
                    <stop
                      offset="100%"
                      stopColor={series.color}
                      stopOpacity={focused ? 0.16 : 0.06}
                    />
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
            yAxisId="money"
            tickMargin={8}
            fontSize={11}
            domain={
              barSeries.some((series) => series.kind === "money")
                ? [
                    axisMin(
                      visibleSeries
                        .filter((series) => series.kind === "money")
                        .map((series) => String(series.dataKey))
                    ),
                    "auto"
                  ]
                : undefined
            }
            tickFormatter={(v) =>
              formatMoney(Number(v), currency, {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0
              })
            }
          />
          {showPercentAxis && (
            <YAxis
              yAxisId="percent"
              orientation="right"
              tickMargin={8}
              fontSize={11}
              tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`}
            />
          )}
          {showCountAxis && (
            <YAxis
              yAxisId="count"
              orientation="right"
              tickMargin={8}
              fontSize={11}
              tickFormatter={(v) => String(Math.round(Number(v)))}
              width={42}
            />
          )}

          <Tooltip
            content={(props: TooltipProps<number, string>) => (
              <ActiveTooltip {...props} shown={shown} currency={currency} />
            )}
          />

          {curveSeries.map((c) => {
            const focused = focus === c.metricId;
            const opacity = focused ? 1 : 0.5;
            const width = focused ? 2.5 : 1;
            const yAxisId =
              c.kind === "money" ? "money" : c.kind === "percent" ? "percent" : "count";

            if (c.kind === "money" && focused) {
              return (
                <Area
                  key={`${c.metricId}:${String(c.dataKey)}`}
                  yAxisId={yAxisId}
                  type="monotone"
                  dataKey={String(c.dataKey)}
                  name={c.name}
                  stroke={c.color}
                  fill={c.color}
                  fillOpacity={0.12}
                  strokeWidth={width}
                />
              );
            }

            return (
              <Line
                key={`${c.metricId}:${String(c.dataKey)}`}
                yAxisId={yAxisId}
                type="monotone"
                dataKey={String(c.dataKey)}
                name={c.name}
                stroke={c.color}
                strokeOpacity={opacity}
                strokeWidth={width}
                dot={false}
              />
            );
          })}

          {barSeries.map((c) => {
            const focused = focus === c.metricId;
            const key = String(c.dataKey);
            const yAxisId =
              c.kind === "money" ? "money" : c.kind === "percent" ? "percent" : "count";

            return (
              <Bar
                key={`${c.metricId}:${key}`}
                yAxisId={yAxisId}
                dataKey={key}
                name={c.name}
                fill={`url(#${gradientPrefix}-${key})`}
                stroke={c.color}
                strokeOpacity={focused ? 1 : 0.45}
                strokeWidth={focused ? 1.5 : 1}
                radius={[4, 4, 0, 0]}
                maxBarSize={maxBarSize}
                barSize={maxBarSize}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    {barSeries.length > 0 && (
      <p className="text-[11px] text-muted-foreground">
        Lançamentos com dias vazios no meio entram em barras, no dia do registro.
        A altura é o valor anotado, e o modo Acumulado segue em curva contínua.
      </p>
    )}
    </>
  );
}


