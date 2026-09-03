import { z } from "zod";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

// ==================== SCHEMAS ====================

export const periodReportFiltersSchema = z.object({
  workspaceId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  categoryIds: z.array(z.string()).optional(),
});

export type PeriodReportFilters = z.infer<typeof periodReportFiltersSchema>;

// ==================== INTERFACES ====================

export interface CategoryBudgetReport {
  categoryId: string;
  categoryName: string;
  budgetId: string | null;
  budgetName: string | null;
  // Valores
  budgetedAmount: number; // Valor previsto
  actualSpent: number; // Valor real gasto
  difference: number; // budgetedAmount - actualSpent (+ economia, - estouro)
  percentUsed: number; // (actualSpent / budgetedAmount) * 100
  // Status
  hasExceeded: boolean; // Se estourou
  hasSaved: boolean; // Se economizou (spent < budgeted)
  status: "OK" | "WARNING" | "EXCEEDED" | "NO_BUDGET";
}

export interface PeriodReport {
  // Período
  startDate: Date;
  endDate: Date;
  
  // Totais
  totalBudgeted: number; // Soma de todos os orçamentos do período
  totalSpent: number; // Soma de todas as despesas do período
  totalSaved: number; // Total economizado (só categorias que economizaram)
  totalExceeded: number; // Total estourado (só categorias que estouraram)
  netDifference: number; // totalBudgeted - totalSpent
  
  // Estatísticas
  categoriesWithBudget: number; // Quantas categorias tinham orçamento
  categoriesOK: number; // Quantas ficaram dentro do limite
  categoriesExceeded: number; // Quantas estouraram
  categoriesWithoutBudget: number; // Quantas não tinham orçamento mas tiveram despesas
  
  // Detalhes por categoria
  categories: CategoryBudgetReport[];
  
  // Recomendações
  recommendations: string[];
}

export interface BudgetRenewalInput {
  budgetId: string;
  newStartDate?: Date;
  newEndDate?: Date;
  adjustAmount?: number; // Valor para ajustar (positivo ou negativo)
  adjustPercentage?: number; // % para ajustar (ex: 10 = aumentar 10%)
}

export interface BudgetRenewalResult {
  original: {
    id: string;
    name: string;
    amount: number;
    period: string;
  };
  renewed: {
    id: string;
    name: string;
    amount: number;
    period: string;
  };
  changes: {
    amountChanged: boolean;
    amountDifference: number;
    percentageChange: number;
  };
}

// ==================== UTILS ====================

export function formatCurrency(
  value: number,
  currency: CurrencyCode = "BRL"
): string {
  return formatMoney(value, currency);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getCategoryStatus(report: CategoryBudgetReport): {
  label: string;
  color: string;
  icon: string;
} {
  if (report.status === "NO_BUDGET") {
    return {
      label: "Sem orçamento",
      color: "gray",
      icon: "⚪",
    };
  }

  if (report.hasExceeded) {
    return {
      label: "Estourado",
      color: "red",
      icon: "❌",
    };
  }

  if (report.percentUsed >= 90) {
    return {
      label: "Crítico",
      color: "orange",
      icon: "⚠️",
    };
  }

  if (report.hasSaved) {
    return {
      label: "Economizou",
      color: "green",
      icon: "✅",
    };
  }

  return {
    label: "OK",
    color: "blue",
    icon: "✓",
  };
}

export function generateRecommendations(report: PeriodReport): string[] {
  const recommendations: string[] = [];

  // Taxa de estouro alta
  const exceedRate = (report.categoriesExceeded / report.categoriesWithBudget) * 100;
  if (exceedRate > 50) {
    recommendations.push(
      `${exceedRate.toFixed(0)}% das categorias estouraram. Considere aumentar os orçamentos ou reduzir gastos.`
    );
  }

  // Economia significativa
  if (report.totalSaved > report.totalBudgeted * 0.2) {
    recommendations.push(
      `Você economizou ${formatCurrency(report.totalSaved)}! Considere reduzir os orçamentos para serem mais realistas.`
    );
  }

  // Estouro líquido
  if (report.netDifference < 0) {
    recommendations.push(
      `Você gastou ${formatCurrency(Math.abs(report.netDifference))} a mais que o planejado. Revise seus orçamentos.`
    );
  }

  // Categorias sem orçamento
  if (report.categoriesWithoutBudget > 0) {
    recommendations.push(
      `${report.categoriesWithoutBudget} categorias tiveram despesas mas não tinham orçamento. Considere criar orçamentos para elas.`
    );
  }

  // Desempenho excelente
  if (report.categoriesExceeded === 0 && report.categoriesWithBudget > 0) {
    recommendations.push(
      "🎉 Parabéns! Você ficou dentro do orçamento em todas as categorias!"
    );
  }

  return recommendations;
}
