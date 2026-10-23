"use client";

import { useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { usePeriodReport, useRenewBudget } from "./use-period-report";
import { PeriodReportView } from "./period-report-view";
import { SimpleAlert } from "@/components/ui/simple-alert";
import { Button } from "@/components/ui/button";
import { formatLocalDate, parseLocalDate } from "@/lib/utils/date-local";
import { prefKey, useLocalPref } from "@/lib/ui/local-prefs";
import { field, pageLead, pageTitle, surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

function currentMonthRange() {
  const today = new Date();
  return {
    start: formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    end: formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  };
}

export function PeriodReportPage() {
  const [range, setRange] = useLocalPref(prefKey("reports", "range"), currentMonthRange());
  const startDate = parseLocalDate(range.start);
  const endDate = parseLocalDate(range.end);
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

      setRange({
        start: formatLocalDate(nextMonthStart),
        end: formatLocalDate(nextMonthEnd)
      });
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

    setRange({
      start: formatLocalDate(start),
      end: formatLocalDate(end)
    });
  };

  return (
    <div className="space-y-4">
      {showSuccess && (
        <SimpleAlert type="success" message={successMessage} onDismiss={() => setShowSuccess(false)} />
      )}

      <div className="space-y-1">
        <h1 className={pageTitle}>Relatórios</h1>
        <p className={pageLead}>Fechamento e análise detalhada de performance dos orçamentos.</p>
      </div>

      <section className={cn(surface, "p-4 md:p-5")}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs text-[#9ca9a1]">Data início</span>
            <input
              type="date"
              value={range.start}
              onChange={(e) => setRange((prev) => ({ ...prev, start: e.target.value }))}
              className={field}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-[#9ca9a1]">Data fim</span>
            <input
              type="date"
              value={range.end}
              onChange={(e) => setRange((prev) => ({ ...prev, end: e.target.value }))}
              className={field}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect("lastMonth")}>Mês passado</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect("currentMonth")}>Mês atual</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect("last3Months")}>Últimos 3 meses</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {report && (
              <Button onClick={handleRenewAll} disabled={renewLoading} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {renewLoading ? "Renovando..." : "Renovar orçamentos"}
              </Button>
            )}
            <Button onClick={handleGenerateReport} disabled={loading} size="sm" variant="accent">
              {loading ? "Gerando..." : "Gerar relatório"}
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <SimpleAlert type="error" message={error} details="Tente ajustar o período ou entre em contato com o suporte" />
      )}

      {report && !loading && <PeriodReportView report={report} />}

      {!report && !loading && !error && (
        <section className={cn(surface, "flex flex-col items-center px-6 py-12 text-center")}>
          <Calendar className="mb-4 h-10 w-10 text-[#64706a]" />
          <h3 className="font-display text-lg font-semibold">Gerar relatório de período</h3>
          <p className="mt-2 max-w-md text-sm text-[#9ca9a1]">
            Selecione o período e clique em Gerar relatório. O fechamento compara orçado, gasto, economia e categorias sem orçamento.
          </p>
        </section>
      )}
    </div>
  );
}
