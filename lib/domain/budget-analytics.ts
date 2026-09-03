import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type { BudgetWithUsage } from "@/types/budget";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { calculateBudgetUsage } from "./budget";

/**
 * Serviço de Análise e Alertas de Orçamentos
 * Fornece insights em tempo real sobre o status dos orçamentos
 */

export type BudgetAlertLevel = "info" | "warning" | "critical" | "exceeded";

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  categoryName: string;
  level: BudgetAlertLevel;
  message: string;
  percentUsed: number;
  spent: number;
  remaining: number;
  amount: number;
}

export interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  budgetsWithAlerts: number;
  budgetsExceeded: number;
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  alerts: BudgetAlert[];
}

/**
 * Determina o nível de alerta baseado no percentual usado
 */
export function getBudgetAlertLevel(
  percentUsed: number,
  isOverBudget: boolean
): BudgetAlertLevel {
  if (isOverBudget) return "exceeded";
  if (percentUsed >= 90) return "critical";
  if (percentUsed >= 75) return "warning";
  return "info";
}

/**
 * Gera mensagem de alerta apropriada
 */
export function getBudgetAlertMessage(
  budgetName: string,
  percentUsed: number,
  isOverBudget: boolean,
  remaining: number,
  currency: CurrencyCode = "BRL"
): string {
  if (isOverBudget) {
    const exceeded = Math.abs(remaining);
    return `Orçamento "${budgetName}" estourado em ${formatMoney(exceeded, currency)}!`;
  }

  if (percentUsed >= 90) {
    return `Orçamento "${budgetName}" crítico: ${percentUsed.toFixed(1)}% usado. Apenas ${formatMoney(remaining, currency)} restantes.`;
  }

  if (percentUsed >= 75) {
    return `Orçamento "${budgetName}" atenção: ${percentUsed.toFixed(1)}% usado. ${formatMoney(remaining, currency)} restantes.`;
  }

  return `Orçamento "${budgetName}" em uso saudável: ${percentUsed.toFixed(1)}% usado.`;
}

/**
 * Analisa um orçamento e retorna alerta se necessário
 */
export function analyzeBudget(budget: BudgetWithUsage): BudgetAlert | null {
  const level = getBudgetAlertLevel(budget.percentUsed, budget.isOverBudget);

  // Apenas retorna alerta se for warning, critical ou exceeded
  if (level === "info") {
    return null;
  }

  return {
    budgetId: budget.id,
    budgetName: budget.name,
    categoryName: budget.category.name,
    level,
    message: getBudgetAlertMessage(
      budget.name,
      budget.percentUsed,
      budget.isOverBudget,
      budget.remaining
    ),
    percentUsed: budget.percentUsed,
    spent: budget.spent,
    remaining: budget.remaining,
    amount: Number(budget.amount),
  };
}

/**
 * Obtém resumo completo de todos os orçamentos ativos de um workspace
 */
export async function getBudgetSummary(
  workspaceId: string
): Promise<BudgetSummary> {
  try {
    // Buscar todos os orçamentos ativos (dentro do período)
    const now = new Date();
    const budgets = await prisma.budget.findMany({
      where: {
        workspaceId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Se não houver orçamentos, retornar resumo vazio
    if (budgets.length === 0) {
      return {
        totalBudgets: 0,
        activeBudgets: 0,
        budgetsWithAlerts: 0,
        budgetsExceeded: 0,
        totalBudgeted: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercentage: 0,
        alerts: [],
      };
    }

    // Calcular uso de cada orçamento
    const budgetsWithUsage = await Promise.all(
      budgets.map((budget) => calculateBudgetUsage(budget))
    );

    // Analisar alertas
    const alerts: BudgetAlert[] = [];
    budgetsWithUsage.forEach((budget) => {
      const alert = analyzeBudget(budget);
      if (alert) {
        alerts.push(alert);
      }
    });

    // Ordenar alertas por severidade
    alerts.sort((a, b) => {
      const severityOrder = { exceeded: 0, critical: 1, warning: 2, info: 3 };
      return severityOrder[a.level] - severityOrder[b.level];
    });

    // Calcular totais
    const totalBudgeted = budgetsWithUsage.reduce(
      (sum, b) => sum + Number(b.amount),
      0
    );
    const totalSpent = budgetsWithUsage.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overallPercentage =
      totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      totalBudgets: budgetsWithUsage.length,
      activeBudgets: budgetsWithUsage.length,
      budgetsWithAlerts: alerts.length,
      budgetsExceeded: budgetsWithUsage.filter((b) => b.isOverBudget).length,
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overallPercentage,
      alerts,
    };
  } catch (error) {
    console.error("Error in getBudgetSummary:", error);
    throw error;
  }
}

/**
 * Verifica se uma nova despesa causará alerta em algum orçamento
 */
export async function checkExpenseImpact(
  workspaceId: string,
  categoryId: string,
  expenseAmount: number,
  expenseDate: Date
): Promise<{
  affectedBudgets: BudgetWithUsage[];
  newAlerts: BudgetAlert[];
  willExceed: boolean;
}> {
  // Buscar orçamentos que incluem essa despesa
  const budgets = await prisma.budget.findMany({
    where: {
      workspaceId,
      categoryId,
      startDate: { lte: expenseDate },
      endDate: { gte: expenseDate },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (budgets.length === 0) {
    return {
      affectedBudgets: [],
      newAlerts: [],
      willExceed: false,
    };
  }

  // Calcular uso atual de cada orçamento
  const budgetsWithUsage = await Promise.all(
    budgets.map((budget) => calculateBudgetUsage(budget))
  );

  // Simular impacto da nova despesa
  const affectedBudgets = budgetsWithUsage.map((budget) => ({
    ...budget,
    spent: budget.spent + expenseAmount,
    remaining: budget.remaining - expenseAmount,
    percentUsed: ((budget.spent + expenseAmount) / Number(budget.amount)) * 100,
    isOverBudget: budget.spent + expenseAmount > Number(budget.amount),
  }));

  // Analisar novos alertas
  const newAlerts: BudgetAlert[] = [];
  affectedBudgets.forEach((budget) => {
    const alert = analyzeBudget(budget);
    if (alert) {
      newAlerts.push(alert);
    }
  });

  const willExceed = affectedBudgets.some((b) => b.isOverBudget);

  return {
    affectedBudgets,
    newAlerts,
    willExceed,
  };
}

/**
 * Obtém alertas críticos (exceeded e critical) de um workspace
 */
export async function getCriticalAlerts(
  workspaceId: string
): Promise<BudgetAlert[]> {
  const summary = await getBudgetSummary(workspaceId);
  return summary.alerts.filter(
    (alert) => alert.level === "exceeded" || alert.level === "critical"
  );
}

/**
 * Verifica se há orçamentos estourados em uma categoria específica
 */
export async function hasExceededBudgets(
  workspaceId: string,
  categoryId: string
): Promise<boolean> {
  const now = new Date();
  const budgets = await prisma.budget.findMany({
    where: {
      workspaceId,
      categoryId,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (budgets.length === 0) return false;

  const budgetsWithUsage = await Promise.all(
    budgets.map((budget) => calculateBudgetUsage(budget))
  );

  return budgetsWithUsage.some((b) => b.isOverBudget);
}
