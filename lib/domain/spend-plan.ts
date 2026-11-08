export type PlanItemTotalsInput = {
  plannedAmount: number;
  paidAmount: number;
  skipped: boolean;
  repeatable: boolean;
};

function toNumber(value: { toNumber(): number } | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

export function paidAmountOf(item: {
  actualAmount?: { toNumber(): number } | number | null;
  expense?: { amount: { toNumber(): number } | number } | null;
  entries?: Array<{ amount: { toNumber(): number } | number }>;
}) {
  if (item.entries && item.entries.length > 0) {
    return item.entries.reduce((sum, entry) => sum + toNumber(entry.amount), 0);
  }
  if (item.expense) return toNumber(item.expense.amount);
  return toNumber(item.actualAmount);
}

export function remainingOf(item: PlanItemTotalsInput) {
  if (item.skipped) return 0;
  if (item.repeatable) return Math.max(0, item.plannedAmount - item.paidAmount);
  return item.paidAmount > 0 ? 0 : item.plannedAmount;
}

export function toPlanItemTotals(item: {
  plannedAmount: { toNumber(): number } | number;
  actualAmount?: { toNumber(): number } | number | null;
  skipped: boolean;
  repeatable?: boolean | null;
  expense?: { amount: { toNumber(): number } | number } | null;
  entries?: Array<{ amount: { toNumber(): number } | number }>;
}): PlanItemTotalsInput {
  return {
    plannedAmount: toNumber(item.plannedAmount),
    paidAmount: paidAmountOf(item),
    skipped: item.skipped,
    repeatable: Boolean(item.repeatable)
  };
}

export function summarizePlanItems(items: PlanItemTotalsInput[]) {
  const active = items.filter((item) => !item.skipped);
  const planned = active.reduce((sum, item) => sum + item.plannedAmount, 0);
  const paid = active.reduce((sum, item) => sum + item.paidAmount, 0);
  // O que falta no bloco é o plano menos o que já saiu. Estourar um item
  // reduz o que ainda cabe no bloco, em vez de deixar a sobra intacta.
  const remaining = Math.max(0, planned - paid);
  const paidCount = active.filter((item) => item.paidAmount > 0).length;

  return {
    planned,
    paid,
    difference: paid - planned,
    remaining,
    paidCount,
    openCount: active.length - paidCount,
    skippedCount: items.length - active.length
  };
}
