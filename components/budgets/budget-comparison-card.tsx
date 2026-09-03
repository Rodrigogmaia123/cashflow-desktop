"use client";

import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BudgetWithUsage } from "@/types/budget";

interface BudgetComparisonCardProps {
  currency?: CurrencyCode;
  budget: BudgetWithUsage;
  compact?: boolean;
}

export function BudgetComparisonCard({
  budget,
  compact = false,
  currency = "BRL"
}: BudgetComparisonCardProps) {
  function formatCurrency(value: number): string {
    return formatMoney(value, currency);
  }

  function getColorClasses() {
    if (budget.isOverBudget) {
      return {
        progress: "bg-red-500",
        text: "text-red-600",
        bg: "bg-red-50 dark:bg-red-950",
        border: "border-red-200 dark:border-red-800",
      };
    }
    if (budget.percentUsed >= 90) {
      return {
        progress: "bg-orange-500",
        text: "text-orange-600",
        bg: "bg-orange-50 dark:bg-orange-950",
        border: "border-orange-200 dark:border-orange-800",
      };
    }
    if (budget.percentUsed >= 75) {
      return {
        progress: "bg-yellow-500",
        text: "text-yellow-600",
        bg: "bg-yellow-50 dark:bg-yellow-950",
        border: "border-yellow-200 dark:border-yellow-800",
      };
    }
    return {
      progress: "bg-green-500",
      text: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      border: "border-green-200 dark:border-green-800",
    };
  }

  const colors = getColorClasses();

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{budget.name}</h4>
            <p className="text-xs text-muted-foreground">{budget.category.name}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${colors.text}`}>
              {budget.percentUsed.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(budget.spent)}
            </p>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${colors.progress}`}
            style={{
              width: `${Math.min(budget.percentUsed, 100)}%`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className={`border ${colors.border}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-base">{budget.name}</h3>
              <Badge variant="secondary" className="mt-1 text-xs">
                {budget.category.name}
              </Badge>
            </div>
            {budget.isOverBudget && (
              <Badge variant="destructive" className="text-xs">
                Estourado
              </Badge>
            )}
          </div>

          {/* Comparação Visual */}
          <div className="space-y-2">
            {/* Barra Principal */}
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
              {/* Parte usada */}
              <div
                className={`absolute inset-y-0 left-0 ${colors.progress} transition-all flex items-center justify-center`}
                style={{
                  width: `${Math.min(budget.percentUsed, 100)}%`,
                }}
              >
                {budget.percentUsed >= 20 && (
                  <span className="text-xs font-semibold text-white">
                    {budget.percentUsed.toFixed(1)}%
                  </span>
                )}
              </div>
              
              {/* Parte restante */}
              <div className="absolute inset-y-0 right-0 flex items-center justify-center px-2">
                {budget.percentUsed < 20 && (
                  <span className={`text-xs font-semibold ${colors.text}`}>
                    {budget.percentUsed.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Labels */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatMoney(0, currency)}</span>
              <span>{formatCurrency(Number(budget.amount))}</span>
            </div>
          </div>

          {/* Detalhes Numéricos */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Orçado</p>
              <p className="text-sm font-semibold">
                {formatCurrency(Number(budget.amount))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gasto</p>
              <p className="text-sm font-semibold">
                {formatCurrency(budget.spent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {budget.isOverBudget ? "Excedido" : "Restante"}
              </p>
              <p className={`text-sm font-semibold ${budget.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(budget.remaining))}
              </p>
            </div>
          </div>

          {/* Status Message */}
          {!budget.isOverBudget && budget.percentUsed >= 80 && (
            <div className={`${colors.bg} border ${colors.border} rounded-lg p-2`}>
              <p className={`text-xs ${colors.text}`}>
                ⚠️ Você já usou {budget.percentUsed.toFixed(0)}% do orçamento.
                Faltam apenas {formatCurrency(budget.remaining)}.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Lista de cards de comparação
 */
interface BudgetComparisonListProps {
  budgets: BudgetWithUsage[];
  compact?: boolean;
  maxItems?: number;
}

export function BudgetComparisonList({ 
  budgets, 
  compact = false,
  maxItems 
}: BudgetComparisonListProps) {
  const displayBudgets = maxItems ? budgets.slice(0, maxItems) : budgets;

  if (compact) {
    return (
      <div className="space-y-4">
        {displayBudgets.map((budget) => (
          <BudgetComparisonCard key={budget.id} budget={budget} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
      {displayBudgets.map((budget) => (
        <BudgetComparisonCard key={budget.id} budget={budget} />
      ))}
    </div>
  );
}
