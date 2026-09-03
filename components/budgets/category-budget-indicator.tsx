"use client";

import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { 
  TooltipProvider, 
  TooltipRoot, 
  TooltipTrigger, 
  TooltipContent 
} from "@/components/ui/tooltip";

interface CategoryBudgetIndicatorProps {
  currency?: CurrencyCode;
  categoryId: string;
  categoryName: string;
}

interface BudgetInfo {
  hasBudget: boolean;
  isOverBudget: boolean;
  percentUsed: number;
  spent: number;
  amount: number;
  remaining: number;
}

export function CategoryBudgetIndicator({ 
  categoryId, 
  categoryName,
  currency = "BRL"
}: CategoryBudgetIndicatorProps) {
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBudgetInfo() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/budgets?categoryId=${categoryId}&isActive=true`
        );

        if (response.ok) {
          const data = await response.json();
          const budgets = data.budgets || [];

          if (budgets.length > 0) {
            // Pega o primeiro orçamento ativo da categoria
            const budget = budgets[0];
            setBudgetInfo({
              hasBudget: true,
              isOverBudget: budget.isOverBudget,
              percentUsed: budget.percentUsed,
              spent: budget.spent,
              amount: Number(budget.amount),
              remaining: budget.remaining,
            });
          } else {
            setBudgetInfo({ 
              hasBudget: false,
              isOverBudget: false,
              percentUsed: 0,
              spent: 0,
              amount: 0,
              remaining: 0
            });
          }
        }
      } catch (error) {
        console.error("Erro ao buscar orçamento:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBudgetInfo();
  }, [categoryId]);

  if (loading || !budgetInfo || !budgetInfo.hasBudget) {
    return null;
  }

  function formatCurrency(value: number): string {
    return formatMoney(value, currency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  function getBadgeVariant() {
    if (!budgetInfo) return "secondary";
    if (budgetInfo.isOverBudget) return "destructive";
    if (budgetInfo.percentUsed >= 90) return "destructive";
    if (budgetInfo.percentUsed >= 75) return "secondary";
    return "secondary";
  }

  function getBadgeColor() {
    if (!budgetInfo) return "bg-gray-100 text-gray-700 border-gray-300";
    if (budgetInfo.isOverBudget) return "bg-red-100 text-red-700 border-red-300";
    if (budgetInfo.percentUsed >= 90) return "bg-orange-100 text-orange-700 border-orange-300";
    if (budgetInfo.percentUsed >= 75) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-green-100 text-green-700 border-green-300";
  }

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`text-xs cursor-help ${getBadgeColor()}`}
          >
            {budgetInfo.isOverBudget ? (
              <AlertTriangle className="h-3 w-3 mr-1" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            {budgetInfo.percentUsed.toFixed(0)}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-3">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{categoryName}</p>
            <div className="text-xs space-y-0.5">
              <p>
                <span className="text-muted-foreground">Orçado:</span>{" "}
                <span className="font-medium">{formatCurrency(budgetInfo.amount)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Gasto:</span>{" "}
                <span className="font-medium">{formatCurrency(budgetInfo.spent)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  {budgetInfo.isOverBudget ? "Excedido:" : "Restante:"}
                </span>{" "}
                <span className={`font-medium ${budgetInfo.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(budgetInfo.remaining))}
                </span>
              </p>
              <div className="pt-1 mt-1 border-t">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      budgetInfo.isOverBudget
                        ? "bg-red-500"
                        : budgetInfo.percentUsed >= 90
                        ? "bg-orange-500"
                        : budgetInfo.percentUsed >= 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(budgetInfo.percentUsed, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

/**
 * Versão simplificada sem tooltip, apenas badge
 */
export function CategoryBudgetBadge({ 
  categoryId 
}: { 
  categoryId: string 
}) {
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null);

  useEffect(() => {
    async function fetchBudgetInfo() {
      try {
        const response = await fetch(
          `/api/budgets?categoryId=${categoryId}&isActive=true`
        );

        if (response.ok) {
          const data = await response.json();
          const budgets = data.budgets || [];

          if (budgets.length > 0) {
            const budget = budgets[0];
            setBudgetInfo({
              hasBudget: true,
              isOverBudget: budget.isOverBudget,
              percentUsed: budget.percentUsed,
              spent: budget.spent,
              amount: Number(budget.amount),
              remaining: budget.remaining,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao buscar orçamento:", error);
      }
    }

    fetchBudgetInfo();
  }, [categoryId]);

  if (!budgetInfo || !budgetInfo.hasBudget) {
    return null;
  }

  function getIcon() {
    if (!budgetInfo) return "📊";
    if (budgetInfo.isOverBudget || budgetInfo.percentUsed >= 90) {
      return "⚠️";
    }
    return "📊";
  }

  return (
    <span className="text-xs ml-2">
      {getIcon()}
    </span>
  );
}
