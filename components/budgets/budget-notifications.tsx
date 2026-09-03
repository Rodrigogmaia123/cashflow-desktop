"use client";

import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BudgetAlert } from "@/lib/domain/budget-analytics";

interface BudgetNotificationsProps {
  currency?: CurrencyCode;
  workspaceId?: string;
  autoCheck?: boolean;
  checkInterval?: number; // em milissegundos
}

export function BudgetNotifications({
  workspaceId,
  autoCheck = false,
  checkInterval = 60000, // 1 minuto por padrão
  currency = "BRL",
}: BudgetNotificationsProps) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  async function fetchAlerts() {
    if (!workspaceId) return;

    try {
      setLoading(true);
      const response = await fetch("/api/budgets/status?onlyCritical=true");

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoCheck && workspaceId) {
      // Buscar imediatamente
      fetchAlerts();

      // Configurar polling
      const interval = setInterval(fetchAlerts, checkInterval);

      return () => clearInterval(interval);
    }
  }, [autoCheck, workspaceId, checkInterval]);

  function dismissAlert(alertId: string) {
    setDismissed((prev) => new Set([...prev, alertId]));
  }

  function getAlertIcon(level: string) {
    switch (level) {
      case "exceeded":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "critical":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "warning":
        return <Info className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  }

  function getAlertColors(level: string) {
    switch (level) {
      case "exceeded":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
      case "critical":
        return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
    }
  }

  function getAlertTextColors(level: string) {
    switch (level) {
      case "exceeded":
        return "text-red-900 dark:text-red-100";
      case "critical":
        return "text-orange-900 dark:text-orange-100";
      case "warning":
        return "text-yellow-900 dark:text-yellow-100";
      default:
        return "text-blue-900 dark:text-blue-100";
    }
  }

  const visibleAlerts = alerts.filter(
    (alert) => !dismissed.has(alert.budgetId)
  );

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => (
        <Card
          key={alert.budgetId}
          className={`p-4 border ${getAlertColors(alert.level)}`}
        >
          <div className="flex items-start gap-3">
            {getAlertIcon(alert.level)}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4
                    className={`font-semibold text-sm ${getAlertTextColors(
                      alert.level
                    )}`}
                  >
                    {alert.categoryName}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${getAlertTextColors(
                      alert.level
                    )}`}
                  >
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span>
                      Gasto:{" "}
                      <strong>
                        {formatMoney(alert.spent, currency)}
                      </strong>
                    </span>
                    <span>
                      Orçado:{" "}
                      <strong>
                        {formatMoney(alert.amount, currency)}
                      </strong>
                    </span>
                    <span>
                      Uso: <strong>{alert.percentUsed.toFixed(1)}%</strong>
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => dismissAlert(alert.budgetId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
