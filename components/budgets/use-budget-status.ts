"use client";

import { useState, useEffect, useCallback } from "react";
import type { BudgetSummary, BudgetAlert } from "@/lib/domain/budget-analytics";

interface UseBudgetStatusOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // em milissegundos
  onAlert?: (alerts: BudgetAlert[]) => void;
}

export function useBudgetStatus(options: UseBudgetStatusOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos por padrão
    onAlert,
  } = options;

  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/budgets/status");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar status");
      }

      const data = await response.json();
      setSummary(data.summary);
      setLastUpdate(new Date(data.timestamp));

      // Disparar callback se houver alertas
      if (onAlert && data.summary.alerts.length > 0) {
        onAlert(data.summary.alerts);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      setError(error.message);
      console.error("Erro ao buscar status dos orçamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [onAlert]);

  useEffect(() => {
    // Buscar status inicialmente
    fetchStatus();

    if (autoRefresh) {
      // Configurar polling
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchStatus]);

  const refresh = useCallback(() => {
    return fetchStatus();
  }, [fetchStatus]);

  const hasAlerts = summary ? summary.budgetsWithAlerts > 0 : false;
  const hasCriticalAlerts = summary
    ? summary.alerts.some(
        (a) => a.level === "exceeded" || a.level === "critical"
      )
    : false;

  return {
    summary,
    loading,
    error,
    lastUpdate,
    refresh,
    hasAlerts,
    hasCriticalAlerts,
  };
}

/**
 * Hook simplificado para verificar apenas se há alertas críticos
 */
export function useCriticalAlerts(options: { autoRefresh?: boolean } = {}) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCriticalAlerts = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/budgets/status?onlyCritical=true");

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Erro ao buscar alertas críticos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCriticalAlerts();

    if (options.autoRefresh) {
      const interval = setInterval(fetchCriticalAlerts, 60000); // 1 minuto
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, fetchCriticalAlerts]);

  return {
    alerts,
    loading,
    hasAlerts: alerts.length > 0,
    count: alerts.length,
    refresh: fetchCriticalAlerts,
  };
}
