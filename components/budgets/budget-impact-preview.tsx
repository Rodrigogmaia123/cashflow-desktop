"use client";

import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { useState, useEffect } from "react";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BudgetAlert } from "@/lib/domain/budget-analytics";

interface BudgetImpactPreviewProps {
  currency?: CurrencyCode;
  categoryId: string | null;
  amount: number;
  date: Date | string | null;
}

export function BudgetImpactPreview({
  categoryId,
  amount,
  date,
  currency = "BRL",
}: BudgetImpactPreviewProps) {
  const [impact, setImpact] = useState<{
    hasImpact: boolean;
    willExceed: boolean;
    alertsCount: number;
    alerts: BudgetAlert[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkImpact() {
      // Só verifica se todos os dados necessários estiverem preenchidos
      if (!categoryId || !amount || amount <= 0 || !date) {
        setImpact(null);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/budgets/check-impact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId,
            amount,
            date: new Date(date).toISOString(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setImpact({
            hasImpact: data.hasImpact,
            willExceed: data.willExceed,
            alertsCount: data.alertsCount,
            alerts: data.impact.newAlerts || [],
          });
        }
      } catch (error) {
        console.error("Erro ao verificar impacto:", error);
      } finally {
        setLoading(false);
      }
    }

    // Debounce para não fazer muitas requests
    const timeoutId = setTimeout(checkImpact, 500);

    return () => clearTimeout(timeoutId);
  }, [categoryId, amount, date]);

  if (!impact || !impact.hasImpact) {
    return null;
  }

  function formatCurrency(value: number): string {
    return formatMoney(value, currency);
  }

  return (
    <div className="space-y-2">
      {impact.willExceed && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-red-900 dark:text-red-100">
                ⚠️ Esta despesa estourará o orçamento!
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Você está prestes a ultrapassar o limite de orçamento definido para
                esta categoria.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!impact.willExceed && impact.alertsCount > 0 && (
        <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
                Atenção ao orçamento
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Esta despesa impactará {impact.alertsCount} orçamento(s). Confira
                abaixo:
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Detalhes dos impactos */}
      {impact.alerts.length > 0 && (
        <div className="space-y-2">
          {impact.alerts.map((alert, index) => (
            <div
              key={index}
              className="text-sm p-3 rounded-lg border bg-background/50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{alert.categoryName}</span>
                <span
                  className={`text-xs font-semibold ${
                    alert.level === "exceeded"
                      ? "text-red-600"
                      : alert.level === "critical"
                      ? "text-orange-600"
                      : "text-yellow-600"
                  }`}
                >
                  {alert.percentUsed.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Gasto: <strong>{formatCurrency(alert.spent)}</strong>
                </span>
                <span>
                  de <strong>{formatCurrency(alert.amount)}</strong>
                </span>
              </div>
              {alert.remaining < 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Excederá em {formatCurrency(Math.abs(alert.remaining))}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!impact.willExceed && impact.alertsCount === 0 && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-900 dark:text-green-100">
              Esta despesa está dentro do orçamento previsto.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
