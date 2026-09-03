"use client";

import { AlertTriangle, TrendingUp, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessAlert } from "@/lib/analytics/business-alerts";

type OfferInsightsProps = {
  alerts: BusinessAlert[];
};

function getAlertIcon(level: BusinessAlert["level"]) {
  switch (level) {
    case "CRITICAL":
      return <AlertTriangle className="h-4 w-4 text-destructive-vibrant" />;
    case "WARNING":
      return <AlertCircle className="h-4 w-4 text-warning" />;
    case "INFO":
      return <Info className="h-4 w-4 text-primary" />;
  }
}

function getAlertStyles(level: BusinessAlert["level"]) {
  switch (level) {
    case "CRITICAL":
      return "border-destructive-vibrant/30 bg-destructive-soft/20";
    case "WARNING":
      return "border-warning/30 bg-warning-soft/20";
    case "INFO":
      return "border-primary/30 bg-primary-soft/20";
  }
}

export function OfferInsights({ alerts }: OfferInsightsProps) {
  // Limitar a 3 insights visíveis
  const visibleAlerts = alerts.slice(0, 3);

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Insights Inteligentes
        </h3>
        <p className="text-xs text-muted-foreground">
          Alertas e comparações automáticas
        </p>
      </div>
      <div className="space-y-2">
        {visibleAlerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "rounded-lg border p-3 flex items-start gap-3",
              getAlertStyles(alert.level)
            )}
          >
            <div className="mt-0.5 flex-shrink-0">
              {getAlertIcon(alert.level)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground mb-1">
                {alert.title}
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {alert.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

