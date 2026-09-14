"use client";

import { useState, useEffect, useCallback } from "react";
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
  const startKey = options.startDate.getTime();
  const endKey = options.endDate.getTime();

  const fetchReport = useCallback(async (startDate: Date, endDate: Date, signal?: AbortSignal) => {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError("Período inválido");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/reports/period?${params}`, { signal });
      if (!response.ok) throw new Error("Erro ao buscar relatório");

      const data = await response.json();
      setReport(data.report);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Erro ao buscar relatório";
      setError(message === "Failed to fetch" ? "Não foi possível carregar o relatório. Tente de novo." : message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!options.autoLoad) return;
    if (!Number.isFinite(startKey) || !Number.isFinite(endKey)) return;

    const controller = new AbortController();
    void fetchReport(new Date(startKey), new Date(endKey), controller.signal);
    return () => controller.abort();
  }, [options.autoLoad, startKey, endKey, fetchReport]);

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
