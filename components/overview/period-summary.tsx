import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PeriodComparisonResult } from "@/lib/analytics/period-comparison";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type PeriodSummaryProps = {
  comparison: PeriodComparisonResult;
  currency: CurrencyCode;
  hideRoi?: boolean;
};

function formatDeltaPct(deltaPct: number) {
  const sign = deltaPct >= 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(1)}%`;
}

function DeltaIndicator({ deltaPct }: { deltaPct: number }) {
  if (deltaPct === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-semibold text-muted-foreground">
        <span>=</span>
        <span>{formatDeltaPct(deltaPct)}</span>
      </span>
    );
  }

  const isPositive = deltaPct > 0;
  const colorClass = isPositive 
    ? "text-accent bg-white/5 border-accent/30" 
    : "text-destructive-vibrant bg-white/5 border-destructive-vibrant/30";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold ${colorClass}`}>
      {isPositive ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span>{formatDeltaPct(deltaPct)}</span>
    </span>
  );
}

export function PeriodSummary({ comparison, currency, hideRoi = false }: PeriodSummaryProps) {
  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader>
        <h3 className="text-sm font-semibold">Histórico de Comparação</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Últimos 30 dias vs período anterior equivalente
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-card-secondary/50 p-4">
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lucro</div>
              <div className="text-lg font-bold">{formatMoney(comparison.profit.current, currency)}</div>
              <div className="text-xs text-muted-foreground">
                Período anterior: {formatMoney(comparison.profit.previous, currency)}
              </div>
            </div>
            <DeltaIndicator deltaPct={comparison.profit.deltaPct} />
          </div>

          {!hideRoi && (
          <div className="flex items-center justify-between rounded-lg border border-white/5 bg-card-secondary/50 p-4">
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ROI</div>
              <div className="text-lg font-bold">{(comparison.roi.current * 100).toFixed(2)}%</div>
              <div className="text-xs text-muted-foreground">
                Período anterior: {(comparison.roi.previous * 100).toFixed(2)}%
              </div>
            </div>
            <DeltaIndicator deltaPct={comparison.roi.deltaPct} />
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
