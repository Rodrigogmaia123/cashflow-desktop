import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BusinessAlert } from "@/lib/analytics/business-alerts";

type BusinessAlertsProps = {
  alerts: BusinessAlert[];
};

function AlertIcon({ level }: { level: BusinessAlert["level"] }) {
  const iconClass = "h-4 w-4";
  if (level === "CRITICAL") {
    return (
      <svg
        className={`${iconClass} text-destructive`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  }
  if (level === "WARNING") {
    return (
      <svg
        className={`${iconClass} text-warning`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  }
  return (
    <svg
      className={`${iconClass} text-primary`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function AlertCard({ alert }: { alert: BusinessAlert }) {
  const levelStyles = {
    CRITICAL: "border-destructive/30 bg-destructive/10",
    WARNING: "border-warning/30 bg-warning/10",
    INFO: "border-primary/30 bg-primary/10"
  };

  return (
    <div className={`rounded-xl border p-4 transition-all hover:shadow-lg ${levelStyles[alert.level]}`}>
      <div className="flex items-start gap-3">
        <AlertIcon level={alert.level} />
        <div className="flex-1 space-y-1.5">
          <div className="text-sm font-semibold">{alert.title}</div>
          <div className="text-xs leading-relaxed text-muted-foreground">{alert.description}</div>
        </div>
      </div>
    </div>
  );
}

export function BusinessAlerts({ alerts }: BusinessAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Alertas de Negócio</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <svg
              className="h-8 w-8 text-muted-foreground mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-muted-foreground">
              Nenhum alerta relevante neste período.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold">Alertas de Negócio</h3>
        <p className="text-xs text-muted-foreground">
          Avisos e insights importantes sobre o período
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
