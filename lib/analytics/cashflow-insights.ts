import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getWorkspaceCashflow } from "@/lib/analytics/cashflow";
import { resolvePreviousDateRange } from "@/lib/analytics/date-range";
import { requireAdvancedReports } from "@/lib/plans/authorization";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export type CashflowInsight = {
  id: string;
  level: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string;
  };
};

function formatAmount(value: number, currency: CurrencyCode) {
  return formatMoney(value, currency);
}

function formatPct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

function pctDominant(params: { a: number; b: number }) {
  const total = params.a + params.b;
  if (total <= 0) return { dominant: null as "a" | "b" | null, pct: 0 };
  const pctA = params.a / total;
  const pctB = params.b / total;
  if (pctA >= pctB) return { dominant: "a" as const, pct: pctA };
  return { dominant: "b" as const, pct: pctB };
}

function safeNumber(d: Decimal) {
  return d.toNumber();
}

export async function getCashflowInsights(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
}): Promise<CashflowInsight[]> {
  // Bloqueio: Insights requerem relatórios avançados (comparação de períodos)
  const advancedReportsCheck = await requireAdvancedReports();
  if (!advancedReportsCheck.allowed) {
    // Retorna array vazio ao invés de erro para não quebrar UI
    // A UI deve usar FeatureLock para mostrar o bloqueio
    return [];
  }

  const current = await getWorkspaceCashflow({
    workspaceId: params.workspaceId,
    startDate: params.startDate,
    endDate: params.endDate
  });

  const previousRange = resolvePreviousDateRange({
    startDate: current.resolvedRange.startDate,
    endDate: current.resolvedRange.endDate
  });

  const previous = await getWorkspaceCashflow({
    workspaceId: params.workspaceId,
    startDate: previousRange.startDate,
    endDate: previousRange.endDate
  });

  const insights: CashflowInsight[] = [];
  const currency = current.displayCurrency;

  const netProfit = safeNumber(current.kpis.netProfit);
  const revenueTotal = safeNumber(current.kpis.totalRevenue);
  const revenueOffers = safeNumber(current.kpis.revenueFromOffers);
  const revenueManual = safeNumber(current.kpis.revenueFromManual);
  const totalFees = safeNumber(current.kpis.totalFees);

  const prevRevenueTotal = safeNumber(previous.kpis.totalRevenue);
  const revenueGrowthDelta = revenueTotal - prevRevenueTotal;
  const revenueGrowth = prevRevenueTotal === 0 ? revenueGrowthDelta : revenueGrowthDelta / Math.abs(prevRevenueTotal);

  // Insight 1 — Caixa negativo
  if (netProfit < 0) {
    insights.push({
      id: "cashflow-negative",
      level: "CRITICAL",
      title: "Caixa negativo no período",
      description:
        "Suas saídas superaram suas entradas neste período. Avalie despesas e custos operacionais.",
      metric: {
        label: "Lucro líquido",
        value: formatAmount(netProfit, currency)
      }
    });
  }

  // Insight 2 — Dependência excessiva de uma origem (>= 80%)
  {
    const { dominant, pct } = pctDominant({
      a: current.incomeBreakdown.bySource.offers,
      b: current.incomeBreakdown.bySource.manual
    });

    if (dominant && pct >= 0.8) {
      const label = dominant === "a" ? "Ofertas" : "Entradas manuais";
      insights.push({
        id: "income-dependence",
        level: "WARNING",
        title: "Alta dependência de uma única fonte de receita",
        description: "Mais de 80% das suas entradas vêm de uma única origem.",
        metric: {
          label: "Origem dominante",
          value: `${label} (${formatPct(pct, 0)})`
        }
      });
    }
  }

  // Insight 3 — Categoria dominante de despesa (>= 50% das despesas manuais)
  {
    const top = current.outflowBreakdown.manualByCategory[0];
    if (top && top.percentage >= 0.5 && current.outflowBreakdown.bySource.manualExpenses > 0) {
      insights.push({
        id: "expense-dominant-category",
        level: "WARNING",
        title: "Despesa concentrada em uma categoria",
        description: `A categoria '${top.categoryName}' representa mais da metade das suas despesas manuais.`,
        metric: {
          label: "Categoria",
          value: `${top.categoryName} (${formatPct(top.percentage, 0)})`
        }
      });
    }
  }

  // Insight 4 — Fees elevados vs receita de ofertas (>= 30%)
  {
    if (revenueOffers > 0) {
      const feesRatio = totalFees / revenueOffers;
      if (feesRatio >= 0.3) {
        insights.push({
          id: "fees-high",
          level: "CRITICAL",
          title: "Custos elevados nas ofertas",
          description: "Mais de 30% da receita das ofertas está sendo consumida por taxas.",
          metric: {
            label: "Percentual em fees",
            value: formatPct(feesRatio, 0)
          }
        });
      }
    }
  }

  // Insight 5 — Boa saúde financeira (INFO)
  {
    const feesRatio = revenueOffers > 0 ? totalFees / revenueOffers : 0;
    if (netProfit > 0 && revenueGrowth >= 0 && feesRatio < 0.25) {
      insights.push({
        id: "healthy",
        level: "INFO",
        title: "Saúde financeira positiva",
        description: "Seu fluxo de caixa está saudável neste período."
      });
    }
  }

  // Ordena por severidade (CRITICAL > WARNING > INFO)
  const priority = { CRITICAL: 3, WARNING: 2, INFO: 1 } as const;
  insights.sort((a, b) => priority[b.level] - priority[a.level]);

  // Pequena proteção: se não teve entradas e nem saídas, não mostra “saudável”
  if (revenueTotal === 0 && revenueOffers === 0 && revenueManual === 0) {
    return insights.filter((i) => i.id !== "healthy");
  }

  return insights;
}


