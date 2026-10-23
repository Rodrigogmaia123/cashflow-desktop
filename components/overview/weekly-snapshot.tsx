import type { WeeklySnapshot as WeeklySnapshotType } from "@/lib/analytics/weekly-snapshot";
import { surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

type WeeklySnapshotProps = {
  snapshot: WeeklySnapshotType;
};

export function WeeklySnapshot({ snapshot }: WeeklySnapshotProps) {
  return (
    <section className={cn(surface, "p-5")}>
      <h2 className="font-display text-base font-semibold">Resumo da semana</h2>
      <p className="mt-1 text-xs text-[#64706a]">Últimos 7 dias vs semana anterior</p>
      {snapshot.items.length === 0 ? (
        <p className="mt-4 text-sm text-[#9ca9a1]">Não há dados suficientes para gerar o resumo semanal.</p>
      ) : (
        <div className="mt-4 divide-y divide-white/10">
          {snapshot.items.map((item) => (
            <div key={item.title} className="flex items-center justify-between gap-3 py-3 first:pt-1">
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", markFor(item.title))} />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">{item.title}</div>
                  <div className="mt-0.5 text-sm font-medium">{item.value}</div>
                </div>
              </div>
              {item.trend && <Trend trend={item.trend} />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function markFor(title: string) {
  const value = title.toLowerCase();
  if (value.includes("lucro")) return "bg-[#c7f156]";
  if (value.includes("roi")) return "bg-[#ac93ff]";
  if (value.includes("oferta")) return "bg-[#6aa7ff]";
  return "bg-[#ac93ff]";
}

function Trend({ trend }: { trend: { direction: "up" | "down" | "neutral"; percentage: number } }) {
  const up = trend.direction !== "down";
  const sign = trend.direction === "down" ? "−" : trend.direction === "up" ? "+" : "";
  return (
    <span className={cn(
      "rounded-full px-2 py-0.5 font-mono text-[11px]",
      trend.direction === "down" ? "bg-[rgba(240,138,122,0.12)] text-[#f08a7a]" : "bg-[rgba(143,211,122,0.12)] text-[#8fd37a]",
      !up && ""
    )}>
      {sign}{trend.percentage.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
    </span>
  );
}
