import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type {
  PeriodReportFilters,
  PeriodReport,
  CategoryBudgetReport,
  BudgetRenewalInput,
  BudgetRenewalResult,
} from "@/types/report";
import { generateRecommendations } from "@/types/report";
import { listBudgetsWithUsage } from "./budget";

// ==================== ANÁLISE DE PERÍODO ====================

export async function generatePeriodReport(
  filters: PeriodReportFilters
): Promise<PeriodReport> {
  const { workspaceId, startDate, endDate, categoryIds } = filters;

  console.log("[generatePeriodReport] Iniciando com filtros:", {
    workspaceId,
    startDate,
    endDate,
    categoryIds,
  });

  // 1. Buscar todos os orçamentos do período
  const budgets = await listBudgetsWithUsage({
    workspaceId,
    startDate,
    endDate,
  });

  console.log("[generatePeriodReport] Orçamentos encontrados:", budgets.length);
  if (budgets.length > 0) {
    console.log("[generatePeriodReport] Primeiro orçamento:", {
      id: budgets[0].id,
      name: budgets[0].name,
      categoryName: budgets[0].category.name,
      amount: budgets[0].amount,
      startDate: budgets[0].startDate,
      endDate: budgets[0].endDate,
    });
  }

  // 2. Buscar todas as categorias que tiveram despesas no período
  const expensesGrouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: {
      workspaceId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      categoryId: {
        not: null,
      },
    },
    _sum: {
      amount: true,
    },
  });

  // 3. Buscar detalhes das categorias
  const allCategoryIds = [
    ...new Set([
      ...budgets.map((b) => b.categoryId),
      ...expensesGrouped.map((e) => e.categoryId).filter((id): id is string => id !== null),
    ]),
  ];

  const categories = await prisma.category.findMany({
    where: {
      id: { in: allCategoryIds },
      workspaceId,
    },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // 4. Criar relatório por categoria
  const categoryReports: CategoryBudgetReport[] = [];
  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b]));
  const expenseMap = new Map(
    expensesGrouped.map((e) => [e.categoryId, Number(e._sum.amount || 0)])
  );

  // Processar categorias com orçamento
  for (const budget of budgets) {
    const category = categoryMap.get(budget.categoryId);
    if (!category) continue;

    const actualSpent = expenseMap.get(budget.categoryId) || 0;
    const budgetedAmount = Number(budget.amount);
    const difference = budgetedAmount - actualSpent;
    const percentUsed = budgetedAmount > 0 ? (actualSpent / budgetedAmount) * 100 : 0;
    const hasExceeded = actualSpent > budgetedAmount;
    const hasSaved = actualSpent < budgetedAmount;

    let status: CategoryBudgetReport["status"] = "OK";
    if (hasExceeded) {
      status = "EXCEEDED";
    } else if (percentUsed >= 90) {
      status = "WARNING";
    }

    categoryReports.push({
      categoryId: category.id,
      categoryName: category.name,
      budgetId: budget.id,
      budgetName: budget.name,
      budgetedAmount,
      actualSpent,
      difference,
      percentUsed,
      hasExceeded,
      hasSaved,
      status,
    });
  }

  // Processar categorias SEM orçamento mas com despesas
  for (const [categoryId, spent] of expenseMap.entries()) {
    if (budgetMap.has(categoryId!)) continue; // Já processada

    const category = categoryMap.get(categoryId!);
    if (!category) continue;

    categoryReports.push({
      categoryId: category.id,
      categoryName: category.name,
      budgetId: null,
      budgetName: null,
      budgetedAmount: 0,
      actualSpent: spent,
      difference: -spent,
      percentUsed: 0,
      hasExceeded: false,
      hasSaved: false,
      status: "NO_BUDGET",
    });
  }

  // 5. Calcular totais
  const withBudget = categoryReports.filter((c) => c.budgetId !== null);
  const exceeded = withBudget.filter((c) => c.hasExceeded);
  const saved = withBudget.filter((c) => c.hasSaved);
  const withoutBudget = categoryReports.filter((c) => c.budgetId === null);

  const totalBudgeted = withBudget.reduce((sum, c) => sum + c.budgetedAmount, 0);
  const totalSpent = categoryReports.reduce((sum, c) => sum + c.actualSpent, 0);
  const totalSaved = saved.reduce((sum, c) => sum + c.difference, 0);
  const totalExceeded = exceeded.reduce((sum, c) => sum + Math.abs(c.difference), 0);
  const netDifference = totalBudgeted - totalSpent;

  const categoriesOK = withBudget.filter((c) => c.status === "OK").length;

  // 6. Montar relatório final
  const report: PeriodReport = {
    startDate,
    endDate,
    totalBudgeted,
    totalSpent,
    totalSaved,
    totalExceeded,
    netDifference,
    categoriesWithBudget: withBudget.length,
    categoriesOK,
    categoriesExceeded: exceeded.length,
    categoriesWithoutBudget: withoutBudget.length,
    categories: categoryReports.sort((a, b) => {
      // Ordenar: Estourados primeiro, depois críticos, depois OK
      const priority = { EXCEEDED: 0, WARNING: 1, OK: 2, NO_BUDGET: 3 };
      return priority[a.status] - priority[b.status];
    }),
    recommendations: [],
  };

  // 7. Gerar recomendações
  report.recommendations = generateRecommendations(report);

  return report;
}

// ==================== RENOVAÇÃO AUTOMÁTICA ====================

export async function renewBudget(
  input: BudgetRenewalInput,
  userId: string
): Promise<BudgetRenewalResult> {
  const { budgetId, newStartDate, newEndDate, adjustAmount, adjustPercentage } = input;

  // 1. Buscar orçamento original
  const originalBudget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      category: true,
    },
  });

  if (!originalBudget) {
    throw new Error("Orçamento não encontrado");
  }

  // 2. Calcular novo período
  let start = newStartDate;
  let end = newEndDate;

  if (!start || !end) {
    // Auto-calcular próximo período baseado no tipo
    if (originalBudget.periodType === "MONTHLY") {
      const lastEnd = new Date(originalBudget.endDate);
      start = new Date(lastEnd);
      start.setDate(start.getDate() + 1); // Dia seguinte ao fim
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() - 1); // Último dia do mês
    } else {
      // CUSTOM: repetir mesmo período
      const duration =
        new Date(originalBudget.endDate).getTime() -
        new Date(originalBudget.startDate).getTime();
      start = new Date(originalBudget.endDate);
      start.setDate(start.getDate() + 1);
      end = new Date(start.getTime() + duration);
    }
  }

  // 3. Calcular novo valor
  let newAmount = Number(originalBudget.amount);

  if (adjustAmount !== undefined) {
    newAmount += adjustAmount;
  }

  if (adjustPercentage !== undefined) {
    newAmount = newAmount * (1 + adjustPercentage / 100);
  }

  if (newAmount <= 0) {
    throw new Error("Valor do orçamento deve ser positivo");
  }

  // 4. Criar novo orçamento
  const newBudget = await prisma.budget.create({
    data: {
      workspaceId: originalBudget.workspaceId,
      categoryId: originalBudget.categoryId,
      name: `${originalBudget.category.name} ${start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
      amount: new Decimal(newAmount),
      periodType: originalBudget.periodType,
      startDate: start,
      endDate: end,
      createdBy: userId,
    },
  });

  // 5. Retornar resultado
  const originalAmount = Number(originalBudget.amount);
  const amountDifference = newAmount - originalAmount;
  const percentageChange =
    originalAmount > 0 ? (amountDifference / originalAmount) * 100 : 0;

  return {
    original: {
      id: originalBudget.id,
      name: originalBudget.name,
      amount: originalAmount,
      period: `${new Date(originalBudget.startDate).toLocaleDateString()} - ${new Date(originalBudget.endDate).toLocaleDateString()}`,
    },
    renewed: {
      id: newBudget.id,
      name: newBudget.name,
      amount: newAmount,
      period: `${new Date(newBudget.startDate).toLocaleDateString()} - ${new Date(newBudget.endDate).toLocaleDateString()}`,
    },
    changes: {
      amountChanged: amountDifference !== 0,
      amountDifference,
      percentageChange,
    },
  };
}

export async function renewAllMonthlyBudgets(
  workspaceId: string,
  userId: string
): Promise<BudgetRenewalResult[]> {
  // Buscar todos os orçamentos mensais do mês passado
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const budgets = await prisma.budget.findMany({
    where: {
      workspaceId,
      periodType: "MONTHLY",
      endDate: {
        gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
        lt: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1),
      },
    },
  });

  const results: BudgetRenewalResult[] = [];

  for (const budget of budgets) {
    try {
      const result = await renewBudget(
        {
          budgetId: budget.id,
        },
        userId
      );
      results.push(result);
    } catch (error) {
      console.error(`Erro ao renovar orçamento ${budget.id}:`, error);
    }
  }

  return results;
}
