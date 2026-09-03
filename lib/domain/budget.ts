import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetWithCategory,
  BudgetWithUsage,
  BudgetFilters,
} from "@/types/budget";

/**
 * Serviços de gerenciamento de Orçamentos (Budgets)
 */

/**
 * Cria um novo orçamento
 */
export async function createBudget(
  input: CreateBudgetInput,
  userId: string
): Promise<BudgetWithCategory> {
  // Validar que a categoria pertence ao workspace
  const category = await prisma.category.findFirst({
    where: {
      id: input.categoryId,
      workspaceId: input.workspaceId,
    },
  });

  if (!category) {
    throw new Error("Categoria não encontrada ou não pertence ao workspace");
  }

  // Validar que endDate é posterior a startDate
  if (new Date(input.endDate) <= new Date(input.startDate)) {
    throw new Error("Data final deve ser posterior à data inicial");
  }

  const budget = await prisma.budget.create({
    data: {
      workspaceId: input.workspaceId,
      categoryId: input.categoryId,
      name: input.name,
      amount: new Decimal(input.amount),
      periodType: input.periodType,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      createdBy: userId,
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

  return budget;
}

/**
 * Busca um orçamento por ID
 */
export async function getBudgetById(
  budgetId: string,
  workspaceId: string
): Promise<BudgetWithCategory | null> {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workspaceId,
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

  return budget;
}

/**
 * Lista todos os orçamentos de um workspace com filtros opcionais
 */
export async function listBudgets(
  filters: BudgetFilters
): Promise<BudgetWithCategory[]> {
  const where: any = {
    workspaceId: filters.workspaceId,
  };

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.periodType) {
    where.periodType = filters.periodType;
  }

  // Filtrar por orçamentos que se sobrepõem ao período especificado
  // Um orçamento está ativo no período se:
  // - Começa antes ou durante o período E
  // - Termina depois ou durante o período
  if (filters.startDate && filters.endDate) {
    where.AND = [
      { startDate: { lte: filters.endDate } },   // Orçamento começa antes do fim do período
      { endDate: { gte: filters.startDate } },   // Orçamento termina depois do início do período
    ];
  } else {
    // Se apenas uma data for fornecida, usar a lógica antiga
    if (filters.startDate) {
      where.startDate = { gte: filters.startDate };
    }

    if (filters.endDate) {
      where.endDate = { lte: filters.endDate };
    }
  }

  // Support both isActive and activeOnly
  if (filters.isActive || filters.activeOnly) {
    const now = new Date();
    where.startDate = { lte: now };
    where.endDate = { gte: now };
  }

  const budgets = await prisma.budget.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: [{ startDate: "desc" }, { name: "asc" }],
  });

  return budgets;
}

/**
 * Atualiza um orçamento
 */
export async function updateBudget(
  budgetId: string,
  workspaceId: string,
  input: UpdateBudgetInput
): Promise<BudgetWithCategory> {
  // Verificar se o orçamento existe e pertence ao workspace
  const existingBudget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workspaceId,
    },
  });

  if (!existingBudget) {
    throw new Error("Orçamento não encontrado");
  }

  // Se categoryId foi fornecido, validar que pertence ao workspace
  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: input.categoryId,
        workspaceId,
      },
    });

    if (!category) {
      throw new Error("Categoria não encontrada ou não pertence ao workspace");
    }
  }

  // Validar datas se ambas foram fornecidas
  if (input.startDate && input.endDate) {
    if (new Date(input.endDate) <= new Date(input.startDate)) {
      throw new Error("Data final deve ser posterior à data inicial");
    }
  }

  const updateData: any = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.amount !== undefined)
    updateData.amount = new Decimal(input.amount);
  if (input.periodType !== undefined)
    updateData.periodType = input.periodType;
  if (input.startDate !== undefined)
    updateData.startDate = new Date(input.startDate);
  if (input.endDate !== undefined)
    updateData.endDate = new Date(input.endDate);
  if (input.categoryId !== undefined)
    updateData.categoryId = input.categoryId;

  const budget = await prisma.budget.update({
    where: {
      id: budgetId,
    },
    data: updateData,
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

  return budget;
}

/**
 * Deleta um orçamento
 */
export async function deleteBudget(
  budgetId: string,
  workspaceId: string
): Promise<void> {
  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workspaceId,
    },
  });

  if (!budget) {
    throw new Error("Orçamento não encontrado");
  }

  await prisma.budget.delete({
    where: {
      id: budgetId,
    },
  });
}

/**
 * Calcula o uso de um orçamento (quanto foi gasto)
 */
export async function calculateBudgetUsage(
  budget: BudgetWithCategory
): Promise<BudgetWithUsage> {
  try {
    // Buscar despesas da categoria no período do orçamento
    const expenses = await prisma.expense.findMany({
      where: {
        workspaceId: budget.workspaceId,
        categoryId: budget.categoryId,
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
    });

    // Somar o total de despesas
    const spent = expenses.reduce(
      (sum, expense) => sum.add(expense.amount),
      new Decimal(0)
    );

    const budgetAmount = new Decimal(budget.amount);
    const remaining = budgetAmount.sub(spent);
    const percentUsed = budgetAmount.equals(0)
      ? new Decimal(0)
      : spent.div(budgetAmount).mul(100);
    const isOverBudget = spent.gt(budgetAmount);

    return {
      ...budget,
      spent: spent.toNumber(),
      remaining: remaining.toNumber(),
      percentUsed: percentUsed.toNumber(),
      isOverBudget,
    };
  } catch (error) {
    console.error("Error in calculateBudgetUsage:", error);
    console.error("Budget ID:", budget.id);
    console.error("Budget data:", JSON.stringify(budget, null, 2));
    throw error;
  }
}

/**
 * Lista orçamentos com informações de uso
 */
export async function listBudgetsWithUsage(
  filters: BudgetFilters
): Promise<BudgetWithUsage[]> {
  const budgets = await listBudgets(filters);

  // Calcular uso para cada orçamento
  const budgetsWithUsage = await Promise.all(
    budgets.map((budget) => calculateBudgetUsage(budget))
  );

  return budgetsWithUsage;
}

/**
 * Busca orçamento por ID com informações de uso
 */
export async function getBudgetWithUsage(
  budgetId: string,
  workspaceId: string
): Promise<BudgetWithUsage | null> {
  const budget = await getBudgetById(budgetId, workspaceId);

  if (!budget) {
    return null;
  }

  return calculateBudgetUsage(budget);
}
