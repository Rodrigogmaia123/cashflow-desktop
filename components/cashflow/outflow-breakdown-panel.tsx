import { DonutChart, DonutEmpty, type DonutSlice } from "@/components/cashflow/donut-chart";
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
  manualExpenses: "#f08a7a",
  adInvestment: "#ac93ff",
  offerCosts: "#f0b35a",
  investments: "#6aa7ff"
} as const;

const expensesCategoryPalette = ["#ac93ff", "#c7f156", "#f0b35a", "#6aa7ff", "#f08a7a", "#8fd37a"] as const;

const offerCostColors = {
  checkoutFee: "#f0b35a",
  gatewayFee: "#f08a7a",
  tax: "#ac93ff"
} as const;

const donutCard = "rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-[22px]";

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
    <div className={hideOfferSources ? "grid gap-[18px] md:grid-cols-2" : "grid gap-[18px] lg:grid-cols-3"}>
      <section className={donutCard}>
        <h2 className="font-display text-base font-semibold">Saídas por origem</h2>
        <DonutChart data={bySource} currency={currency} />
      </section>

      <section className={donutCard}>
        <h2 className="font-display text-base font-semibold">Despesas manuais por categoria</h2>
        {data.bySource.manualExpenses === 0 ? (
          <DonutEmpty message="Sem despesas manuais no período." />
        ) : (
          <DonutChart data={manualByCategory} currency={currency} />
        )}
      </section>

      {!hideOfferSources && (
      <section className={donutCard}>
        <h2 className="font-display text-base font-semibold">Custos das ofertas (fees)</h2>
        {offerCostsTotal === 0 ? (
          <DonutEmpty message="Sem custos de ofertas no período." />
        ) : (
          <DonutChart data={offerCostsByType} currency={currency} />
        )}
      </section>
      )}
    </div>
  );
}


