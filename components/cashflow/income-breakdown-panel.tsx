import { DonutChart, DonutEmpty, type DonutSlice } from "@/components/cashflow/donut-chart";
import type { CurrencyCode } from "@/lib/domain/currency";

type IncomeBreakdown = {
  total: number;
  bySource: { offers: number; manual: number };
  manualByCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
};

const sourceColors = {
  offers: "#c7f156",
  manual: "#6aa7ff"
} as const;

const manualCategoryPalette = ["#6aa7ff", "#ac93ff", "#c7f156", "#f0b35a", "#8fd37a", "#f08a7a"] as const;

const donutCard = "rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-[22px]";

export function IncomeBreakdownPanel({
  data,
  currency,
  hideOffers = false,
}: {
  data: IncomeBreakdown;
  currency: CurrencyCode;
  hideOffers?: boolean;
}) {
  if (data.total === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border border-white/5 bg-card-secondary/30">
        <p className="text-sm text-muted-foreground">
          Sem entradas no período selecionado.
        </p>
      </div>
    );
  }

  const bySource: DonutSlice[] = [
    {
      id: "offers",
      label: "Ofertas",
      amount: data.bySource.offers,
      percentage: data.total === 0 ? 0 : data.bySource.offers / data.total,
      color: sourceColors.offers
    },
    {
      id: "manual",
      label: "Entradas manuais",
      amount: data.bySource.manual,
      percentage: data.total === 0 ? 0 : data.bySource.manual / data.total,
      color: sourceColors.manual
    }
  ].filter((s) => s.amount > 0 && (!hideOffers || s.id !== "offers"));

  const manualByCategory: DonutSlice[] = data.manualByCategory.map((c, idx) => ({
    id: c.categoryId ?? `null:${c.categoryName}`,
    label: c.categoryName,
    amount: c.amount,
    percentage: c.percentage,
    color: manualCategoryPalette[idx % manualCategoryPalette.length]
  }));

  return (
    <div className={hideOffers ? "grid gap-[18px]" : "grid gap-[18px] md:grid-cols-2"}>
      {!hideOffers && (
      <section className={donutCard}>
        <h2 className="font-display text-base font-semibold">Entradas por origem</h2>
        <DonutChart data={bySource} currency={currency} />
      </section>
      )}

      <section className={donutCard}>
        <h2 className="font-display text-base font-semibold">Entradas manuais por categoria</h2>
        {data.bySource.manual === 0 ? (
          <DonutEmpty message="Sem entradas manuais no período." />
        ) : (
          <DonutChart data={manualByCategory} currency={currency} />
        )}
      </section>
    </div>
  );
}


