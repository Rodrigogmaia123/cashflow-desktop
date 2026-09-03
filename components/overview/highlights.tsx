import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WorkspaceTopOffer } from "@/lib/analytics/dashboard";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type HighlightsProps = {
  topOffer: WorkspaceTopOffer | null;
  worstOffer: WorkspaceTopOffer | null;
  dominantExpenseCategory: string | null;
  revenueGrowth: number | null; // delta percentual vs período anterior
  currency: CurrencyCode;
  hideOffers?: boolean;
};

function formatPercentage(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function Highlights({
  topOffer,
  worstOffer,
  dominantExpenseCategory,
  revenueGrowth,
  currency,
  hideOffers = false,
}: HighlightsProps) {
  const highlights: Array<{
    icon: string;
    title: string;
    description: string;
  }> = [];

  if (!hideOffers && topOffer && topOffer.profit > 0) {
    highlights.push({
      icon: "🏆",
      title: "Melhor oferta do período",
      description: `${topOffer.offerName} gerou ${formatMoney(topOffer.profit, currency)} de lucro (ROI: ${(topOffer.roi * 100).toFixed(1)}%)`
    });
  }

  if (!hideOffers && worstOffer && worstOffer.profit < 0) {
    highlights.push({
      icon: "⚠️",
      title: "Oferta com prejuízo",
      description: `${worstOffer.offerName} está gerando prejuízo de ${formatMoney(Math.abs(worstOffer.profit), currency)}`
    });
  }

  if (dominantExpenseCategory) {
    highlights.push({
      icon: "💰",
      title: "Categoria de despesa dominante",
      description: `${dominantExpenseCategory} representa a maior parte das despesas`
    });
  }

  if (revenueGrowth !== null && highlights.length < 3) {
    const isGrowth = revenueGrowth > 0;
    highlights.push({
      icon: isGrowth ? "📈" : "📉",
      title: isGrowth ? "Crescimento no período" : "Queda no período",
      description: `Receita ${isGrowth ? "cresceu" : "caiu"} ${formatPercentage(Math.abs(revenueGrowth))} vs período anterior`
    });
  }

  if (highlights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Destaques do Período</h3>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Não há destaques suficientes no período. Continue registrando dados para gerar insights.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold">Destaques do Período</h3>
        <p className="mt-1 text-xs text-muted-foreground">Insights automáticos gerados</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {highlights.slice(0, 3).map((highlight, index) => (
            <div key={index} className="flex items-start gap-3 rounded-lg border border-white/5 bg-card-secondary/50 p-4 transition-colors hover:bg-card-secondary">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-xl">
                {highlight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{highlight.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{highlight.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
