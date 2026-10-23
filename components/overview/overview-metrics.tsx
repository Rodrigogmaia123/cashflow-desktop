import { Decimal } from "@prisma/client/runtime/library";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

type OverviewMetricsProps = {
  revenue: Decimal;
  expenses: Decimal;
  profit: Decimal;
  roi: Decimal;
  currency: CurrencyCode;
  hideRoi?: boolean;
  periodLabel?: string;
};

function formatRoi(value: Decimal) {
  return `${(value.toNumber() * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function OverviewMetrics({
  revenue,
  expenses,
  profit,
  roi,
  currency,
  hideRoi = false,
  periodLabel = "30 dias"
}: OverviewMetricsProps) {
  const profitUp = !profit.lessThan(0);
  const footnote = `Últimos ${periodLabel} · calculado automaticamente`;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", hideRoi && "sm:grid-cols-1 lg:grid-cols-3")} data-tour="overview-metrics">
      <Metric label="Receita total" value={formatMoney(revenue, currency)} footnote={footnote} mark="bg-[#ac93ff]" />
      <Metric label="Despesas totais" value={formatMoney(expenses, currency)} footnote={footnote} mark="bg-[#f08a7a]" />
      <Metric
        label="Lucro líquido"
        value={formatMoney(profit, currency)}
        footnote={footnote}
        mark="bg-[#c7f156]"
        valueClass={profitUp ? "text-[#c7f156]" : "text-[#f08a7a]"}
        highlight
      />
      {!hideRoi && (
        <Metric label="ROI médio" value={formatRoi(roi)} footnote={footnote} mark="bg-[#ac93ff]" />
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  footnote,
  mark,
  valueClass,
  highlight
}: {
  label: string;
  value: string;
  footnote: string;
  mark: string;
  valueClass?: string;
  highlight?: boolean;
}) {
  return (
    <article className={cn(surface, "p-4", highlight && "border-[rgba(199,241,86,0.45)] shadow-[inset_0_0_0_1px_rgba(199,241,86,0.12)]")}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">{label}</div>
        <span className={cn("h-2 w-2 rounded-full", mark)} />
      </div>
      <div className={cn("mt-3 font-display text-[28px] font-semibold leading-none tracking-tight", valueClass)}>{value}</div>
      <p className="mt-3 text-[11px] text-[#64706a]">{footnote}</p>
    </article>
  );
}
