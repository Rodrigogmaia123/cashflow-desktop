/**
 * Middleware de Autorização por Plano
 * 
 * Funções utilitárias para verificar permissões e limites em runtime.
 * Use estas funções em actions e server components.
 */

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { hasFeature, getRequiredPlanForFeature, FEATURE_MESSAGES, type Feature } from "./features";
import { isFeatureActive } from "./feature-status";
import { 
  getPlanLimits, 
  isWithinLimit, 
  getLimitValue,
  getRequiredPlanForLimit,
  type PlanLimits 
} from "./limits";
import type { Plan } from "@/lib/billing/plans";
import { redirect } from "next/navigation";

/**
 * Resultado de verificação de autorização
 */
export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPlan?: Plan;
  currentLimit?: number;
  currentValue?: number;
}

/**
 * Verifica se o usuário tem acesso a uma feature
 */
export async function checkFeatureAccess(
  feature: Feature
): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const userPlan = user.plan;
  const hasAccess = hasFeature(userPlan, feature);
  
  // Verifica se a feature está realmente ativa (não apenas disponível no plano)
  const isActive = isFeatureActive(feature);

  if (hasAccess && isActive) {
    return { allowed: true };
  }
  
  // Se tem acesso no plano mas a feature está em desenvolvimento
  if (hasAccess && !isActive) {
    return {
      allowed: false,
      reason: "Esta funcionalidade está em desenvolvimento e estará disponível em breve.",
      requiredPlan: getRequiredPlanForFeature(feature),
    };
  }

  const requiredPlan = getRequiredPlanForFeature(feature);
  const message = FEATURE_MESSAGES[feature];

  return {
    allowed: false,
    reason: `Esta funcionalidade está disponível apenas no plano ${requiredPlan}.`,
    requiredPlan,
  };
}

/**
 * Verifica se o usuário pode criar mais workspaces
 */
export async function checkWorkspaceLimit(): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const userPlan = user.plan;
  const limits = getPlanLimits(userPlan);

  if (limits.maxWorkspaces === null) {
    return { allowed: true };
  }

  // Conta workspaces do usuário
  const workspaceCount = await prisma.userWorkspace.count({
    where: { userId: user.id },
  });

  if (workspaceCount < limits.maxWorkspaces) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Você atingiu o limite de ${limits.maxWorkspaces} workspace(s) no plano FREE.`,
    requiredPlan: getRequiredPlanForLimit("maxWorkspaces"),
    currentLimit: limits.maxWorkspaces,
    currentValue: workspaceCount,
  };
}

/**
 * Verifica se o usuário pode criar mais transações este mês
 * Considera: expenses, manualIncomes e dailyPerformances
 */
export async function checkTransactionLimit(): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const userPlan = user.plan;
  const limits = getPlanLimits(userPlan);

  if (limits.maxTransactionsPerMonth === null) {
    return { allowed: true };
  }

  const workspaceId = user.activeWorkspaceId;
  if (!workspaceId) {
    return { allowed: false, reason: "Workspace ativo não encontrado." };
  }

  // Calcula início e fim do mês atual (UTC)
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  // Conta todas as transações do mês atual no workspace ativo
  const [expensesCount, incomesCount, dailyPerfCount] = await Promise.all([
    prisma.expense.count({
      where: {
        workspaceId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),
    prisma.manualIncome.count({
      where: {
        workspaceId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),
    prisma.dailyPerformance.count({
      where: {
        offer: {
          workspaceId,
        },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),
  ]);

  const totalTransactions = expensesCount + incomesCount + dailyPerfCount;

  if (totalTransactions < limits.maxTransactionsPerMonth) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Você atingiu o limite de ${limits.maxTransactionsPerMonth} lançamentos/mês no plano FREE.`,
    requiredPlan: getRequiredPlanForLimit("maxTransactionsPerMonth"),
    currentLimit: limits.maxTransactionsPerMonth,
    currentValue: totalTransactions,
  };
}

/**
 * Verifica se o usuário pode criar mais categorias customizadas
 */
export async function checkCategoryLimit(): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const userPlan = user.plan;
  const limits = getPlanLimits(userPlan);

  if (limits.maxCustomCategories === null) {
    return { allowed: true };
  }

  if (limits.maxCustomCategories === 0) {
    return {
      allowed: false,
      reason: "Categorias personalizadas não estão disponíveis no plano FREE.",
      requiredPlan: getRequiredPlanForLimit("maxCustomCategories"),
      currentLimit: 0,
    };
  }

  const workspaceId = user.activeWorkspaceId;
  if (!workspaceId) {
    return { allowed: false, reason: "Workspace ativo não encontrado." };
  }

  const categoryCount = await prisma.category.count({
    where: { workspaceId },
  });

  if (categoryCount < limits.maxCustomCategories) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Você atingiu o limite de ${limits.maxCustomCategories} categorias no plano FREE.`,
    requiredPlan: getRequiredPlanForLimit("maxCustomCategories"),
    currentLimit: limits.maxCustomCategories,
    currentValue: categoryCount,
  };
}

/**
 * Verifica se o usuário tem acesso a relatórios avançados
 * Relatórios avançados incluem: comparação entre períodos, filtros múltiplos,
 * breakdowns detalhados, tendências e insights automáticos
 */
export async function requireAdvancedReports(): Promise<AuthorizationResult> {
  return checkFeatureAccess("advanced_reports");
}

/**
 * Verifica se o usuário pode criar mais relatórios personalizados
 * FREE: máximo 1 relatório
 * PRO: máximo 10 relatórios
 * BUSINESS: ilimitado
 */
export async function checkCustomReportsLimit(): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const limits = getPlanLimits(user.plan);
  const workspaceId = user.activeWorkspaceId;

  if (!workspaceId) {
    return { allowed: false, reason: "Workspace ativo não encontrado." };
  }

  // Se ilimitado, permite
  if (limits.maxCustomReports === null) {
    return { allowed: true };
  }

  const reportCount = await prisma.savedReport.count({
    where: { workspaceId },
  });

  if (reportCount < limits.maxCustomReports) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Você atingiu o limite de ${limits.maxCustomReports} relatório${limits.maxCustomReports > 1 ? "s" : ""} no plano ${user.plan}. Faça upgrade para criar mais relatórios.`,
    requiredPlan: getRequiredPlanForLimit("maxCustomReports"),
    currentLimit: limits.maxCustomReports,
    currentValue: reportCount,
  };
}

/**
 * Verifica se o usuário pode acessar análise histórica (consultas > 30 dias)
 * FREE: máximo 30 dias
 * PRO+: ilimitado
 */
export async function requireHistoricalAnalysis(params: {
  startDate: Date;
  endDate: Date;
}): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const userPlan = user.plan;
  
  // PRO+ tem acesso ilimitado
  if (hasFeature(userPlan, "historical_analysis")) {
    return { allowed: true };
  }

  // FREE: calcula diferença em dias (inclusive)
  // Normaliza para UTC para cálculo preciso
  const startUTC = new Date(Date.UTC(
    params.startDate.getUTCFullYear(),
    params.startDate.getUTCMonth(),
    params.startDate.getUTCDate()
  ));
  const endUTC = new Date(Date.UTC(
    params.endDate.getUTCFullYear(),
    params.endDate.getUTCMonth(),
    params.endDate.getUTCDate()
  ));
  
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((endUTC.getTime() - startUTC.getTime()) / msPerDay) + 1;

  if (daysDiff <= 30) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Análise histórica acima de 30 dias está disponível apenas no plano PRO. Você tentou acessar ${daysDiff} dias.`,
    requiredPlan: "PRO",
  };
}

/**
 * Obtém informações sobre uso atual do plano do usuário
 */
export async function getUserUsage(): Promise<{
  workspaces: number;
  transactionsThisMonth: number;
  categories: number;
  maxWorkspaces: number | null;
  maxTransactionsPerMonth: number | null;
  maxCustomCategories: number | null;
}> {
  const user = await getCurrentUser();
  
  if (!user) {
    return {
      workspaces: 0,
      transactionsThisMonth: 0,
      categories: 0,
      maxWorkspaces: null,
      maxTransactionsPerMonth: null,
      maxCustomCategories: null,
    };
  }

  const limits = getPlanLimits(user.plan);
  const workspaceId = user.activeWorkspaceId;

  const workspaceCount = await prisma.userWorkspace.count({
    where: { userId: user.id },
  });

  let transactionsThisMonth = 0;
  let categoryCount = 0;

  if (workspaceId) {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const [expensesCount, incomesCount, dailyPerfCount, catCount] = await Promise.all([
      prisma.expense.count({
        where: {
          workspaceId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.manualIncome.count({
        where: {
          workspaceId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.dailyPerformance.count({
        where: {
          offer: {
            workspaceId,
          },
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.category.count({
        where: { workspaceId },
      }),
    ]);

    transactionsThisMonth = expensesCount + incomesCount + dailyPerfCount;
    categoryCount = catCount;
  }

  return {
    workspaces: workspaceCount,
    transactionsThisMonth,
    categories: categoryCount,
    maxWorkspaces: limits.maxWorkspaces,
    maxTransactionsPerMonth: limits.maxTransactionsPerMonth,
    maxCustomCategories: limits.maxCustomCategories,
  };
}

/**
 * Verifica se o usuário pode adicionar mais usuários ao workspace
 */
export async function checkUserLimit(workspaceId: string): Promise<AuthorizationResult> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const userPlan = user.plan;
  const limits = getPlanLimits(userPlan);

  if (limits.maxUsersPerWorkspace === null) {
    return { allowed: true };
  }

  // Conta usuários do workspace
  const userCount = await prisma.userWorkspace.count({
    where: { workspaceId },
  });

  if (userCount < limits.maxUsersPerWorkspace) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Você atingiu o limite de ${limits.maxUsersPerWorkspace} usuário(s) por workspace no plano ${userPlan}.`,
    requiredPlan: getRequiredPlanForLimit("maxUsersPerWorkspace"),
    currentLimit: limits.maxUsersPerWorkspace,
    currentValue: userCount,
  };
}

