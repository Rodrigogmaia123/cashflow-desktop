import type { WorkspaceTopOffer } from "@/lib/analytics/dashboard";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

type HighlightsProps = {
  topOffer: WorkspaceTopOffer | null;
  worstOffer: WorkspaceTopOffer | null;
  dominantExpenseCategory: string | null;
  revenueGrowth: number | null;
  currency: CurrencyCode;
  hideOffers?: boolean;
};

function formatPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function Highlights({
  topOffer,
  worstOffer,
  dominantExpenseCategory,
  revenueGrowth,
  currency,
  hideOffers = false
}: HighlightsProps) {
  const highlights: Array<{ tone: string; mark: string; title: string; description: string }> = [];

  if (!hideOffers && topOffer && topOffer.profit > 0) {
    highlights.push({
      tone: "text-[#c7f156]",
      mark: "★",
      title: "Melhor oferta do período",
      description: `${topOffer.offerName} gerou ${formatMoney(topOffer.profit, currency)} de lucro (ROI ${(topOffer.roi * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`
    });
  }

  if (!hideOffers && worstOffer && worstOffer.profit < 0) {
    highlights.push({
      tone: "text-[#f08a7a]",
      mark: "!",
      title: "Oferta com prejuízo",
      description: `${worstOffer.offerName} está gerando prejuízo de ${formatMoney(Math.abs(worstOffer.profit), currency)}`
    });
  }

  if (dominantExpenseCategory) {
    highlights.push({
      tone: "text-[#f0b35a]",
      mark: "•",
      title: "Categoria de despesa dominante",
      description: `${dominantExpenseCategory} representa a maior parte das despesas`
    });
  }

  if (revenueGrowth !== null && highlights.length < 3) {
    const isGrowth = revenueGrowth > 0;
    highlights.push({
      tone: isGrowth ? "text-[#c7f156]" : "text-[#f08a7a]",
      mark: isGrowth ? "↑" : "↓",
      title: isGrowth ? "Crescimento no período" : "Queda no período",
      description: `Receita ${isGrowth ? "cresceu" : "caiu"} ${formatPercentage(Math.abs(revenueGrowth))} vs período anterior`
    });
  }

  return (
    <section className={cn(surface, "p-5")}>
      <h2 className="font-display text-base font-semibold">Destaques do período</h2>
      <p className="mt-1 text-xs text-[#64706a]">Insights automáticos gerados</p>
      {highlights.length === 0 ? (
        <p className="mt-4 text-sm text-[#9ca9a1]">Não há destaques suficientes no período. Continue registrando dados para gerar insights.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {highlights.slice(0, 3).map((highlight) => (
            <div key={highlight.title} className="flex items-start gap-3">
              <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-sm", highlight.tone)}>
                {highlight.mark}
              </span>
              <div>
                <div className="text-sm font-medium">{highlight.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-[#9ca9a1]">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
