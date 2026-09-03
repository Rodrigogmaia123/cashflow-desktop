import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Decimal } from "@prisma/client/runtime/library";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type OverviewMetricsProps = {
  revenue: Decimal;
  expenses: Decimal;
  profit: Decimal;
  roi: Decimal;
  currency: CurrencyCode;
  hideRoi?: boolean;
};

function formatRoi(value: Decimal) {
  return `${(value.toNumber() * 100).toFixed(2)}%`;
}

export function OverviewMetrics({
  revenue,
  expenses,
  profit,
  roi,
  currency,
  hideRoi = false,
}: OverviewMetricsProps) {
  const isProfitPositive = !profit.lessThan(0);
  const isRoiPositive = !roi.lessThan(1);

  return (
    <div className={`grid gap-6 md:grid-cols-2 ${hideRoi ? "lg:grid-cols-3" : "lg:grid-cols-4"}`} data-tour="overview-metrics">
      <Card className="transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Receita Total</div>
            <div className="h-8 w-8 rounded-lg bg-primary-soft flex items-center justify-center">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-foreground">{formatMoney(revenue, currency)}</div>
          <p className="mt-2 text-xs text-muted-foreground">Últimos 30 dias • Calculado automaticamente</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Despesas Totais</div>
            <div className="h-8 w-8 rounded-lg bg-destructive-soft flex items-center justify-center">
              <svg className="h-4 w-4 text-destructive/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-foreground">{formatMoney(expenses, currency)}</div>
          <p className="mt-2 text-xs text-muted-foreground">Últimos 30 dias • Calculado automaticamente</p>
        </CardContent>
      </Card>

      <Card className={`transition-all hover:shadow-lg hover:-translate-y-0.5 ${isProfitPositive ? "hover:shadow-accent/10" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lucro Líquido</div>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isProfitPositive ? "bg-accent-soft" : "bg-destructive-soft"}`}>
              {isProfitPositive ? (
                <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-destructive/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold tracking-tight ${isProfitPositive ? "text-accent" : "text-foreground"}`}>
            {formatMoney(profit, currency)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Últimos 30 dias • Calculado automaticamente</p>
        </CardContent>
      </Card>

      {!hideRoi && (
      <Card className={`transition-all hover:shadow-lg hover:-translate-y-0.5 ${isRoiPositive ? "hover:shadow-accent/10" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ROI Médio</div>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isRoiPositive ? "bg-accent-soft" : "bg-destructive-soft"}`}>
                <svg className={`h-4 w-4 ${isRoiPositive ? "text-accent" : "text-destructive/70"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold tracking-tight ${isRoiPositive ? "text-accent" : "text-foreground"}`}>
            {formatRoi(roi)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Últimos 30 dias • Calculado automaticamente</p>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
