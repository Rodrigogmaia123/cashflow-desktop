"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgetStatus } from "./use-budget-status";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export function BudgetStatusDashboard({ currency }: { currency: CurrencyCode }) {
  const { summary, loading, error, lastUpdate, refresh, hasCriticalAlerts } =
    useBudgetStatus({
      autoRefresh: false, // Desabilitar auto-refresh por padrão para evitar erros repetidos
      refreshInterval: 30000,
    });

  if (loading && !summary) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar status</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={refresh} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  // Estado vazio: sem orçamentos ativos
  if (summary.activeBudgets === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum orçamento ativo</h3>
          <p className="text-sm text-muted-foreground text-center">
            Crie seu primeiro orçamento para começar a acompanhar seus gastos em tempo real.
          </p>
        </CardContent>
      </Card>
    );
  }

  function formatCurrency(value: number): string {
    return formatMoney(value, currency);
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }

  const getOverallColor = () => {
    if (summary.overallPercentage >= 100) return "text-red-600";
    if (summary.overallPercentage >= 90) return "text-orange-600";
    if (summary.overallPercentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-4">
      {/* Header com última atualização */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Status dos Orçamentos</h3>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Última atualização: {formatDate(lastUpdate)}
            </p>
          )}
        </div>
        <Button
          onClick={refresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Alerta geral se houver problemas */}
      {hasCriticalAlerts && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Você tem {summary.budgetsExceeded} orçamento(s) estourado(s) e{" "}
                {summary.budgetsWithAlerts} com alertas. Revise seus gastos!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Orçamentos Ativos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Orçamentos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeBudgets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {summary.totalBudgets} totais
            </p>
          </CardContent>
        </Card>

        {/* Total Orçado */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Orçado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalBudgeted)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              para o período atual
            </p>
          </CardContent>
        </Card>

        {/* Total Gasto */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalRemaining >= 0
                ? `${formatCurrency(summary.totalRemaining)} restantes`
                : `${formatCurrency(Math.abs(summary.totalRemaining))} excedido`}
            </p>
          </CardContent>
        </Card>

        {/* Percentual Geral */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Uso Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getOverallColor()}`}>
              {summary.overallPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.budgetsExceeded > 0
                ? `${summary.budgetsExceeded} estourado(s)`
                : "Dentro do controle"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progresso geral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresso Geral dos Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uso total</span>
              <span className={`font-semibold ${getOverallColor()}`}>
                {summary.overallPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  summary.overallPercentage >= 100
                    ? "bg-red-500"
                    : summary.overallPercentage >= 90
                    ? "bg-orange-500"
                    : summary.overallPercentage >= 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(summary.overallPercentage, 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(summary.totalBudgeted)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alertas */}
      {summary.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Alertas ({summary.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.alerts.map((alert) => (
              <div
                key={alert.budgetId}
                className={`p-3 rounded-lg border ${
                  alert.level === "exceeded"
                    ? "bg-red-50 dark:bg-red-950 border-red-200"
                    : alert.level === "critical"
                    ? "bg-orange-50 dark:bg-orange-950 border-orange-200"
                    : "bg-yellow-50 dark:bg-yellow-950 border-yellow-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 ${
                      alert.level === "exceeded"
                        ? "text-red-600"
                        : alert.level === "critical"
                        ? "text-orange-600"
                        : "text-yellow-600"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.categoryName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
