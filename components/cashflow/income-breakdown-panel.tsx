import { DonutChart, type DonutSlice } from "@/components/cashflow/donut-chart";
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
  offers: "#7CFF6B", // Verde Lima
  manual: "#3B82F6" // Azul Elétrico
} as const;

const manualCategoryPalette = ["#3B82F6", "#7CFF6B", "#8B5CF6", "#A855F7", "#4DFF88"] as const;

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
    <div className={hideOffers ? "grid gap-8" : "grid gap-8 md:grid-cols-2"}>
      {!hideOffers && (
      <div className="space-y-4">
        <div className="text-sm font-semibold text-foreground">Entradas por origem</div>
        <DonutChart data={bySource} currency={currency} />
      </div>
      )}

      <div className="space-y-4">
        <div className="text-sm font-semibold text-foreground">Entradas manuais por categoria</div>
        {data.bySource.manual === 0 ? (
          <div className="flex items-center justify-center h-64 rounded-xl border border-white/5 bg-card-secondary/30">
            <p className="text-sm text-muted-foreground">
              Sem entradas manuais no período.
            </p>
          </div>
        ) : (
          <DonutChart data={manualByCategory} currency={currency} />
        )}
      </div>
    </div>
  );
}


