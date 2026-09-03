"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  DeleteExpenseDialog,
  EditExpenseDialog,
  type ExpenseRow,
  type CategoryOption
} from "@/components/cashflow/expense-dialogs";
import { PaymentBrandMark } from "@/components/cashflow/payment-brand-mark";
import { Card } from "@/components/ui/card";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { paymentSummary } from "@/lib/domain/payment";

type Actions = {
  createExpense: (formData: FormData) => Promise<void>;
  updateExpense: (formData: FormData) => Promise<void>;
  deleteExpense: (formData: FormData) => Promise<void>;
};

function collapsedStorageKey(workspaceId: string) {
  return `cashflowpro:cashflow:section-collapsed:expenses:${workspaceId}`;
}

function readCollapsed(workspaceId: string): boolean {
  try {
    return window.localStorage.getItem(collapsedStorageKey(workspaceId)) === "1";
  } catch {
    return false;
  }
}

function typeLabel(type: string) {
  return type === "FIXED" ? "Fixa" : type === "VARIABLE" ? "Variável" : type;
}

function ExpenseLine({
  expense,
  isAdmin,
  actions,
  categories,
  currency
}: {
  expense: ExpenseRow;
  isAdmin: boolean;
  actions: Actions;
  categories: CategoryOption[];
  currency: CurrencyCode;
}) {
  const pay = paymentSummary(expense.paymentMethod, expense.paymentBrand);

  return (
    <div>
      <div className="hidden md:grid grid-cols-12 gap-4 items-center px-6 py-3 text-sm transition-colors hover:bg-white/5">
        <div className="col-span-2 text-xs text-muted-foreground font-medium">{expense.date}</div>
        <div className="col-span-3 text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            {expense.paymentBrand || expense.paymentMethod === "CASH" ? (
              <PaymentBrandMark brand={expense.paymentBrand ?? "cash"} size={20} />
            ) : null}
            <span className="truncate">
              {expense.description}
              {expense.fromRecurring ? (
                <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Recorrente
                </span>
              ) : null}
            </span>
          </div>
          {pay ? <div className="mt-0.5 text-[10px] text-muted-foreground">{pay}</div> : null}
        </div>
        <div className="col-span-2 text-muted-foreground">{expense.categoryName ?? "-"}</div>
        <div className="col-span-1 text-muted-foreground">{typeLabel(expense.type)}</div>
        <div className="col-span-2 font-semibold text-foreground">
          {formatMoney(expense.amount, currency)}
        </div>
        <div className="col-span-2 flex items-center justify-end gap-2">
          <EditExpenseDialog expense={expense} isAdmin={isAdmin} actions={actions} categories={categories} />
          <DeleteExpenseDialog expenseId={expense.id} isAdmin={isAdmin} actions={actions} />
        </div>
      </div>
      <div className="md:hidden p-4 space-y-2 border-b border-white/5 last:border-b-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">{expense.date}</div>
            <div className="flex items-center gap-2">
              {expense.paymentBrand || expense.paymentMethod === "CASH" ? (
                <PaymentBrandMark brand={expense.paymentBrand ?? "cash"} size={20} />
              ) : null}
              <div className="text-sm font-medium text-foreground min-w-0 truncate">
                {expense.description}
                {expense.fromRecurring ? (
                  <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Recorrente
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {expense.categoryName ? (
                <span className="text-[10px] text-muted-foreground">{expense.categoryName}</span>
              ) : null}
              {pay ? <span className="text-[10px] text-muted-foreground">{pay}</span> : null}
              <span className="text-[10px] text-muted-foreground">{typeLabel(expense.type)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="font-semibold text-sm text-foreground">
              {formatMoney(expense.amount, currency)}
            </div>
            <div className="flex items-center gap-1">
              <EditExpenseDialog expense={expense} isAdmin={isAdmin} actions={actions} categories={categories} />
              <DeleteExpenseDialog expenseId={expense.id} isAdmin={isAdmin} actions={actions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExpenseListClient({
  workspaceId,
  expenses,
  isAdmin,
  actions,
  categories,
  currency,
  headerActions,
  emptyMessage = "Nenhuma despesa registrada neste período."
}: {
  workspaceId: string;
  expenses: ExpenseRow[];
  isAdmin: boolean;
  actions: Actions;
  categories: CategoryOption[];
  currency: CurrencyCode;
  headerActions: ReactNode;
  emptyMessage?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    setCollapsed(readCollapsed(workspaceId));
  }, [workspaceId]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(collapsedStorageKey(workspaceId), next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex min-w-0 items-center gap-2 rounded-md text-left hover:opacity-90"
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span>
            <span className="block text-sm font-semibold text-foreground">Despesas do período</span>
            {collapsed ? (
              <span className="block text-xs text-muted-foreground">
                {expenses.length} {expenses.length === 1 ? "despesa" : "despesas"}
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex flex-wrap items-center justify-center gap-2 flex-1 min-w-[12rem]">
          {headerActions}
        </div>
      </div>

      {collapsed ? null : (
        <Card className="overflow-hidden" data-tour="expenses-section">
          {expenses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:grid border-b border-white/5 bg-card-secondary/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground grid-cols-12 gap-4">
                <div className="col-span-2">Data</div>
                <div className="col-span-3">Descrição</div>
                <div className="col-span-2">Categoria</div>
                <div className="col-span-1">Tipo</div>
                <div className="col-span-2">Valor</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>
              <div className="divide-y divide-white/5">
                {expenses.map((expense) => (
                  <ExpenseLine
                    key={expense.id}
                    expense={expense}
                    isAdmin={isAdmin}
                    actions={actions}
                    categories={categories}
                    currency={currency}
                  />
                ))}
              </div>
              {!isAdmin ? (
                <div className="border-t border-white/5 px-6 py-3 bg-card-secondary/30">
                  <p className="text-xs text-muted-foreground">
                    Você é MEMBER: pode visualizar, mas não pode criar/editar/excluir despesas.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
