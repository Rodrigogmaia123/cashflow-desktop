"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBudgetStatus } from "./use-budget-status";
import { 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

/**
 * Widget compacto de orçamentos para exibir no dashboard principal
 * Mostra resumo rápido e alertas críticos
 */
export function BudgetWidget({ currency = "BRL" }: { currency?: CurrencyCode }) {
  const { summary, loading, hasCriticalAlerts, error } = useBudgetStatus({
    autoRefresh: false, // Desabilitar auto-refresh por padrão para evitar erros
    refreshInterval: 60000,
  });

  if (loading && !summary) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Orçamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-xs text-red-600 mb-3">
              {error}
            </p>
            <Link href="/app/budgets">
              <Button size="sm" variant="outline">
                Ver Orçamentos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.activeBudgets === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Orçamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Nenhum orçamento ativo no momento
            </p>
            <Link href="/app/budgets">
              <Button size="sm" variant="outline">
                Criar Orçamento
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  function formatCurrency(value: number): string {
    return formatMoney(value, currency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  const getOverallColor = () => {
    if (summary.overallPercentage >= 100) return "text-red-600";
    if (summary.overallPercentage >= 90) return "text-orange-600";
    if (summary.overallPercentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = () => {
    if (summary.overallPercentage >= 100) return "bg-red-500";
    if (summary.overallPercentage >= 90) return "bg-orange-500";
    if (summary.overallPercentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card className={hasCriticalAlerts ? "border-red-300 dark:border-red-800" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Orçamentos
            {summary.activeBudgets > 0 && (
              <Badge variant="secondary" className="text-xs">
                {summary.activeBudgets}
              </Badge>
            )}
          </CardTitle>
          <Link href="/app/budgets">
            <Button variant="ghost" size="sm" className="h-7 px-2">
              Ver todos
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta se houver problemas */}
        {hasCriticalAlerts && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-xs font-medium text-red-900 dark:text-red-100">
              {summary.budgetsExceeded > 0 && (
                <span>{summary.budgetsExceeded} orçamento(s) estourado(s)</span>
              )}
              {summary.budgetsExceeded > 0 && summary.budgetsWithAlerts > summary.budgetsExceeded && " • "}
              {summary.budgetsWithAlerts > summary.budgetsExceeded && (
                <span>{summary.budgetsWithAlerts - summary.budgetsExceeded} com alertas</span>
              )}
            </p>
          </div>
        )}

        {/* Resumo Financeiro */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Orçado</span>
            <span className="font-semibold">{formatCurrency(summary.totalBudgeted)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Gasto</span>
            <span className="font-semibold">{formatCurrency(summary.totalSpent)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Restante</span>
            <span className={`font-semibold ${summary.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(summary.totalRemaining))}
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Uso Total</span>
            <span className={`font-semibold ${getOverallColor()}`}>
              {summary.overallPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor()}`}
              style={{
                width: `${Math.min(summary.overallPercentage, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Status Geral */}
        <div className="flex items-center justify-between pt-2 border-t">
          {summary.budgetsExceeded === 0 && summary.budgetsWithAlerts === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Tudo sob controle</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">
                {summary.activeBudgets - summary.budgetsWithAlerts} orçamento(s) OK
              </span>
            </div>
          )}
          <Link href="/app/budgets">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Gerenciar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
