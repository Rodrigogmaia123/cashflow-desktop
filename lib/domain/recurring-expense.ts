import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { listBudgetsWithUsage } from "@/lib/domain/budget";
import { autoGenerateNotifications } from "@/lib/domain/budget-alerts";
import { utcDateFromKey, utcKey } from "@/lib/utils/date-utc";

const materializedDays = new Set<string>();

export function dueDateForMonth(year: number, monthIndex: number, dayOfMonth: number): Date {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const day = Math.min(Math.max(dayOfMonth, 1), lastDay);
  return new Date(Date.UTC(year, monthIndex, day));
}

function monthsBetween(start: Date, end: Date): Array<{ year: number; monthIndex: number }> {
  const months: Array<{ year: number; monthIndex: number }> = [];
  let year = start.getUTCFullYear();
  let monthIndex = start.getUTCMonth();
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();

  while (year < endYear || (year === endYear && monthIndex <= endMonth)) {
    months.push({ year, monthIndex });
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }

  return months;
}

/**
 * Gera Expense reais a partir das regras ativas.
 * Não altera despesas manuais. Se o lançamento do mês já existe para a regra, ignora.
 */
export async function materializeRecurringExpenses(
  workspaceId: string,
  userId?: string | null,
  options?: { force?: boolean }
): Promise<{ created: number }> {
  const todayKey = utcKey(new Date());
  const stamp = `${workspaceId}:${todayKey}`;
  if (!options?.force && materializedDays.has(stamp)) {
    return { created: 0 };
  }

  const today = utcDateFromKey(todayKey);
  const rules = await prisma.recurringExpense.findMany({
    where: {
      workspaceId,
      isActive: true
    }
  });

  if (rules.length === 0) {
    materializedDays.add(stamp);
    return { created: 0 };
  }

  let created = 0;

  for (const rule of rules) {
    const start = new Date(rule.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const endCap = rule.endDate
      ? new Date(Math.min(new Date(rule.endDate).getTime(), today.getTime()))
      : today;

    if (endCap < start) continue;

    for (const { year, monthIndex } of monthsBetween(start, endCap)) {
      const due = dueDateForMonth(year, monthIndex, rule.dayOfMonth);
      if (due < start || due > endCap || due > today) continue;

      const existing = await prisma.expense.findFirst({
        where: {
          workspaceId,
          recurringExpenseId: rule.id,
          date: due
        },
        select: { id: true }
      });
      if (existing) continue;

      await prisma.expense.create({
        data: {
          workspaceId,
          date: due,
          description: rule.description,
          amount: new Decimal(rule.amount),
          type: rule.type,
          categoryId: rule.categoryId,
          recurringExpenseId: rule.id
        }
      });
      created += 1;

      if (rule.categoryId && userId) {
        try {
          const budgets = await listBudgetsWithUsage({
            workspaceId,
            categoryId: rule.categoryId,
            activeOnly: true
          });
          for (const budget of budgets) {
            await autoGenerateNotifications(workspaceId, userId, budget);
          }
        } catch (notifError) {
          console.error("Erro ao gerar notificações de orçamento (recorrente):", notifError);
        }
      }
    }
  }

  materializedDays.add(stamp);
  return { created };
}
