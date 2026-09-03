"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetFormDialog, type BudgetFormData } from "@/components/budgets/budget-form-dialog";
import { BudgetList } from "@/components/budgets/budget-list";
import { useBudgets } from "@/components/budgets/use-budgets";
import { BudgetStatusDashboard } from "@/components/budgets/budget-status-dashboard";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SimpleAlert } from "@/components/ui/simple-alert";
import type { BudgetWithUsage } from "@/types/budget";
import { Plus, Filter, Target, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

interface CategoryOption {
  id: string;
  name: string;
  type: string;
}

interface BudgetsClientPageProps {
  categories: CategoryOption[];
  currency: CurrencyCode;
}

export function BudgetsClientPage({ categories, currency }: BudgetsClientPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithUsage | null>(null);
  const [filterPeriodType, setFilterPeriodType] = useState<"ALL" | "MONTHLY" | "CUSTOM">("ALL");
  const [filterActive, setFilterActive] = useState<"ALL" | "ACTIVE">("ALL");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { budgets, loading, error, fetchBudgets, createBudget, updateBudget, deleteBudget } =
    useBudgets({
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
    });

  // Carregar orçamentos ao montar o componente
  useEffect(() => {
    loadBudgets();
  }, [filterPeriodType, filterActive]);

  async function loadBudgets() {
    const filters: any = {};

    if (filterPeriodType !== "ALL") {
      filters.periodType = filterPeriodType;
    }

    if (filterActive === "ACTIVE") {
      filters.isActive = true;
    }

    await fetchBudgets(filters);
  }

  function handleCreateClick() {
    setFormMode("create");
    setSelectedBudget(null);
    setFormOpen(true);
  }

  function handleEditClick(budget: BudgetWithUsage) {
    setFormMode("edit");
    setSelectedBudget(budget);
    setFormOpen(true);
  }

  async function handleFormSubmit(data: BudgetFormData) {
    if (formMode === "create") {
      await createBudget(data);
      setSuccessMessage("Orçamento criado com sucesso!");
    } else if (formMode === "edit" && selectedBudget) {
      await updateBudget(selectedBudget.id, data);
      setSuccessMessage("Orçamento atualizado com sucesso!");
    }
  }

  async function handleDelete(budgetId: string) {
    await deleteBudget(budgetId);
    setSuccessMessage("Orçamento excluído com sucesso!");
  }

  // Calcular estatísticas
  const stats = {
    total: budgets.length,
    active: budgets.filter(
      (b) => new Date() >= new Date(b.startDate) && new Date() <= new Date(b.endDate)
    ).length,
    overBudget: budgets.filter((b) => b.isOverBudget).length,
    totalBudgeted: budgets.reduce((sum, b) => sum + Number(b.amount), 0),
    totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0),
  };

  function formatCurrency(value: number): string {
    return formatMoney(value, currency);
  }

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

      {/* Header com botão de ação */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Orçamentos</h2>
          <p className="text-xs text-muted-foreground">Gerencie e acompanhe seus orçamentos mensais e personalizados</p>
        </div>
        <Button onClick={handleCreateClick} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Status Dashboard */}
      <BudgetStatusDashboard currency={currency} />

      {/* Info Card - Como funcionam as notificações */}
      {budgets.length > 0 && stats.totalSpent === 0 && (
        <Card className="border-blue-500/30 bg-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 dark:text-blue-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  💡 Próximo passo: Registre suas despesas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Você criou orçamentos com sucesso! Agora vá para <a href="/app/cashflow" className="text-primary hover:underline font-medium">Cashflow</a> e registre suas despesas. 
                  Você receberá notificações automáticas quando atingir 75%, 90% e 100% do orçamento. 
                  Os relatórios também ficarão disponíveis conforme você adiciona transações.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <DashboardSection>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total de Orçamentos"
            value={stats.total}
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            label="Ativos Agora"
            value={stats.active}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            label="Total Orçado"
            value={formatCurrency(stats.totalBudgeted)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            label="Total Gasto"
            value={formatCurrency(stats.totalSpent)}
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>
      </DashboardSection>

      {/* Filtros */}
      <DashboardSection>
        <Card className="border-white/5 bg-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filtros:</span>
              </div>

              <select
                value={filterPeriodType}
                onChange={(e) => setFilterPeriodType(e.target.value as any)}
                className="text-sm border border-white/10 rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/50"
              >
                <option value="ALL">Todos os tipos</option>
                <option value="MONTHLY">Mensais</option>
                <option value="CUSTOM">Personalizados</option>
              </select>

              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as any)}
                className="text-sm border border-white/10 rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/50"
              >
                <option value="ALL">Todos os períodos</option>
                <option value="ACTIVE">Apenas ativos</option>
              </select>

              {(filterPeriodType !== "ALL" || filterActive !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterPeriodType("ALL");
                    setFilterActive("ALL");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Lista de Orçamentos */}
      <DashboardSection>
        {error && (
          <SimpleAlert
            type="error"
            message={error}
            details="Tente recarregar a página ou entre em contato com o suporte"
          />
        )}

        {loading ? (
          <Card className="border-white/5 bg-card">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Carregando orçamentos...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <BudgetList
            budgets={budgets}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            currency={currency}
          />
        )}
      </DashboardSection>

      {/* Dialog de Formulário */}
      <BudgetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        budget={selectedBudget}
        categories={categories}
        onSubmit={handleFormSubmit}
        currency={currency}
      />
    </div>
  );
}
