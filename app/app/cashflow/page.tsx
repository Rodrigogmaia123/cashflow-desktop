import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { resolveDateRange, type DashboardRange } from "@/lib/analytics/date-range";
import { getWorkspaceCashflow } from "@/lib/analytics/cashflow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CashflowChartPanel } from "@/components/cashflow/cashflow-chart-panel";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { MainAlert } from "@/components/dashboard/main-alert";
import { getBusinessAlerts } from "@/lib/analytics/business-alerts";
import {
  CreateExpenseDialog,
  type ExpenseRow,
  type CategoryOption
} from "@/components/cashflow/expense-dialogs";
import { ExpenseListClient } from "@/components/cashflow/expense-list-client";
import { createExpense, deleteExpense, updateExpense } from "@/app/app/cashflow/actions";
import { CashflowFilters } from "@/components/cashflow/cashflow-filters";
import { IncomeBreakdownPanel } from "@/components/cashflow/income-breakdown-panel";
import { OutflowBreakdownPanel } from "@/components/cashflow/outflow-breakdown-panel";
import { getCashflowInsights } from "@/lib/analytics/cashflow-insights";
import { CashflowInsights } from "@/components/cashflow/cashflow-insights";
import { hasFeature } from "@/lib/plans/features";
import { FeatureLock } from "@/components/plans/feature-lock";
import { ExportButton } from "@/components/exports/export-button";
import { exportCashflowCSV } from "@/app/app/exports/actions";
import {
  CreateManualIncomeDialog,
  DeleteManualIncomeDialog,
  EditManualIncomeDialog,
  type ManualIncomeRow,
  type CategoryOption as IncomeCategoryOption
} from "@/components/cashflow/manual-income-dialogs";
import {
  createManualIncome,
  deleteManualIncome,
  updateManualIncome
} from "@/app/app/cashflow/incomes/actions";
import {
  createInvestment,
  updateInvestment,
  deleteInvestment
} from "@/app/app/cashflow/investments/actions";
import {
  CreateInvestmentDialog,
  EditInvestmentDialog,
  DeleteInvestmentDialog,
  type InvestmentRow
} from "@/components/cashflow/investment-dialogs";
import { CategoryFilter } from "@/components/cashflow/category-filter";
import { PaymentFilter } from "@/components/cashflow/payment-filter";
import { ViewToggle } from "@/components/ui/view-toggle";
import { CashflowSpreadsheetView } from "@/components/cashflow/cashflow-spreadsheet-view";
import { CurrencyViewSelector } from "@/components/currency/currency-view-selector";
import { getCurrencyViewMode } from "@/lib/domain/currency-view-server";
import { formatMoney as formatMoneyCurrency } from "@/lib/domain/currency";
import type { CurrencyCode } from "@/lib/domain/currency";
import { isPersonalEdition } from "@/lib/desktop-edition";
import { RecurringExpensePanel } from "@/components/cashflow/recurring-expense-panel";
import {
  expenseMatchesPaymentFilters,
  parsePaymentBrandFilters,
  parsePaymentMethodFilters
} from "@/lib/domain/payment";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ 
    range?: string; 
    start?: string; 
    end?: string;
    expenseCategories?: string;
    incomeCategories?: string;
    paymentMethods?: string;
    paymentBrands?: string;
    viewMode?: string;
    groupBy?: string;
    spreadsheetOffer?: string;
  }>;
};

const formatMoney = (
  value: Decimal | number | string,
  currency: CurrencyCode
) => formatMoneyCurrency(value, currency);

function parseDateInput(value: string) {
  // Parse como UTC para evitar problemas de timezone
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Normalizar para início do dia
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function buildRangeFromSearchParams(searchParams: Props["searchParams"]): Promise<DashboardRange> {
  const params = await searchParams;
  const start = params?.start;
  const end = params?.end;

  if (start && end) {
    const startDate = parseDateInput(start);
    const endDate = parseDateInput(end);
    if (startDate && endDate) {
      return { type: "absolute", startDate, endDate };
    }
  }

  const allowed = ["7d", "30d", "3m", "6m", "12m", "today"] as const;
  const raw = params?.range;
  const value = (allowed as readonly string[]).includes(raw ?? "") ? (raw as typeof allowed[number]) : "30d";
  return { type: "relative", value };
}

export default async function CashflowPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = await requireActiveWorkspaceId();

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId
      }
    }
  });
  // OWNER tem todas as permissões (incluindo as de ADMIN)
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";

  const params = await searchParams;
  const range = await buildRangeFromSearchParams(searchParams);
  const resolved = resolveDateRange(range);
  const currencyView = await getCurrencyViewMode("CONVERTED");

  const {
    kpis,
    series,
    projection,
    health,
    incomeBreakdown,
    outflowBreakdown,
    displayCurrency,
    baseCurrency
  } = await getWorkspaceCashflow({
    workspaceId,
    startDate: resolved.startDate,
    endDate: resolved.endDate,
    currencyView
  });

  // Buscar ofertas para filtro no modo planilha
  const workspaceOffers = await prisma.offer.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  const viewMode = params?.viewMode || "cards";

  // Calculate trend indicators
  const revenueTrend = kpis.totalRevenue.greaterThan(0) ? "up" : kpis.totalRevenue.lessThan(0) ? "down" : "neutral";
  const expenseTrend = kpis.totalExpenses.greaterThan(0) ? "up" : "neutral";
  const profitTrend = kpis.netProfit.greaterThan(0) ? "up" : kpis.netProfit.lessThan(0) ? "down" : "neutral";

  const hasAdvancedReports = hasFeature(user.plan, "advanced_reports");

  const [insights, alerts] = await Promise.all([
    getCashflowInsights({
      workspaceId,
      startDate: resolved.startDate,
      endDate: resolved.endDate
    }),
    getBusinessAlerts({
      workspaceId,
      startDate: resolved.startDate,
      endDate: resolved.endDate
    })
  ]);
  // Filtros de categoria
  const incomeCategoriesFilter = params?.incomeCategories?.split(",").filter(Boolean);
  const expenseCategoriesFilter = params?.expenseCategories?.split(",").filter(Boolean);

  const manualIncomes = await prisma.manualIncome.findMany({
    where: { 
      workspaceId, 
      date: { gte: resolved.startDate, lte: resolved.endDate },
      ...(incomeCategoriesFilter && incomeCategoriesFilter.length > 0 
        ? { categoryId: { in: incomeCategoriesFilter } }
        : {}
      ),
    },
    include: { category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  const incomeCategories = await prisma.category.findMany({
    where: { workspaceId, type: { in: ["INCOME", "BOTH"] } },
    orderBy: [{ createdAt: "asc" }]
  });

  const incomeCategoryOptions: IncomeCategoryOption[] = incomeCategories.map((c: typeof incomeCategories[0]) => ({
    id: c.id,
    name: c.name,
    type: c.type
  }));

  const manualIncomeRows: ManualIncomeRow[] = manualIncomes.map((i: typeof manualIncomes[0]) => ({
    id: i.id,
    date: i.date.toISOString().split("T")[0],
    description: i.description,
    amount: i.amount.toFixed(2),
    categoryId: i.categoryId ?? null,
    categoryName: i.category?.name ?? null
  }));


  const expenses = await prisma.expense.findMany({
    where: { 
      workspaceId, 
      date: { gte: resolved.startDate, lte: resolved.endDate },
      ...(expenseCategoriesFilter && expenseCategoriesFilter.length > 0 
        ? { categoryId: { in: expenseCategoriesFilter } }
        : {}
      ),
    },
    include: { category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  let expensePayments: Array<{ id: string; paymentMethod: string | null; paymentBrand: string | null }> = [];
  if (expenses.length > 0) {
    try {
      const ids = expenses.map((row) => row.id).filter((id) => /^[a-z0-9]+$/i.test(id));
      if (ids.length > 0) {
        expensePayments = await prisma.$queryRawUnsafe(
          `SELECT "id", "paymentMethod", "paymentBrand" FROM "Expense" WHERE "id" IN (${ids
            .map((id) => `'${id}'`)
            .join(",")})`
        );
      }
    } catch {
      expensePayments = [];
    }
  }
  const paymentById = new Map(expensePayments.map((row) => [row.id, row]));

  const expenseCategories = await prisma.category.findMany({
    where: { workspaceId, type: { in: ["EXPENSE", "BOTH"] } },
    orderBy: [{ createdAt: "asc" }]
  });

  const expenseCategoryOptions: CategoryOption[] = expenseCategories.map((c: typeof expenseCategories[0]) => ({
    id: c.id,
    name: c.name,
    type: c.type
  }));

  const paymentMethodsFilter = parsePaymentMethodFilters(params?.paymentMethods);
  const paymentBrandsFilter = parsePaymentBrandFilters(params?.paymentBrands);

  const expenseRows: ExpenseRow[] = expenses
    .map((e: typeof expenses[0]) => {
      const payment = paymentById.get(e.id);
      return {
        id: e.id,
        date: e.date.toISOString().split("T")[0],
        description: e.description,
        amount: e.amount.toFixed(2),
        type: e.type,
        categoryId: e.categoryId ?? null,
        categoryName: e.category?.name ?? null,
        fromRecurring: Boolean(e.recurringExpenseId),
        paymentMethod: payment?.paymentMethod ?? null,
        paymentBrand: payment?.paymentBrand ?? null
      };
    })
    .filter((row) => expenseMatchesPaymentFilters(row, paymentMethodsFilter, paymentBrandsFilter));

  const expenseEmptyMessage =
    (expenseCategoriesFilter && expenseCategoriesFilter.length > 0) ||
    paymentMethodsFilter.length > 0 ||
    paymentBrandsFilter.length > 0
      ? "Nenhuma despesa com esses filtros neste período."
      : "Nenhuma despesa registrada neste período.";

  const recurringRules = await prisma.recurringExpense.findMany({
    where: { workspaceId },
    include: { category: { select: { name: true } } },
    orderBy: [{ isActive: "desc" }, { dayOfMonth: "asc" }, { createdAt: "asc" }]
  });
  const recurringItems = recurringRules.map((row) => ({
    id: row.id,
    description: row.description,
    amount: row.amount.toFixed(2),
    type: row.type,
    dayOfMonth: row.dayOfMonth,
    isActive: row.isActive,
    startDate: row.startDate.toISOString().split("T")[0],
    endDate: row.endDate ? row.endDate.toISOString().split("T")[0] : null,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null
  }));

  const investmentsList = await prisma.investment.findMany({
    where: { workspaceId, date: { gte: resolved.startDate, lte: resolved.endDate } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  const investmentRows: InvestmentRow[] = investmentsList.map((inv) => ({
    id: inv.id,
    date: inv.date.toISOString().split("T")[0],
    description: inv.description,
    amount: inv.amount.toFixed(2)
  }));

  const activeUi =
    params?.start && params?.end
      ? { kind: "absolute" as const, start: params.start, end: params.end }
      : {
          kind: "relative" as const,
          value:
            (params?.range && ["7d", "30d", "3m", "6m", "12m"].includes(params.range))
              ? params.range
              : "30d"
        };

  const personal = isPersonalEdition();

  function healthBadge() {
    const base = "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold border";
    if (health.status === "healthy") return `${base} bg-success-soft text-success-vibrant border-success-vibrant/30`;
    if (health.status === "neutral") return `${base} bg-warning-soft text-warning border-warning/30`;
    return `${base} bg-destructive-soft text-destructive-vibrant border-destructive-vibrant/30`;
  }

  return (
    <section className="space-y-6 md:space-y-8">
      {/* HEADER - Mobile: compacto */}
      <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
        <div className="space-y-1 md:space-y-2">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
              Cashflow
            </h1>
            <span
              className={healthBadge()}
              title="Baseado no lucro líquido do período selecionado."
            >
              {health.label}
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            Período:{" "}
            <span className="font-medium text-foreground">
              {resolved.startDate.toISOString().split("T")[0]} →{" "}
              {resolved.endDate.toISOString().split("T")[0]}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <CurrencyViewSelector current={currencyView} baseCurrency={baseCurrency} />
          <ExportButton
            action={exportCashflowCSV}
            formData={(() => {
              const fd = new FormData();
              fd.append("startDate", resolved.startDate.toISOString().split("T")[0]);
              fd.append("endDate", resolved.endDate.toISOString().split("T")[0]);
              return fd;
            })()}
            filename={`cashflow-${resolved.startDate.toISOString().split("T")[0]}-${resolved.endDate.toISOString().split("T")[0]}.csv`}
            label="Exportar CSV"
          />
        </div>
      </div>

      {/* SEÇÃO 1: CAMADA 1 — RESULTADO FINAL (Hero KPIs) - Mobile: 1 coluna */}
      <DashboardSection>
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          {/* LUCRO LÍQUIDO — Hero Card */}
          <Card className={`relative overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
            !kpis.netProfit.lessThan(0) 
              ? "border-[#4DFF88]/30 bg-gradient-to-br from-[#4DFF88]/10 via-[#4DFF88]/5 to-transparent" 
              : "border-[#FF5C5C]/30 bg-gradient-to-br from-[#FF5C5C]/10 via-[#FF5C5C]/5 to-transparent"
          }`}>
            <CardContent className="p-4 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Lucro Líquido
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  !kpis.netProfit.lessThan(0) 
                    ? "bg-[#4DFF88]/20" 
                    : "bg-[#FF5C5C]/20"
                }`}>
                  {!kpis.netProfit.lessThan(0) ? (
                    <svg className="h-6 w-6 text-[#4DFF88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-[#FF5C5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                </div>
              </div>
              <div className={`text-2xl md:text-4xl font-bold tracking-tight ${
                !kpis.netProfit.lessThan(0) ? "text-[#4DFF88]" : "text-[#FF5C5C]"
              }`}>
                {formatMoney(kpis.netProfit, displayCurrency)}
              </div>
              <p className="mt-2 md:mt-3 text-[10px] md:text-xs text-muted-foreground">Receita - Saídas</p>
            </CardContent>
          </Card>

          {/* SALDO ACUMULADO — Hero Card */}
          <Card className="relative overflow-hidden border-2 border-[#A855F7]/30 bg-gradient-to-br from-[#A855F7]/10 via-[#A855F7]/5 to-transparent transition-all hover:shadow-xl hover:-translate-y-1 hover:shadow-[#A855F7]/20">
            <CardContent className="p-4 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Saldo Acumulado
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#A855F7]/20 flex items-center justify-center">
                  <svg className="h-6 w-6 text-[#A855F7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl md:text-4xl font-bold tracking-tight text-[#A855F7]">
                {formatMoney(kpis.endingBalance, displayCurrency)}
              </div>
              <p className="mt-2 md:mt-3 text-[10px] md:text-xs text-muted-foreground">Acumulado do net diário</p>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {/* SEÇÃO 2: CAMADA 2 — MOVIMENTO (Receita vs Saídas) */}
      <DashboardSection>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-[#7CFF6B]/20 bg-gradient-to-br from-[#7CFF6B]/5 to-transparent transition-all hover:shadow-lg hover:-translate-y-0.5 hover:shadow-[#7CFF6B]/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Receita Total
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#7CFF6B]/20 flex items-center justify-center">
                  <svg className="h-5 w-5 text-[#7CFF6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-[#7CFF6B]">
                {formatMoney(kpis.totalRevenue, displayCurrency)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Ofertas: {formatMoney(kpis.revenueFromOffers, displayCurrency)} • Outras: {formatMoney(kpis.revenueFromManual, displayCurrency)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#FF5C5C]/20 bg-gradient-to-br from-[#FF5C5C]/5 to-transparent transition-all hover:shadow-lg hover:-translate-y-0.5 hover:shadow-[#FF5C5C]/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Saídas Totais
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#FF5C5C]/20 flex items-center justify-center">
                  <svg className="h-5 w-5 text-[#FF5C5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-[#FF5C5C]">
                {formatMoney(kpis.totalOutflow, displayCurrency)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Ads + Fees (snapshots) + Despesas
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>

      {/* SEÇÃO 3: CAMADA 3 — FUTURO (Projeção) */}
      <DashboardSection>
        <Card className={`border-2 transition-all hover:shadow-xl hover:-translate-y-1 max-w-md ${
          projection.projectedBalance >= 0 
            ? "border-[#3B82F6]/30 bg-gradient-to-br from-[#3B82F6]/10 via-[#3B82F6]/5 to-transparent hover:shadow-[#3B82F6]/20" 
            : "border-[#FF5C5C]/30 bg-gradient-to-br from-[#FF5C5C]/10 via-[#FF5C5C]/5 to-transparent"
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Projeção de Caixa (30 dias)
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                projection.projectedBalance >= 0 ? "bg-[#3B82F6]/20" : "bg-[#FF5C5C]/20"
              }`}>
                <svg className={`h-5 w-5 ${projection.projectedBalance >= 0 ? "text-[#3B82F6]" : "text-[#FF5C5C]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className={`text-3xl font-bold tracking-tight ${
              projection.projectedBalance >= 0 ? "text-[#3B82F6]" : "text-[#FF5C5C]"
            }`}>
              {formatMoney(new Decimal(projection.projectedBalance), displayCurrency)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Baseado na média do período (média diária: {formatMoney(new Decimal(projection.dailyNetAverage), displayCurrency)})
            </p>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* SEÇÃO 4: FILTROS E TOGGLE DE VISUALIZAÇÃO */}
      <DashboardSection>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <CashflowFilters active={activeUi} userPlan={user.plan} />
          <ViewToggle />
        </div>
      </DashboardSection>

      {/* SEÇÃO 5: GRÁFICO OU PLANILHA - Condicional baseado no modo */}
      {viewMode === "spreadsheet" ? (
        <DashboardSection title="Dados do Cashflow">
          {series.length === 0 ? (
            <Card className="border-white/5 bg-card">
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Nenhum dado para este período
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    {personal
                      ? "Adicione entradas ou despesas para ver o fluxo de caixa."
                      : "Adicione entradas manuais ou lançamentos de ofertas para ver o fluxo de caixa."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CashflowSpreadsheetView
              data={series}
              offers={personal ? [] : workspaceOffers}
              hideOfferFilter={personal}
              kpis={{
                totalRevenue: kpis.totalRevenue.toNumber(),
                totalOutflow: kpis.totalOutflow.toNumber(),
                netProfit: kpis.netProfit.toNumber(),
                endingBalance: kpis.endingBalance.toNumber(),
                totalAdInvestment: kpis.totalAdInvestment.toNumber(),
                totalFees: kpis.totalFees.toNumber(),
                totalExpenses: kpis.totalExpenses.toNumber(),
                totalInvestments: kpis.totalInvestments.toNumber(),
              }}
              currency={displayCurrency}
              startDate={resolved.startDate.toISOString().split("T")[0]}
              endDate={resolved.endDate.toISOString().split("T")[0]}
            />
          )}
        </DashboardSection>
      ) : (
        <DashboardSection title="Evolução do Cashflow">
          <Card className="border-white/5 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 md:p-6">
              {series.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center rounded-xl border border-white/5 bg-card-secondary/30">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Nenhum dado para este período
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    {personal
                      ? "Adicione entradas ou despesas para ver o fluxo de caixa."
                      : "Adicione entradas manuais ou lançamentos de ofertas para ver o fluxo de caixa."}
                  </p>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="flex min-h-[400px] items-center justify-center">
                      <div className="text-sm text-muted-foreground">Carregando gráfico...</div>
                    </div>
                  }
                >
                  <CashflowChartPanel
                    data={series.map((p) => ({
                      date: p.date,
                      inflow: p.inflow,
                      outflow: p.outflow,
                      balance: p.balance
                    }))}
                    currency={displayCurrency}
                  />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </DashboardSection>
      )}

      {/* SEÇÃO 6: ALERTAS (Separados dos KPIs) */}
      <DashboardSection title="Alertas">
        <MainAlert alerts={alerts} hideOfferActions={personal} />
      </DashboardSection>

      {/* SEÇÃO 7: INSIGHTS (Relatórios Avançados) */}
      {hasAdvancedReports && (
        <DashboardSection title="Insights">
          <CashflowInsights insights={insights} />
        </DashboardSection>
      )}

      {!hasAdvancedReports && (
        <DashboardSection title="Insights">
          <FeatureLock
            feature="advanced_reports"
            requiredPlan="PRO"
            title="Insights Automáticos"
            description="Insights automáticos estão disponíveis no plano PRO."
            workspaceId={workspaceId}
          />
        </DashboardSection>
      )}

      {/* SEÇÃO 8: ORIGEM DO DINHEIRO (Breakdowns - Relatórios Avançados) */}
      <DashboardSection title="De onde o dinheiro vem">
        {hasAdvancedReports ? (
          <Card>
            <CardContent className="p-6">
              <IncomeBreakdownPanel data={incomeBreakdown} currency={displayCurrency} hideOffers={personal} />
            </CardContent>
          </Card>
        ) : (
          <FeatureLock
            feature="advanced_reports"
            requiredPlan="PRO"
            title="De onde o dinheiro vem"
            description="Veja uma análise detalhada da origem do seu dinheiro. Disponível no plano PRO."
            workspaceId={workspaceId}
          />
        )}
      </DashboardSection>

      {/* SEÇÃO 9: DESTINO DO DINHEIRO (Breakdowns - Relatórios Avançados) */}
      <DashboardSection title="Para onde o dinheiro está indo">
        {hasAdvancedReports ? (
          <Card>
            <CardContent className="p-6">
              <OutflowBreakdownPanel data={outflowBreakdown} currency={displayCurrency} hideOfferSources={personal} />
            </CardContent>
          </Card>
        ) : (
          <FeatureLock
            feature="advanced_reports"
            requiredPlan="PRO"
            title="Para onde o dinheiro está indo"
            description="Veja uma análise detalhada dos gastos. Disponível no plano PRO."
            workspaceId={workspaceId}
          />
        )}
      </DashboardSection>

      {/* SEÇÃO 9: DESPESAS DO PERÍODO */}
      <DashboardSection>
        <RecurringExpensePanel
          isAdmin={isAdmin}
          categories={expenseCategoryOptions}
          items={recurringItems}
          currency={baseCurrency}
        />
      </DashboardSection>

      <DashboardSection>
        <ExpenseListClient
          workspaceId={workspaceId}
          expenses={expenseRows}
          isAdmin={isAdmin}
          actions={{ createExpense, updateExpense, deleteExpense }}
          categories={expenseCategoryOptions}
          currency={baseCurrency}
          emptyMessage={expenseEmptyMessage}
          headerActions={
            <>
              <CreateExpenseDialog
                isAdmin={isAdmin}
                actions={{ createExpense, updateExpense, deleteExpense }}
                categories={expenseCategoryOptions}
              />
              <CreateManualIncomeDialog
                isAdmin={isAdmin}
                categories={incomeCategoryOptions}
                actions={{ createManualIncome, updateManualIncome, deleteManualIncome }}
              />
              <CreateInvestmentDialog
                isAdmin={isAdmin}
                actions={{ createInvestment, updateInvestment, deleteInvestment }}
              />
              <CategoryFilter
                categories={expenseCategoryOptions.map((c) => ({ id: c.id, name: c.name }))}
                filterType="expense"
                label="Categoria"
              />
              <PaymentFilter />
            </>
          }
        />
      </DashboardSection>

      {/* SEÇÃO 10: ENTRADAS MANUAIS DO PERÍODO */}
      <DashboardSection 
        title="Entradas manuais do período"
        actions={
          <CategoryFilter
            categories={incomeCategoryOptions.map((c) => ({ id: c.id, name: c.name }))}
            filterType="income"
            label="Filtrar Entradas"
          />
        }
      >
        <Card className="overflow-hidden" data-tour="manual-income">
          {manualIncomeRows.length === 0 ? (
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma entrada manual registrada neste período.
              </p>
            </CardContent>
          ) : (
            <>
              {/* Desktop: header da tabela */}
              <div className="hidden md:grid border-b border-white/5 bg-card-secondary/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground grid-cols-12 gap-4">
                <div className="col-span-2">Data</div>
                <div className="col-span-4">Descrição</div>
                <div className="col-span-3">Categoria</div>
                <div className="col-span-2">Valor</div>
                <div className="col-span-1 text-right">Ações</div>
              </div>
              <div className="divide-y divide-white/5">
                {manualIncomeRows.map((i) => (
                  <div key={i.id}>
                    {/* Desktop: linha da tabela */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center px-6 py-4 text-sm transition-colors hover:bg-white/5">
                      <div className="col-span-2 text-xs text-muted-foreground font-medium">{i.date}</div>
                      <div className="col-span-4 text-foreground">{i.description}</div>
                      <div className="col-span-3 text-muted-foreground">{i.categoryName ?? "-"}</div>
                      <div className="col-span-2 font-semibold text-accent">{formatMoney(i.amount, baseCurrency)}</div>
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <EditManualIncomeDialog
                          income={i}
                          isAdmin={isAdmin}
                          categories={incomeCategoryOptions}
                          actions={{ createManualIncome, updateManualIncome, deleteManualIncome }}
                        />
                        <DeleteManualIncomeDialog
                          incomeId={i.id}
                          isAdmin={isAdmin}
                          actions={{ createManualIncome, updateManualIncome, deleteManualIncome }}
                        />
                      </div>
                    </div>
                    {/* Mobile: card */}
                    <div className="md:hidden p-4 space-y-2 border-b border-white/5 last:border-b-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-xs text-muted-foreground font-medium">{i.date}</div>
                          <div className="text-sm font-medium text-foreground">{i.description}</div>
                          {i.categoryName && (
                            <div className="text-[10px] text-muted-foreground">{i.categoryName}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="font-semibold text-sm text-accent">{formatMoney(i.amount, baseCurrency)}</div>
                          <div className="flex items-center gap-1">
                            <EditManualIncomeDialog
                              income={i}
                              isAdmin={isAdmin}
                              categories={incomeCategoryOptions}
                              actions={{ createManualIncome, updateManualIncome, deleteManualIncome }}
                            />
                            <DeleteManualIncomeDialog
                              incomeId={i.id}
                              isAdmin={isAdmin}
                              actions={{ createManualIncome, updateManualIncome, deleteManualIncome }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!isAdmin && (
                <div className="border-t border-white/5 px-6 py-3 bg-card-secondary/30">
                  <p className="text-xs text-muted-foreground">
                    Você é MEMBER: pode visualizar, mas não pode criar/editar/excluir entradas manuais.
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      </DashboardSection>

      {/* SEÇÃO 11: INVESTIMENTOS DO PERÍODO */}
      <DashboardSection
        title="Investimentos do período"
        description="Dinheiro direcionado para reserva ou investimentos (ex: caixinha, CDB, Tesouro)"
      >
        <Card className="overflow-hidden border-[#3B82F6]/20">
          {investmentRows.length === 0 ? (
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum investimento registrado neste período.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em &quot;Adicionar investimento&quot; para direcionar valores (ex: reserva de emergência, CDB).
              </p>
            </CardContent>
          ) : (
            <>
              <div className="hidden md:grid border-b border-white/5 bg-card-secondary/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground grid-cols-12 gap-4">
                <div className="col-span-2">Data</div>
                <div className="col-span-6">Descrição</div>
                <div className="col-span-3">Valor</div>
                <div className="col-span-1 text-right">Ações</div>
              </div>
              <div className="divide-y divide-white/5">
                {investmentRows.map((inv) => (
                  <div key={inv.id}>
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center px-6 py-4 text-sm transition-colors hover:bg-white/5">
                      <div className="col-span-2 text-xs text-muted-foreground font-medium">{inv.date}</div>
                      <div className="col-span-6 text-foreground">{inv.description}</div>
                      <div className="col-span-3 font-semibold text-[#3B82F6]">{formatMoney(inv.amount, baseCurrency)}</div>
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <EditInvestmentDialog
                          investment={inv}
                          isAdmin={isAdmin}
                          actions={{ createInvestment, updateInvestment, deleteInvestment }}
                        />
                        <DeleteInvestmentDialog
                          investmentId={inv.id}
                          isAdmin={isAdmin}
                          actions={{ createInvestment, updateInvestment, deleteInvestment }}
                        />
                      </div>
                    </div>
                    <div className="md:hidden p-4 space-y-2 border-b border-white/5 last:border-b-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground font-medium">{inv.date}</div>
                          <div className="text-sm font-medium text-foreground">{inv.description}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="font-semibold text-sm text-[#3B82F6]">{formatMoney(inv.amount, baseCurrency)}</div>
                          <div className="flex items-center gap-1">
                            <EditInvestmentDialog
                              investment={inv}
                              isAdmin={isAdmin}
                              actions={{ createInvestment, updateInvestment, deleteInvestment }}
                            />
                            <DeleteInvestmentDialog
                              investmentId={inv.id}
                              isAdmin={isAdmin}
                              actions={{ createInvestment, updateInvestment, deleteInvestment }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 px-6 py-3 bg-card-secondary/30 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total no período</span>
                <span className="font-bold text-[#3B82F6]">
                  {formatMoney(investmentRows.reduce((sum, inv) => sum + parseFloat(inv.amount), 0), baseCurrency)}
                </span>
              </div>
              {!isAdmin && (
                <div className="border-t border-white/5 px-6 py-3 bg-card-secondary/30">
                  <p className="text-xs text-muted-foreground">
                    Você é MEMBER: pode visualizar, mas não pode criar/editar/excluir investimentos.
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      </DashboardSection>
    </section>
  );
}


