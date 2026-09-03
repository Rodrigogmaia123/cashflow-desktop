/**
 * Sistema de Gatilhos para Expansão PRO → BUSINESS
 * 
 * Detecta momentos ideais para sugerir upgrade para BUSINESS
 * baseado em padrões de uso e necessidades reais do usuário.
 */

import { prisma } from "@/lib/db";
import type { Plan } from "@/lib/billing/plans";

export type ExpansionTrigger =
  | "multiple_workspaces"
  | "high_transaction_volume"
  | "frequent_exports"
  | "api_requests_detected"
  | "multi_user_workspace_needed"
  | "advanced_reporting_needed"
  | "team_collaboration_signals"
  | "enterprise_features_usage";

export interface ExpansionTriggerData {
  trigger: ExpansionTrigger;
  strength: "weak" | "medium" | "strong"; // Força do sinal
  context: {
    workspacesCount?: number;
    monthlyTransactions?: number;
    exportCount?: number;
    apiRequests?: number;
    teamMembersCount?: number;
  };
  recommendation: "show_hint" | "show_modal" | "show_banner";
}

/**
 * Detecta se usuário PRO tem gatilhos para BUSINESS
 */
export async function detectBusinessTriggers(
  userId: string,
  plan: Plan
): Promise<ExpansionTriggerData[]> {
  // Só detecta se for PRO (não faz sentido sugerir BUSINESS para FREE)
  if (plan !== "PRO") {
    return [];
  }

  const triggers: ExpansionTriggerData[] = [];

  // Conta workspaces do usuário
  const workspacesCount = await prisma.userWorkspace.count({
    where: { userId },
  });

  // Se tem 3+ workspaces, pode precisar de multi-user
  if (workspacesCount >= 3) {
    triggers.push({
      trigger: "multiple_workspaces",
      strength: workspacesCount >= 5 ? "strong" : "medium",
      context: { workspacesCount },
      recommendation: workspacesCount >= 5 ? "show_modal" : "show_hint",
    });
  }

  // Conta transações do mês atual
  const workspaceIds = (
    await prisma.userWorkspace.findMany({
      where: { userId },
      select: { workspaceId: true },
    })
  ).map((w) => w.workspaceId);

  if (workspaceIds.length > 0) {
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const endOfMonth = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
    );

    const [expensesCount, incomesCount, dailyPerfCount, exportLogs] =
      await Promise.all([
        prisma.expense.count({
          where: {
            workspaceId: { in: workspaceIds },
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.manualIncome.count({
          where: {
            workspaceId: { in: workspaceIds },
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.dailyPerformance.count({
          where: {
            offer: {
              workspaceId: { in: workspaceIds },
            },
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        // Exportações podem ser rastreadas via analytics (implementar depois)
        Promise.resolve(0),
      ]);

    const monthlyTransactions =
      expensesCount + incomesCount + dailyPerfCount;

    // 500+ transações/mês sugere uso intenso
    if (monthlyTransactions >= 500) {
      triggers.push({
        trigger: "high_transaction_volume",
        strength: monthlyTransactions >= 1000 ? "strong" : "medium",
        context: { monthlyTransactions },
        recommendation:
          monthlyTransactions >= 1000 ? "show_modal" : "show_hint",
      });
    }
  }

  // Verifica se tem múltiplos usuários em algum workspace (futuro)
  // Por enquanto, apenas detecta workspaces com potencial

  // Se tem muitos workspaces e muitas transações, é forte candidato
  if (
    workspacesCount >= 3 &&
    triggers.some((t) => t.trigger === "high_transaction_volume")
  ) {
    triggers.push({
      trigger: "enterprise_features_usage",
      strength: "strong",
      context: { workspacesCount },
      recommendation: "show_modal",
    });
  }

  return triggers;
}

/**
 * Retorna o gatilho mais forte detectado
 */
export function getStrongestTrigger(
  triggers: ExpansionTriggerData[]
): ExpansionTriggerData | null {
  if (triggers.length === 0) return null;

  const sorted = triggers.sort((a, b) => {
    const strengthOrder = { strong: 3, medium: 2, weak: 1 };
    return strengthOrder[b.strength] - strengthOrder[a.strength];
  });

  return sorted[0];
}

/**
 * Verifica se deve mostrar sugestão de BUSINESS
 */
export function shouldSuggestBusiness(
  triggers: ExpansionTriggerData[]
): boolean {
  const strongest = getStrongestTrigger(triggers);
  return (
    strongest !== null &&
    (strongest.strength === "strong" ||
      (strongest.strength === "medium" &&
        strongest.recommendation !== "show_hint"))
  );
}

