import type { PeriodComparisonResult } from "@/lib/analytics/period-comparison";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

type PeriodSummaryProps = {
  comparison: PeriodComparisonResult;
  currency: CurrencyCode;
  hideRoi?: boolean;
  periodDays?: number;
};

function formatDelta(deltaPct: number) {
  const sign = deltaPct > 0 ? "+" : "";
  return `${sign}${deltaPct.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function PeriodSummary({ comparison, currency, hideRoi = false, periodDays = 30 }: PeriodSummaryProps) {
  return (
    <section className={cn(surface, "p-5")}>
      <h2 className="font-display text-base font-semibold">Histórico de comparação</h2>
      <p className="mt-1 text-xs text-[#64706a]">Últimos {periodDays} dias vs período anterior · equivalente</p>
      <div className="mt-5 space-y-5">
        <CompareRow
          label="Lucro"
          current={comparison.profit.current}
          previous={comparison.profit.previous}
          currentLabel={formatMoney(comparison.profit.current, currency)}
          previousLabel={formatMoney(comparison.profit.previous, currency)}
          deltaPct={comparison.profit.deltaPct}
        />
        {!hideRoi && (
          <CompareRow
            label="ROI"
            current={comparison.roi.current}
            previous={comparison.roi.previous}
            currentLabel={`${(comparison.roi.current * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
            previousLabel={`${(comparison.roi.previous * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
            deltaPct={comparison.roi.deltaPct}
          />
        )}
      </div>
    </section>
  );
}

function CompareRow({
  label,
  current,
  previous,
  currentLabel,
  previousLabel,
  deltaPct
}: {
  label: string;
  current: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
  deltaPct: number;
}) {
  const max = Math.max(Math.abs(current), Math.abs(previous), 0.0001);
  const currentWidth = `${(Math.abs(current) / max) * 100}%`;
  const previousWidth = `${(Math.abs(previous) / max) * 100}%`;
  const up = deltaPct >= 0;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">{label}</div>
          <div className="mt-1 font-display text-[26px] font-semibold leading-none">{currentLabel}</div>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 font-mono text-[11px]",
          up ? "bg-[rgba(143,211,122,0.12)] text-[#8fd37a]" : "bg-[rgba(240,138,122,0.12)] text-[#f08a7a]"
        )}>
          {formatDelta(deltaPct)}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <Bar label="Atual" width={currentWidth} strong />
        <Bar label="Anterior" width={previousWidth} end={previousLabel} />
      </div>
    </div>
  );
}

function Bar({ label, width, strong, end }: { label: string; width: string; strong?: boolean; end?: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-2 text-[11px] text-[#64706a]">
      <span>{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <span className={cn("block h-full rounded-full", strong ? "bg-[#c9bcff]" : "bg-white/25")} style={{ width }} />
      </span>
      <span className="font-mono text-[#9ca9a1]">{end ?? ""}</span>
    </div>
  );
}
