import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WeeklySnapshot as WeeklySnapshotType } from "@/lib/analytics/weekly-snapshot";

type WeeklySnapshotProps = {
  snapshot: WeeklySnapshotType;
};

function TrendIndicator({ trend }: { trend: { direction: "up" | "down" | "neutral"; percentage: number } }) {
  if (trend.direction === "neutral") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs font-semibold text-muted-foreground">
        <span>=</span>
        <span>{trend.percentage.toFixed(1)}%</span>
      </span>
    );
  }

  const colorClass = trend.direction === "up" 
    ? "text-accent bg-white/5 border border-accent/30" 
    : "text-destructive-vibrant bg-white/5 border border-destructive-vibrant/30";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      {trend.direction === "up" ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span>{trend.percentage.toFixed(1)}%</span>
    </span>
  );
}

export function WeeklySnapshot({ snapshot }: WeeklySnapshotProps) {
  if (snapshot.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Resumo da Semana</h3>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Não há dados suficientes para gerar o resumo semanal.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader>
        <h3 className="text-sm font-semibold">Resumo da Semana</h3>
        <p className="mt-1 text-xs text-muted-foreground">Últimos 7 dias vs semana anterior</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {snapshot.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border border-white/5 bg-card-secondary/50 p-3 transition-colors hover:bg-card-secondary">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors ${
                  item.title.toLowerCase().includes("receita") || item.title.toLowerCase().includes("revenue")
                    ? "bg-primary-soft"
                    : item.title.toLowerCase().includes("lucro") || item.title.toLowerCase().includes("profit")
                    ? "bg-accent-soft"
                    : item.title.toLowerCase().includes("oferta") || item.title.toLowerCase().includes("offer")
                    ? "bg-primary-soft"
                    : "bg-white/5"
                }`}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.title}</div>
                  <div className="mt-0.5 text-sm font-semibold">{item.value}</div>
                </div>
              </div>
              {item.trend && <TrendIndicator trend={item.trend} />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
