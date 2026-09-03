"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BudgetWithUsage } from "@/types/budget";
import { Pencil, Trash2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

interface BudgetListProps {
  budgets: BudgetWithUsage[];
  onEdit: (budget: BudgetWithUsage) => void;
  onDelete: (budgetId: string) => Promise<void>;
  currency: CurrencyCode;
}

export function BudgetList({ budgets, onEdit, onDelete, currency }: BudgetListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetWithUsage | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleDeleteClick(budget: BudgetWithUsage) {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!budgetToDelete) return;

    setDeleting(true);
    try {
      await onDelete(budgetToDelete.id);
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    } catch (error) {
      console.error("Erro ao deletar orçamento:", error);
    } finally {
      setDeleting(false);
    }
  }

  function formatCurrency(value: number): string {
    return formatMoney(value, currency);
  }

  function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function getUsageColor(percentUsed: number, isOverBudget: boolean): string {
    if (isOverBudget) return "text-red-600";
    if (percentUsed >= 90) return "text-orange-600";
    if (percentUsed >= 75) return "text-yellow-600";
    return "text-green-600";
  }

  function getProgressBarColor(percentUsed: number, isOverBudget: boolean): string {
    if (isOverBudget) return "bg-red-500";
    if (percentUsed >= 90) return "bg-orange-500";
    if (percentUsed >= 75) return "bg-yellow-500";
    return "bg-green-500";
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-4">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Nenhum orçamento cadastrado</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Crie seu primeiro orçamento para começar a controlar seus gastos por categoria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {budgets.map((budget) => {
          const isActive =
            new Date() >= new Date(budget.startDate) &&
            new Date() <= new Date(budget.endDate);

          return (
            <Card key={budget.id} className={isActive ? "border-primary/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{budget.name}</h3>
                      {isActive && (
                        <Badge variant="outline" className="text-xs">
                          Ativo
                        </Badge>
                      )}
                      {budget.isOverBudget && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Estourado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {budget.category.name}
                      </Badge>
                      <span>•</span>
                      <span>
                        {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        {budget.periodType === "MONTHLY" ? "Mensal" : "Personalizado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(budget)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(budget)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Valores */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Orçado</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(Number(budget.amount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gasto</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(budget.spent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Restante</p>
                    <p
                      className={`text-lg font-semibold ${
                        budget.isOverBudget ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatCurrency(budget.remaining)}
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uso do orçamento</span>
                    <span
                      className={`font-semibold ${getUsageColor(
                        budget.percentUsed,
                        budget.isOverBudget
                      )}`}
                    >
                      {budget.percentUsed.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressBarColor(
                        budget.percentUsed,
                        budget.isOverBudget
                      )}`}
                      style={{
                        width: `${Math.min(budget.percentUsed, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Alerta se estiver próximo do limite */}
                {!budget.isOverBudget && budget.percentUsed >= 80 && (
                  <div className="flex items-center gap-2 text-sm bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Você já usou {budget.percentUsed.toFixed(0)}% do orçamento
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o orçamento{" "}
              <strong>{budgetToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. O orçamento será permanentemente removido.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
