"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps
} from "recharts";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/utils/date-local";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

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

  const investmentValue = payload.find((p) => p.dataKey === "investment")?.value as number | undefined;
  const revenueValue = payload.find((p) => p.dataKey === "revenue")?.value as number | undefined;

  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {formatDate(label)}
      </div>
      <div className="space-y-1.5">
        {investmentValue !== undefined && (
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
        {revenueValue !== undefined && (
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

export function OfferHeroChart({ data, currency }: OfferHeroChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full rounded-lg bg-card border border-white/5 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Não há dados suficientes para exibir o gráfico
        </p>
      </div>
    );
  }

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
            <AreaChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <defs>
                <linearGradient id="investmentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
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
              <Area
                type="monotone"
                dataKey="investment"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#investmentGradient)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                fillOpacity={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

