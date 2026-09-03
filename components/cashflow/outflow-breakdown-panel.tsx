import { DonutChart, type DonutSlice } from "@/components/cashflow/donut-chart";
import type { CurrencyCode } from "@/lib/domain/currency";

type OutflowBreakdown = {
  total: number;
  bySource: { manualExpenses: number; adInvestment: number; offerCosts: number; investments?: number };
  manualByCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
  offerCostsByType: { checkoutFee: number; gatewayFee: number; tax: number };
};

const sourceColors = {
  manualExpenses: "#FF5C5C", // Vermelho Coral
  adInvestment: "#6366F1", // Índigo (Investimento em Ads)
  offerCosts: "#8B5CF6", // Roxo Violeta (Fees)
  investments: "#3B82F6" // Azul (Investimentos / reserva)
} as const;

const expensesCategoryPalette = ["#FF5C5C", "#FACC15", "#8B5CF6", "#A855F7", "#3B82F6"] as const;

const offerCostColors = {
  checkoutFee: "#FACC15", // Amarelo Âmbar
  gatewayFee: "#FF5C5C", // Vermelho Coral
  tax: "#8B5CF6" // Roxo Violeta
} as const;

export function OutflowBreakdownPanel({
  data,
  currency,
  hideOfferSources = false,
}: {
  data: OutflowBreakdown;
  currency: CurrencyCode;
  hideOfferSources?: boolean;
}) {
  if (data.total === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border border-white/5 bg-card-secondary/30">
        <p className="text-sm text-muted-foreground">
          Sem saídas (despesas, fees, investimentos em ads e investimentos/reserva) no período selecionado.
        </p>
      </div>
    );
  }

  const investmentsAmount = data.bySource.investments ?? 0;
  const bySource: DonutSlice[] = [
    {
      id: "manualExpenses",
      label: "Despesas manuais",
      amount: data.bySource.manualExpenses,
      percentage: data.total === 0 ? 0 : data.bySource.manualExpenses / data.total,
      color: sourceColors.manualExpenses
    },
    {
      id: "adInvestment",
      label: "Investimento em ads",
      amount: data.bySource.adInvestment,
      percentage: data.total === 0 ? 0 : data.bySource.adInvestment / data.total,
      color: sourceColors.adInvestment
    },
    {
      id: "offerCosts",
      label: "Custos das ofertas (fees)",
      amount: data.bySource.offerCosts,
      percentage: data.total === 0 ? 0 : data.bySource.offerCosts / data.total,
      color: sourceColors.offerCosts
    },
    {
      id: "investments",
      label: "Investimentos / reserva",
      amount: investmentsAmount,
      percentage: data.total === 0 ? 0 : investmentsAmount / data.total,
      color: sourceColors.investments
    }
  ].filter((s) => {
    if (s.amount <= 0) return false;
    if (hideOfferSources && (s.id === "adInvestment" || s.id === "offerCosts")) return false;
    return true;
  });

  const manualByCategory: DonutSlice[] = data.manualByCategory.map((c, idx) => ({
    id: c.categoryId ?? `null:${c.categoryName}`,
    label: c.categoryName,
    amount: c.amount,
    percentage: c.percentage,
    color: expensesCategoryPalette[idx % expensesCategoryPalette.length]
  }));

  const offerCostsTotal =
    data.offerCostsByType.checkoutFee + data.offerCostsByType.gatewayFee + data.offerCostsByType.tax;

  const offerCostsByType: DonutSlice[] = [
    {
      id: "checkoutFee",
      label: "Checkout",
      amount: data.offerCostsByType.checkoutFee,
      percentage: offerCostsTotal === 0 ? 0 : data.offerCostsByType.checkoutFee / offerCostsTotal,
      color: offerCostColors.checkoutFee
    },
    {
      id: "gatewayFee",
      label: "Gateway",
      amount: data.offerCostsByType.gatewayFee,
      percentage: offerCostsTotal === 0 ? 0 : data.offerCostsByType.gatewayFee / offerCostsTotal,
      color: offerCostColors.gatewayFee
    },
    {
      id: "tax",
      label: "Imposto",
      amount: data.offerCostsByType.tax,
      percentage: offerCostsTotal === 0 ? 0 : data.offerCostsByType.tax / offerCostsTotal,
      color: offerCostColors.tax
    }
  ].filter((s) => s.amount > 0);

  return (
    <div className="space-y-8">
      <div className={hideOfferSources ? "grid gap-8 md:grid-cols-2" : "grid gap-8 md:grid-cols-3"}>
        <div className="space-y-4">
          <div className="text-sm font-semibold text-foreground">Saídas por origem</div>
          <DonutChart data={bySource} currency={currency} />
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-foreground">Despesas manuais por categoria</div>
          {data.bySource.manualExpenses === 0 ? (
            <div className="flex items-center justify-center h-64 rounded-xl border border-white/5 bg-card-secondary/30">
              <p className="text-sm text-muted-foreground">
                Sem despesas manuais no período.
              </p>
            </div>
          ) : (
            <DonutChart data={manualByCategory} currency={currency} />
          )}
        </div>

        {!hideOfferSources && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-foreground">Custos das ofertas (fees)</div>
          {offerCostsTotal === 0 ? (
            <div className="flex items-center justify-center h-64 rounded-xl border border-white/5 bg-card-secondary/30">
              <p className="text-sm text-muted-foreground">
                Sem custos de ofertas no período.
              </p>
            </div>
          ) : (
            <>
              <DonutChart data={offerCostsByType} currency={currency} />
              <p className="text-xs text-muted-foreground">
                Custos das ofertas são calculados automaticamente via snapshots históricos.
              </p>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
}


