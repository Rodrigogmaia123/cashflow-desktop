"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BudgetWithCategory } from "@/types/budget";
import type { BudgetPeriodType } from "@/lib/prisma-enums";
import type { CurrencyCode } from "@/lib/domain/currency";

interface CategoryOption {
  id: string;
  name: string;
  type: string;
}

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetFormData) => Promise<void>;
  categories: CategoryOption[];
  budget?: BudgetWithCategory | null;
  mode: "create" | "edit";
  currency: CurrencyCode;
}

export interface BudgetFormData {
  categoryId: string;
  name: string;
  amount: number;
  periodType: BudgetPeriodType;
  startDate: string;
  endDate: string;
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  budget,
  mode,
  currency,
}: BudgetFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [periodType, setPeriodType] = useState<BudgetPeriodType>("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Inicializar form com dados do orçamento (modo edição)
  useEffect(() => {
    if (mode === "edit" && budget) {
      setCategoryId(budget.categoryId);
      setName(budget.name);
      setAmount(budget.amount.toString());
      setPeriodType(budget.periodType);
      setStartDate(formatDateForInput(new Date(budget.startDate)));
      setEndDate(formatDateForInput(new Date(budget.endDate)));
    } else if (mode === "create") {
      // Reset form para criação
      setCategoryId("");
      setName("");
      setAmount("");
      setPeriodType("MONTHLY");
      
      // Definir datas padrão para o mês atual
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setStartDate(formatDateForInput(firstDay));
      setEndDate(formatDateForInput(lastDay));
    }
  }, [mode, budget, open]);

  // Atualizar datas automaticamente quando mudar para MONTHLY
  useEffect(() => {
    if (periodType === "MONTHLY" && mode === "create") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setStartDate(formatDateForInput(firstDay));
      setEndDate(formatDateForInput(lastDay));
    }
  }, [periodType, mode]);

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!categoryId) {
      newErrors.categoryId = "Selecione uma categoria";
    }

    if (!name.trim()) {
      newErrors.name = "Digite um nome para o orçamento";
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Digite um valor positivo";
    }

    if (!startDate) {
      newErrors.startDate = "Selecione a data de início";
    }

    if (!endDate) {
      newErrors.endDate = "Selecione a data de fim";
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        newErrors.endDate = "Data final deve ser posterior à inicial";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await onSubmit({
        categoryId,
        name: name.trim(),
        amount: parseFloat(amount),
        periodType,
        startDate,
        endDate,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Erro ao salvar orçamento",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Criar Novo Orçamento" : "Editar Orçamento"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Configure um orçamento para controlar seus gastos por categoria."
                : "Atualize as informações do orçamento."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nome */}
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome do Orçamento *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Marketing Fevereiro 2026"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Categoria *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.type === "EXPENSE" ? "Despesa" : "Receita"})
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-sm text-red-600">{errors.categoryId}</p>
              )}
            </div>

            {/* Valor */}
            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Valor Previsto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                  {currency}
                </span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Tipo de Período */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo de Período *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodType("MONTHLY")}
                  className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                    periodType === "MONTHLY"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                  }`}
                  disabled={loading}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType("CUSTOM")}
                  className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                    periodType === "CUSTOM"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                  }`}
                  disabled={loading}
                >
                  Personalizado
                </button>
              </div>
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="startDate" className="text-sm font-medium">
                  Data Início *
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading || periodType === "MONTHLY"}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="endDate" className="text-sm font-medium">
                  Data Fim *
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading || periodType === "MONTHLY"}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>

            {periodType === "MONTHLY" && (
              <p className="text-xs text-muted-foreground">
                As datas são definidas automaticamente para o mês atual (dia 1 até o último dia).
              </p>
            )}

            {errors.submit && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
