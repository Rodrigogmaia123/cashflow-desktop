import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BusinessAlert } from "@/lib/analytics/business-alerts";
import { Decimal } from "@prisma/client/runtime/library";

type BusinessHealthProps = {
  alerts: BusinessAlert[];
  netProfit: Decimal;
  title?: string;
  emptyMessage?: string;
};

function getHealthStatus(alerts: BusinessAlert[], netProfit: Decimal): {
  status: "healthy" | "attention" | "risk";
  label: string;
  color: string;
  bgColor: string;
} {
  const hasCritical = alerts.some((a) => a.level === "CRITICAL");
  const hasWarning = alerts.some((a) => a.level === "WARNING");
  const isNegative = netProfit.lessThan(0);

  if (hasCritical || isNegative) {
    return {
      status: "risk",
      label: "Risco",
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    };
  }

  if (hasWarning) {
    return {
      status: "attention",
      label: "Atenção",
    color: "text-warning",
    bgColor: "bg-warning/10"
    };
  }

  return {
    status: "healthy",
    label: "Saudável",
    color: "text-success",
    bgColor: "bg-accent-soft"
  };
}

function getMainAlert(alerts: BusinessAlert[]): BusinessAlert | null {
  if (alerts.length === 0) return null;

  // Prioridade: CRITICAL > WARNING > INFO
  const critical = alerts.find((a) => a.level === "CRITICAL");
  if (critical) return critical;

  const warning = alerts.find((a) => a.level === "WARNING");
  if (warning) return warning;

  return alerts[0];
}

function getStatusIcon(status: "healthy" | "attention" | "risk") {
  if (status === "healthy") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
        <svg className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  if (status === "attention") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
        <svg className="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
      <svg className="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export function BusinessHealth({
  alerts,
  netProfit,
  title = "Saúde do Negócio",
  emptyMessage = "Seu negócio está em boa saúde. Continue monitorando os indicadores regularmente.",
}: BusinessHealthProps) {
  const health = getHealthStatus(alerts, netProfit);
  const mainAlert = getMainAlert(alerts);

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Status geral do período</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 border ${health.color === "text-destructive" ? "bg-destructive-soft border-destructive-vibrant/30" : health.color === "text-warning" ? "bg-warning-soft border-warning/30" : "bg-accent-soft border-accent/30"}`}>
            {getStatusIcon(health.status)}
            <span className={`text-sm font-semibold ${health.color === "text-success" ? "text-accent" : health.color}`}>{health.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mainAlert ? (
          <div className="space-y-3 rounded-lg border border-white/5 bg-card-secondary/50 p-4">
            <div className="text-sm font-semibold">{mainAlert.title}</div>
            <div className="text-xs leading-relaxed text-muted-foreground">{mainAlert.description}</div>
          </div>
        ) : (
          <div className="rounded-lg border border-white/5 bg-card-secondary/50 p-4 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
