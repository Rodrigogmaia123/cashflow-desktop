import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BusinessAlert } from "@/lib/analytics/business-alerts";

type AlertCardProps = {
  alert: BusinessAlert;
  actionLabel?: string;
  href?: string;
};

export function AlertCard({ alert, actionLabel, href }: AlertCardProps) {
  const levelStyles = {
    CRITICAL: {
      bg: "bg-destructive-soft",
      border: "border-destructive-vibrant/30",
      icon: "text-destructive-vibrant",
      title: "text-destructive-vibrant"
    },
    WARNING: {
      bg: "bg-warning-soft",
      border: "border-warning/30",
      icon: "text-warning",
      title: "text-warning"
    },
    INFO: {
      bg: "bg-primary-soft",
      border: "border-primary/30",
      icon: "text-primary",
      title: "text-primary"
    }
  };

  const style = levelStyles[alert.level];

  return (
    <Card className={cn("border bg-card", style.border)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertIcon level={alert.level} className={cn("h-5 w-5 flex-shrink-0 mt-0.5", style.icon)} />
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className={cn("text-sm font-semibold", style.title)}>{alert.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{alert.description}</p>
            {actionLabel && (
              <div className="pt-1">
                {href ? (
                  <a href={href}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      {actionLabel}
                    </Button>
                  </a>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    {actionLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertIcon({ level, className }: { level: BusinessAlert["level"]; className?: string }) {
  if (level === "CRITICAL") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
