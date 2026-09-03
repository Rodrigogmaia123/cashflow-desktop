"use client";

import { useState, useEffect } from "react";
import type { PeriodReport } from "@/types/report";

interface UsePeriodReportOptions {
  startDate: Date;
  endDate: Date;
  autoLoad?: boolean;
}

export function usePeriodReport(options: UsePeriodReportOptions) {
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/reports/period?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar relatório");

      const data = await response.json();
      setReport(data.report);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.autoLoad) {
      fetchReport(options.startDate, options.endDate);
    }
  }, [options.startDate, options.endDate, options.autoLoad]);

  return {
    report,
    loading,
    error,
    fetchReport,
  };
}

export function useRenewBudget() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renewBudget = async (budgetId: string, options?: {
    adjustAmount?: number;
    adjustPercentage?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/budgets/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetId,
          ...options,
        }),
      });

      if (!response.ok) throw new Error("Erro ao renovar orçamento");

      const data = await response.json();
      return data.result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const renewAllMonthly = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/budgets/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renewAll: true }),
      });

      if (!response.ok) throw new Error("Erro ao renovar orçamentos");

      const data = await response.json();
      return data.results;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    renewBudget,
    renewAllMonthly,
    loading,
    error,
  };
}
