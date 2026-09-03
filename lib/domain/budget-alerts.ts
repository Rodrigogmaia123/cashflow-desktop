import { BudgetWithUsage } from "@/types/budget";
import type { NotificationType } from "@/lib/prisma-enums";
import {
  createNotification,
  checkForDuplicateNotification,
} from "./notification";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { prisma } from "@/lib/db";

// ==================== THRESHOLD DETECTION ====================

export interface ThresholdAlert {
  budgetId: string;
  type: NotificationType;
  title: string;
  message: string;
  percentUsed: number;
  spent: number;
  amount: number;
  categoryName: string;
}

export function detectThresholdViolations(
  budget: BudgetWithUsage,
  currency: CurrencyCode = "BRL"
): ThresholdAlert[] {
  const alerts: ThresholdAlert[] = [];
  const { percentUsed, category } = budget;
  
  // Convert to numbers for calculations
  const spent = Number(budget.spent);
  const amount = Number(budget.amount);

  // 75% threshold
  if (percentUsed >= 75 && percentUsed < 90) {
    alerts.push({
      budgetId: budget.id,
      type: "BUDGET_WARNING_75",
      title: `⚠️ ${category.name}: 75% do orçamento atingido`,
      message: `Você já gastou ${formatMoney(spent, currency)} de ${formatMoney(amount, currency)} (${percentUsed.toFixed(1)}%). Restam ${formatMoney(amount - spent, currency)}.`,
      percentUsed,
      spent,
      amount,
      categoryName: category.name,
    });
  }

  // 90% threshold
  if (percentUsed >= 90 && percentUsed < 100) {
    alerts.push({
      budgetId: budget.id,
      type: "BUDGET_WARNING_90",
      title: `🔔 ${category.name}: 90% do orçamento atingido!`,
      message: `ATENÇÃO: Você já gastou ${formatMoney(spent, currency)} de ${formatMoney(amount, currency)} (${percentUsed.toFixed(1)}%). Restam apenas ${formatMoney(amount - spent, currency)}.`,
      percentUsed,
      spent,
      amount,
      categoryName: category.name,
    });
  }

  // 100% threshold (exactly at or just over)
  if (percentUsed >= 100 && percentUsed < 110) {
    alerts.push({
      budgetId: budget.id,
      type: "BUDGET_EXCEEDED_100",
      title: `🚨 ${category.name}: Orçamento EXCEDIDO!`,
      message: `ORÇAMENTO ESTOURADO: Você gastou ${formatMoney(spent, currency)} de ${formatMoney(amount, currency)} (${percentUsed.toFixed(1)}%). Você está ${formatMoney(spent - amount, currency)} acima do limite.`,
      percentUsed,
      spent,
      amount,
      categoryName: category.name,
    });
  }

  // Critical threshold (>110%)
  if (percentUsed >= 110) {
    alerts.push({
      budgetId: budget.id,
      type: "BUDGET_CRITICAL_EXCEEDED",
      title: `❌ ${category.name}: ORÇAMENTO CRÍTICO!`,
      message: `ORÇAMENTO CRÍTICO: Você gastou ${formatMoney(spent, currency)} de ${formatMoney(amount, currency)} (${percentUsed.toFixed(1)}%). Você está ${formatMoney(spent - amount, currency)} acima do limite. Ação imediata necessária!`,
      percentUsed,
      spent,
      amount,
      categoryName: category.name,
    });
  }

  return alerts;
}

// ==================== AUTO-NOTIFICATION ====================

export async function autoGenerateNotifications(
  workspaceId: string,
  userId: string,
  budget: BudgetWithUsage
): Promise<number> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { baseCurrency: true }
  });
  const currency = (workspace?.baseCurrency ?? "BRL") as CurrencyCode;
  const alerts = detectThresholdViolations(budget, currency);
  let createdCount = 0;

  for (const alert of alerts) {
    // Check if we already sent this type of notification recently (avoid spam)
    const isDuplicate = await checkForDuplicateNotification(
      workspaceId,
      alert.budgetId,
      alert.type,
      24 // 24 hours window
    );

    if (!isDuplicate) {
      await createNotification({
        workspaceId,
        budgetId: alert.budgetId,
        userId,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        metadata: {
          percentUsed: alert.percentUsed,
          spent: alert.spent,
          amount: alert.amount,
          categoryName: alert.categoryName,
        },
      });
      createdCount++;
    }
  }

  return createdCount;
}

// ==================== BULK CHECKING ====================

export async function checkAllBudgetsForAlerts(
  workspaceId: string,
  userId: string,
  budgets: BudgetWithUsage[]
): Promise<number> {
  let totalCreated = 0;

  for (const budget of budgets) {
    const created = await autoGenerateNotifications(workspaceId, userId, budget);
    totalCreated += created;
  }

  return totalCreated;
}

// ==================== UTILITIES ====================

export function shouldTriggerAlert(percentUsed: number): boolean {
  return percentUsed >= 75;
}

export function getHighestPriorityAlert(
  alerts: ThresholdAlert[]
): ThresholdAlert | null {
  if (alerts.length === 0) return null;

  const priorityOrder: NotificationType[] = [
    "BUDGET_CRITICAL_EXCEEDED",
    "BUDGET_EXCEEDED_100",
    "BUDGET_WARNING_90",
    "BUDGET_WARNING_75",
  ];

  for (const priority of priorityOrder) {
    const alert = alerts.find((a) => a.type === priority);
    if (alert) return alert;
  }

  return alerts[0];
}

export function formatAlertForUI(alert: ThresholdAlert): string {
  return `${alert.title}\n${alert.message}`;
}
