"use client";

import { useState } from "react";
import { Calendar, RefreshCw, FileText } from "lucide-react";
import { usePeriodReport, useRenewBudget } from "./use-period-report";
import { PeriodReportView } from "./period-report-view";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { SimpleAlert } from "@/components/ui/simple-alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PeriodReportPage() {
  // Calcular mês atual por padrão (mais útil para orçamentos recém-criados)
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(currentMonthStart);
  const [endDate, setEndDate] = useState(currentMonthEnd);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { report, loading, error, fetchReport } = usePeriodReport({
    startDate,
    endDate,
    autoLoad: true,
  });

  const { renewAllMonthly, loading: renewLoading } = useRenewBudget();

  const handleGenerateReport = () => {
    fetchReport(startDate, endDate);
  };

  const handleRenewAll = async () => {
    if (!confirm("Renovar todos os orçamentos mensais do último período?")) {
      return;
    }

    try {
      const results = await renewAllMonthly();
      setSuccessMessage(`${results.length} orçamentos renovados com sucesso!`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Recarregar relatório do próximo período
      const nextMonthStart = new Date(endDate);
      nextMonthStart.setDate(nextMonthStart.getDate() + 1);
      const nextMonthEnd = new Date(nextMonthStart);
      nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1);
      nextMonthEnd.setDate(0);
      
      setStartDate(nextMonthStart);
      setEndDate(nextMonthEnd);
    } catch (err) {
      console.error("Erro ao renovar orçamentos:", err);
    }
  };

  const handleQuickSelect = (period: "lastMonth" | "currentMonth" | "last3Months") => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "currentMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "last3Months":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {showSuccess && (
        <SimpleAlert
          type="success"
          message={successMessage}
          onDismiss={() => setShowSuccess(false)}
        />
      )}

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">Relatórios de Fechamento</h2>
        <p className="text-xs text-muted-foreground">Análise detalhada de performance dos orçamentos</p>
      </div>

      {/* Filtros e Ações */}
      <DashboardSection>
        <Card className="border-white/5 bg-card">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Date Range */}
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={startDate.toISOString().split("T")[0]}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={endDate.toISOString().split("T")[0]}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("lastMonth")}
                >
                  Mês Passado
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("currentMonth")}
                >
                  Mês Atual
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect("last3Months")}
                >
                  Últimos 3 Meses
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? "Gerando..." : "Gerar Relatório"}
                </Button>
                {report && (
                  <Button
                    onClick={handleRenewAll}
                    disabled={renewLoading}
                    size="sm"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {renewLoading ? "Renovando..." : "Renovar Orçamentos"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Error */}
      {error && (
        <SimpleAlert
          type="error"
          message={error}
          details="Tente ajustar o período ou entre em contato com o suporte"
        />
      )}

      {/* Report */}
      {report && !loading && (
        <DashboardSection>
          <PeriodReportView report={report} />
        </DashboardSection>
      )}

      {/* Empty State */}
      {!report && !loading && !error && (
        <DashboardSection>
          <Card className="border-white/5 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Gerar Relatório de Período
              </h3>
              <div className="text-sm text-muted-foreground text-center max-w-md space-y-3">
                <p>
                  Selecione o período desejado e clique em "Gerar Relatório" para visualizar a análise completa.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                  <p className="font-medium text-foreground mb-2">💡 Dica:</p>
                  <p>
                    Se você acabou de criar orçamentos, selecione o período do <strong>mês atual</strong> para vê-los no relatório!
                  </p>
                </div>
                <p className="pt-2">
                  O relatório mostra: orçamentos vs gastos reais, categorias que estouraram, economia total e mais.
                </p>
              </div>
            </CardContent>
          </Card>
        </DashboardSection>
      )}
    </div>
  );
}
