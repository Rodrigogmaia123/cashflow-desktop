"use client";

import { useState, useCallback } from "react";
import type { BudgetWithUsage } from "@/types/budget";
import type { BudgetFormData } from "@/components/budgets/budget-form-dialog";

interface UseBudgetsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useBudgets(options: UseBudgetsOptions = {}) {
  const [budgets, setBudgets] = useState<BudgetWithUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os orçamentos
  const fetchBudgets = useCallback(async (filters?: {
    categoryId?: string;
    periodType?: "MONTHLY" | "CUSTOM";
    isActive?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.categoryId) params.append("categoryId", filters.categoryId);
      if (filters?.periodType) params.append("periodType", filters.periodType);
      if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));

      const url = `/api/budgets${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao carregar orçamentos");
      }

      const data = await response.json();
      setBudgets(data.budgets || []);
      options.onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      setError(error.message);
      options.onError?.(error);
      console.error("Erro ao buscar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Criar novo orçamento
  const createBudget = useCallback(async (data: BudgetFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar orçamento");
      }

      const result = await response.json();
      
      // Recarregar lista de orçamentos
      await fetchBudgets();
      
      options.onSuccess?.();
      return result.budget;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      setError(error.message);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchBudgets, options]);

  // Atualizar orçamento
  const updateBudget = useCallback(async (budgetId: string, data: Partial<BudgetFormData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar orçamento");
      }

      const result = await response.json();
      
      // Recarregar lista de orçamentos
      await fetchBudgets();
      
      options.onSuccess?.();
      return result.budget;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      setError(error.message);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchBudgets, options]);

  // Deletar orçamento
  const deleteBudget = useCallback(async (budgetId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao deletar orçamento");
      }

      // Recarregar lista de orçamentos
      await fetchBudgets();
      
      options.onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Erro desconhecido");
      setError(error.message);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchBudgets, options]);

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
