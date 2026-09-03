import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { getWorkspaceDashboard } from "@/lib/analytics/dashboard";
import { getWorkspaceCashflow } from "@/lib/analytics/cashflow";
import { getBusinessAlerts } from "@/lib/analytics/business-alerts";
import { prisma } from "@/lib/db";
import { OverviewMetrics } from "@/components/overview/overview-metrics";
import { BusinessHealth } from "@/components/overview/business-health";
import { Highlights } from "@/components/overview/highlights";
import { NextActions } from "@/components/overview/next-actions";
import { PeriodSummary } from "@/components/overview/period-summary";
import { BusinessHealthScore } from "@/components/overview/business-health-score";
import { WeeklySnapshot } from "@/components/overview/weekly-snapshot";
import { getPeriodComparison } from "@/lib/analytics/period-comparison";
import { getComparisonDateRanges } from "@/lib/analytics/period-comparison-ranges";
import { getBusinessHealthScore } from "@/lib/analytics/business-health-score";
import { getWeeklySnapshot } from "@/lib/analytics/weekly-snapshot";
import { startOfDay, addDaysUTC, endOfDay } from "@/lib/analytics/date-range-utils";
import { hasFeature } from "@/lib/plans/features";
import { requireHistoricalAnalysis } from "@/lib/plans/authorization";
import { OverviewFilters } from "@/components/overview/overview-filters";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { CurrencyViewSelector } from "@/components/currency/currency-view-selector";
import { getCurrencyViewMode } from "@/lib/domain/currency-view-server";
import { isPersonalEdition } from "@/lib/desktop-edition";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ range?: string; start?: string; end?: string }>;
};

function parseDateInput(value: string) {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function buildDateRangeFromSearchParams(
  searchParams: Props["searchParams"],
  userPlan: "FREE" | "PRO" | "BUSINESS"
): Promise<{ startDate: Date; endDate: Date; activeUi: Parameters<typeof OverviewFilters>[0]["active"] }> {
  const params = await searchParams;
  const start = params?.start;
  const end = params?.end;

  // Se tem start e end, usa range absoluto
  if (start && end) {
    const startDate = parseDateInput(start);
    const endDate = parseDateInput(end);
    if (startDate && endDate) {
      return {
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
        activeUi: { kind: "absolute", start, end }
      };
    }
  }

  // Range relativo
  const allowed = ["7d", "30d", "90d"] as const;
  const raw = params?.range;
  const value = (allowed as readonly string[]).includes(raw ?? "") ? (raw as typeof allowed[number]) : "30d";
  
  const now = new Date();
  const endDate = endOfDay(now);
  let startDate: Date;

  if (value === "7d") {
    startDate = startOfDay(addDaysUTC(now, -6));
  } else if (value === "90d") {
    startDate = startOfDay(addDaysUTC(now, -89));
  } else {
    // 30d (padrão)
    startDate = startOfDay(addDaysUTC(now, -29));
  }

  return {
    startDate,
    endDate,
    activeUi: { kind: "relative", value }
  };
}

export default async function OverviewPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = await requireActiveWorkspaceId();
  
  // Constrói range a partir de searchParams
  const { startDate, endDate, activeUi } = await buildDateRangeFromSearchParams(searchParams, user.plan);

  // Backend enforcement: verifica se FREE está tentando acessar > 30 dias
  const historicalCheck = await requireHistoricalAnalysis({
    startDate,
    endDate
  });

  // Se não permitido, ajusta para 30 dias (FREE)
  let finalStartDate = startDate;
  let finalEndDate = endDate;
  
  if (!historicalCheck.allowed) {
    // Ajusta para exatamente 30 dias a partir da data final
    const end = new Date(endDate);
    const adjustedStart = new Date(end);
    adjustedStart.setUTCDate(adjustedStart.getUTCDate() - 29); // 30 dias (hoje + 29 anteriores)
    adjustedStart.setUTCHours(0, 0, 0, 0);
    finalStartDate = adjustedStart;
    // Mantém endDate como está (hoje)
  }

  const currencyView = await getCurrencyViewMode("CONVERTED");

  // Buscar dados em paralelo usando range final (após enforcement)
  const [dashboardData, cashflowData, alerts, offers, expenses, manualIncomes, feeConfig, periodComparison, healthScore, weeklySnapshot] = await Promise.all([
    getWorkspaceDashboard({
      workspaceId,
      range: { type: "relative", value: "30d" }, // Dashboard mantém 30d por enquanto
      currencyView
    }),
    getWorkspaceCashflow({
      workspaceId,
      startDate: finalStartDate,
      endDate: finalEndDate,
      currencyView
    }),
    getBusinessAlerts({
      workspaceId,
      startDate: finalStartDate,
      endDate: finalEndDate
    }),
    prisma.offer.findMany({
      where: { workspaceId },
      select: { id: true },
      take: 1
    }),
    prisma.expense.findMany({
      where: { workspaceId },
      select: { id: true },
      take: 1
    }),
    prisma.manualIncome.findMany({
      where: { workspaceId },
      select: { id: true },
      take: 1
    }),
    prisma.workspaceFeeConfig.findUnique({
      where: { workspaceId }
    }),
    getPeriodComparison({
      workspaceId,
      current: getComparisonDateRanges("30d").current,
      previous: getComparisonDateRanges("30d").previous
    }),
    getBusinessHealthScore({
      workspaceId,
      startDate: finalStartDate,
      endDate: finalEndDate
    }),
    getWeeklySnapshot({
      workspaceId,
      includeOfferMetrics: !isPersonalEdition()
    })
  ]);

  // Calcular receita total (de ofertas + manual)
  const revenue = cashflowData.kpis.totalRevenue;

  // Calcular despesas totais
  const expensesTotal = cashflowData.kpis.totalExpenses.add(cashflowData.kpis.totalAdInvestment).add(cashflowData.kpis.totalFees);

  // Lucro líquido
  const profit = cashflowData.kpis.netProfit;

  // ROI médio do dashboard
  const roi = dashboardData.kpis.roiWeighted;

  // Encontrar melhor e pior oferta
  const topOffer = dashboardData.topOffers[0] ?? null;
  const worstOffer = dashboardData.topOffers.length > 1
    ? dashboardData.topOffers.find((o) => o.profit < 0) ?? dashboardData.topOffers[dashboardData.topOffers.length - 1]
    : null;

  // Categoria de despesa dominante
  const dominantExpenseCategory =
    cashflowData.outflowBreakdown.manualByCategory[0]?.categoryName ?? null;

  // Crescimento de receita (comparação com período anterior)
  // Calcula período anterior com mesma duração
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((finalEndDate.getTime() - finalStartDate.getTime()) / msPerDay) + 1;
  
  const previousRange = {
    startDate: startOfDay(addDaysUTC(finalStartDate, -daysDiff)),
    endDate: endOfDay(addDaysUTC(finalStartDate, -1))
  };

  let revenueGrowth: number | null = null;
  try {
    const previousCashflow = await getWorkspaceCashflow({
      workspaceId,
      startDate: previousRange.startDate,
      endDate: previousRange.endDate
    });

    const currentRevenue = cashflowData.kpis.totalRevenue.toNumber();
    const previousRevenue = previousCashflow.kpis.totalRevenue.toNumber();

    if (previousRevenue > 0) {
      revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    }
  } catch (error) {
    // Ignora erros ao calcular crescimento (pode não haver dados suficientes ou limite de plano)
    // FREE: não pode acessar período anterior > 30 dias
    void error;
  }

  // Calcula dias do período para exibição
  const periodDays = Math.floor((finalEndDate.getTime() - finalStartDate.getTime()) / msPerDay) + 1;
  const personal = isPersonalEdition();
  
  // Se foi ajustado (FREE tentou > 30 dias), mostra aviso
  const wasAdjusted = !historicalCheck.allowed && (startDate.getTime() !== finalStartDate.getTime() || endDate.getTime() !== finalEndDate.getTime());

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
            <p className="text-sm text-muted-foreground">
              {personal
                ? "Resumo das suas finanças."
                : "Resumo executivo do seu negócio."}{" "}
              <span className="font-medium text-foreground">
                {periodDays} {periodDays === 1 ? "dia" : "dias"}
              </span>
              {" "}({finalStartDate.toISOString().split("T")[0]} → {finalEndDate.toISOString().split("T")[0]})
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <CurrencyViewSelector
              current={currencyView}
              baseCurrency={cashflowData.baseCurrency}
            />
            <OverviewFilters active={activeUi} userPlan={user.plan} />
          </div>
        </div>
        {wasAdjusted && (
          <div className="rounded-md border border-primary/20 bg-primary/10 px-4 py-3">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Período ajustado:</span> No plano FREE, você pode visualizar apenas os últimos 30 dias. 
              {" "}
              <a href="/app/billing" className="text-primary hover:underline font-medium">
                Faça upgrade para PRO
              </a>
              {" "}
              para acessar análise histórica completa.
            </p>
          </div>
        )}
      </div>

      <OverviewMetrics
        revenue={revenue}
        expenses={expensesTotal}
        profit={profit}
        roi={roi}
        currency={cashflowData.displayCurrency}
        hideRoi={personal}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <BusinessHealth
          alerts={alerts}
          netProfit={profit}
          title={personal ? "Saúde financeira" : undefined}
          emptyMessage={
            personal
              ? "Suas finanças estão em boa saúde. Continue acompanhando entradas e gastos."
              : undefined
          }
        />
        <BusinessHealthScore score={healthScore} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PeriodSummary comparison={periodComparison} currency={cashflowData.displayCurrency} hideRoi={personal} />
        <WeeklySnapshot snapshot={weeklySnapshot} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Highlights
          topOffer={topOffer}
          worstOffer={worstOffer}
          dominantExpenseCategory={dominantExpenseCategory}
          revenueGrowth={revenueGrowth}
          currency={cashflowData.displayCurrency}
          hideOffers={personal}
        />

        <NextActions
          hasOffers={offers.length > 0}
          hasExpenses={expenses.length > 0}
          hasManualIncomes={manualIncomes.length > 0}
          hasFeeConfig={feeConfig !== null}
          workspaceId={workspaceId}
          personal={personal}
        />
      </div>
    </section>
  );
}
