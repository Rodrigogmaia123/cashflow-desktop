"use client";

import { cn } from "@/lib/utils";
import { formatLocalDate } from "@/lib/utils/date-local";

type OfferStatus = "ACTIVE" | "PAUSED" | "DEAD";

type OfferHeroHeaderProps = {
  name: string;
  status: OfferStatus;
  period: {
    startDate: Date;
    endDate: Date;
  };
  currentROI: number;
};

function formatROI(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function getStatusConfig(status: OfferStatus) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Ativa",
        className: "text-accent bg-accent-soft/30 border-accent/20",
        dotClassName: "bg-accent"
      };
    case "PAUSED":
      return {
        label: "Pausada",
        className: "text-warning bg-warning-soft/30 border-warning/20",
        dotClassName: "bg-warning"
      };
    case "DEAD":
      return {
        label: "Finalizada",
        className: "text-muted-foreground bg-muted/20 border-muted/20",
        dotClassName: "bg-muted-foreground"
      };
  }
}

export function OfferHeroHeader({
  name,
  status,
  period,
  currentROI
}: OfferHeroHeaderProps) {
  const statusConfig = getStatusConfig(status);
  const isROIPositive = currentROI >= 1;

  return (
    <div className="space-y-4">
      {/* Nome e Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {name}
        </h1>
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium",
            statusConfig.className
          )}
        >
          <div className={cn("h-2 w-2 rounded-full", statusConfig.dotClassName)} />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Período e ROI */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Período:{" "}
          <span className="font-medium text-foreground">
            {formatLocalDate(period.startDate)} → {formatLocalDate(period.endDate)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              ROI Atual
            </div>
            <div
              className={cn(
                "text-2xl md:text-3xl font-bold tracking-tight",
                isROIPositive ? "text-accent" : "text-foreground"
              )}
            >
              {formatROI(currentROI)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

