import { Card, CardContent } from "@/components/ui/card";
import type { CashflowInsight } from "@/lib/analytics/cashflow-insights";

function badgeClass(level: CashflowInsight["level"]) {
  const base = "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border";
  if (level === "CRITICAL") return `${base} bg-destructive-soft text-destructive-vibrant border-destructive-vibrant/30`;
  if (level === "WARNING") return `${base} bg-warning-soft text-warning border-warning/30`;
  return `${base} bg-primary-soft text-primary border-primary/30`;
}

function label(level: CashflowInsight["level"]) {
  if (level === "CRITICAL") return "CRÍTICO";
  if (level === "WARNING") return "ATENÇÃO";
  return "INFO";
}

export function CashflowInsights({ insights }: { insights: CashflowInsight[] }) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            Nenhum alerta detectado para este período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((i) => (
        <Card key={i.id}>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={badgeClass(i.level)} title="Insight determinístico (sem IA)">
                    {label(i.level)}
                  </span>
                  <h3 className="text-sm font-semibold">{i.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{i.description}</p>
              </div>

              {i.metric && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-right text-xs">
                  <div className="text-[11px] text-muted-foreground">{i.metric.label}</div>
                  <div className="font-semibold">{i.metric.value}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


