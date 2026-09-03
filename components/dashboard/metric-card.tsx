import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Prisma } from "@prisma/client";

type MetricCardProps = {
  label: string;
  value: string | number;
  delta?: {
    value: number;
    percentage: number;
  } | null;
  tooltip?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function MetricCard({ label, value, delta, tooltip, icon, className }: MetricCardProps) {
  const content = (
    <Card className={cn("border-white/5 bg-card transition-colors hover:bg-card-hover", className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2 md:mb-3 flex items-center gap-2">
              {/* Mobile: ocultar ícones decorativos */}
              {icon && <div className="hidden md:block text-muted-foreground">{icon}</div>}
              <div className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
            </div>
            {delta && (
              <div className="mt-3">
                <DeltaBadge value={delta.value} percentage={delta.percentage} />
              </div>
            )}
            {tooltip && (
              <div className="mt-3 text-[10px] text-muted-foreground">{tooltip}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (tooltip && !delta) {
    return (
      <Tooltip content={tooltip}>
        <div>{content}</div>
      </Tooltip>
    );
  }

  return content;
}

function DeltaBadge({ value, percentage }: { value: number; percentage: number }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  if (!isPositive && !isNegative) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <span>=</span>
        <span>{Math.abs(percentage).toFixed(1)}%</span>
      </span>
    );
  }

  const colorClass = isPositive
    ? "bg-success-soft text-success-vibrant border-success-vibrant/30"
    : "bg-destructive-soft text-destructive-vibrant border-destructive-vibrant/30";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold", colorClass)}>
      {isPositive ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span>{Math.abs(percentage).toFixed(1)}%</span>
    </span>
  );
}
