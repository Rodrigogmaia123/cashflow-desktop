/**
 * Sistema de Limites por Plano
 * 
 * Define limites quantitativos para cada plano.
 * FREE tem limites restritivos para forçar upgrade.
 */

import type { Plan } from "@/lib/billing/plans";

export interface PlanLimits {
  /** Número máximo de workspaces (null = ilimitado) */
  maxWorkspaces: number | null;
  /** Número máximo de lançamentos por mês (expenses + manualIncomes + dailyPerformances) */
  maxTransactionsPerMonth: number | null;
  /** Número máximo de categorias customizadas */
  maxCustomCategories: number | null;
  /** Número máximo de usuários por workspace */
  maxUsersPerWorkspace: number | null;
  /** Número máximo de relatórios personalizados */
  maxCustomReports: number | null;
}

/**
 * Limites por plano
 */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxWorkspaces: 1,
    maxTransactionsPerMonth: 100,
    maxCustomCategories: 0, // Sem categorias customizadas
    maxUsersPerWorkspace: 1,
    maxCustomReports: 1,
  },
  PRO: {
    maxWorkspaces: null, // Ilimitado
    maxTransactionsPerMonth: null, // Ilimitado
    maxCustomCategories: null, // Ilimitado
    maxUsersPerWorkspace: 1,
    maxCustomReports: 10,
  },
  BUSINESS: {
    maxWorkspaces: null, // Ilimitado
    maxTransactionsPerMonth: null, // Ilimitado
    maxCustomCategories: null, // Ilimitado
    maxUsersPerWorkspace: null, // Ilimitado
    maxCustomReports: null, // Ilimitado
  },
};

/**
 * Obtém os limites de um plano
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Verifica se um valor está dentro do limite
 */
export function isWithinLimit(
  plan: Plan,
  limitType: keyof PlanLimits,
  currentValue: number
): boolean {
  const limits = getPlanLimits(plan);
  const limit = limits[limitType];

  // null = ilimitado
  if (limit === null) {
    return true;
  }

  return currentValue < limit;
}

/**
 * Obtém o limite máximo para um tipo específico
 */
export function getLimitValue(
  plan: Plan,
  limitType: keyof PlanLimits
): number | null {
  const limits = getPlanLimits(plan);
  return limits[limitType];
}

/**
 * Retorna mensagem amigável sobre o limite
 */
export function getLimitMessage(
  plan: Plan,
  limitType: keyof PlanLimits
): string {
  const limit = getLimitValue(plan, limitType);

  if (limit === null) {
    return "Ilimitado";
  }

  switch (limitType) {
    case "maxWorkspaces":
      return `Até ${limit} workspace${limit > 1 ? "s" : ""}`;
    case "maxTransactionsPerMonth":
      return `Até ${limit} lançamentos/mês`;
    case "maxCustomCategories":
      return limit === 0 ? "Sem categorias personalizadas" : `Até ${limit} categorias`;
    case "maxUsersPerWorkspace":
      return limit === 1 ? "Apenas você" : `Até ${limit} usuários`;
    case "maxCustomReports":
      return limit === null ? "Ilimitado" : `Até ${limit} relatório${limit > 1 ? "s" : ""}`;
    default:
      return limit.toString();
  }
}

/**
 * Retorna o plano mínimo necessário para remover um limite
 */
export function getRequiredPlanForLimit(limitType: keyof PlanLimits): Plan {
  switch (limitType) {
    case "maxWorkspaces":
    case "maxTransactionsPerMonth":
    case "maxCustomCategories":
      return "PRO";
    case "maxUsersPerWorkspace":
    case "maxCustomReports":
      return "BUSINESS";
    default:
      return "FREE";
  }
}

