"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PeriodComparisonResult } from "@/lib/analytics/period-comparison";
import { Tooltip } from "@/components/ui/tooltip";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type PeriodComparisonPanelProps = {
  comparison: PeriodComparisonResult;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  currency?: CurrencyCode;
};

function formatPercentage(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatRoi(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function DeltaIndicator({ deltaPct }: { deltaPct: number }) {
  if (deltaPct === 0) {
    return (
      <span className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        <span>=</span>
        <span>{formatPercentage(deltaPct)}</span>
      </span>
    );
  }

  const isPositive = deltaPct > 0;
  const className = isPositive
    ? "bg-success-soft text-success-vibrant border-success-vibrant/30"
    : "bg-destructive-soft text-destructive-vibrant border-destructive-vibrant/30";

  return (
    <span className={`ml-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {isPositive ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span>{formatPercentage(deltaPct)}</span>
    </span>
  );
}

function ComparisonCard({
  label,
  current,
  previous,
  delta,
  deltaPct,
  formatter
}: {
  label: string;
  current: number;
  previous: number;
  delta: number;
  deltaPct: number;
  formatter: (value: number) => string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-card-secondary/50 p-4 transition-colors hover:bg-card-secondary">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold tracking-tight">
            {formatter(current)}
          </span>
          <DeltaIndicator deltaPct={deltaPct} />
        </div>
        <div className="text-xs text-muted-foreground">
          Período anterior: {formatter(previous)}
        </div>
        {delta !== 0 && (
          <div className="text-xs text-muted-foreground">
            Variação: {delta >= 0 ? "+" : ""}{formatter(delta)}
          </div>
        )}
      </div>
    </div>
  );
}

export function PeriodComparisonPanel({
  comparison,
  currentStart,
  currentEnd,
  previousStart,
  previousEnd,
  currency = "BRL"
}: PeriodComparisonPanelProps) {
  const money = (value: number) => formatMoney(value, currency);
  const formatDateRange = (start: Date, end: Date) => {
    const formatDate = (date: Date) => {
      const day = String(date.getUTCDate()).padStart(2, "0");
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    };
    return `${formatDate(start)} → ${formatDate(end)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <Tooltip content="Compare dois períodos equivalentes para identificar tendências e mudanças no desempenho. Todos os cálculos são feitos automaticamente no servidor.">
            <h3 className="text-sm font-semibold cursor-help">Comparação de Períodos</h3>
          </Tooltip>
          <p className="text-xs text-muted-foreground">
            Comparação entre períodos equivalentes para análise de tendências
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/5 bg-card-secondary/50 p-4 text-xs">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Período Atual</div>
            <div className="mt-2 text-sm font-semibold text-foreground">{formatDateRange(currentStart, currentEnd)}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Período Anterior</div>
            <div className="mt-2 text-sm font-semibold text-foreground">{formatDateRange(previousStart, previousEnd)}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <ComparisonCard
            label="Investimento"
            current={comparison.investment.current}
            previous={comparison.investment.previous}
            delta={comparison.investment.delta}
            deltaPct={comparison.investment.deltaPct}
            formatter={money}
          />
          <ComparisonCard
            label="Faturamento"
            current={comparison.revenue.current}
            previous={comparison.revenue.previous}
            delta={comparison.revenue.delta}
            deltaPct={comparison.revenue.deltaPct}
            formatter={money}
          />
          <ComparisonCard
            label="Custos"
            current={comparison.costs.current}
            previous={comparison.costs.previous}
            delta={comparison.costs.delta}
            deltaPct={comparison.costs.deltaPct}
            formatter={money}
          />
          <ComparisonCard
            label="Lucro"
            current={comparison.profit.current}
            previous={comparison.profit.previous}
            delta={comparison.profit.delta}
            deltaPct={comparison.profit.deltaPct}
            formatter={money}
          />
          <ComparisonCard
            label="ROI"
            current={comparison.roi.current}
            previous={comparison.roi.previous}
            delta={comparison.roi.delta}
            deltaPct={comparison.roi.deltaPct}
            formatter={formatRoi}
          />
        </div>
      </CardContent>
    </Card>
  );
}
