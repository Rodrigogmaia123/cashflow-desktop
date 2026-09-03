import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import {
  getWorkspaceComparisonDashboard,
  getWorkspaceDashboard,
  getWorkspaceCalendarData
} from "@/lib/analytics/dashboard";
import { WorkspaceCalendarHeatmap } from "@/components/dashboard/workspace-calendar-heatmap";
import { WorkspaceCalendarOfferSelector } from "@/components/dashboard/workspace-calendar-offer-selector";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MainAlert } from "@/components/dashboard/main-alert";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { SoftBadge } from "@/components/dashboard/soft-badge";
import type { DashboardRange } from "@/lib/analytics/date-range";
import { WorkspaceDashboardChartPanel } from "@/components/dashboard/workspace-dashboard-chart-panel";
import Link from "next/link";
import { WorkspaceDashboardViewToggle } from "@/components/dashboard/workspace-dashboard-view-toggle";
import { WorkspaceDashboardComparisonControls } from "@/components/dashboard/workspace-dashboard-comparison-controls";
import { WorkspaceComparisonChart } from "@/components/charts/workspace-comparison-chart";
import { Button } from "@/components/ui/button";
import { PeriodComparisonSection } from "@/components/comparison/period-comparison-section";
import { PeriodComparisonControls } from "@/components/comparison/period-comparison-controls";
import { BusinessAlertsSection } from "@/components/alerts/business-alerts-section";
import { ExportButton } from "@/components/exports/export-button";
import { exportDashboardCSV } from "@/app/app/exports/actions";
import { Tooltip } from "@/components/ui/tooltip";
import { hasFeature } from "@/lib/plans/features";
import { FeatureLock } from "@/components/plans/feature-lock";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DashboardSpreadsheetView } from "@/components/dashboard/dashboard-spreadsheet-view";
import { CurrencyViewSelector } from "@/components/currency/currency-view-selector";
import { getCurrencyViewMode } from "@/lib/domain/currency-view-server";
import { formatMoney as formatMoneyCurrency, type CurrencyCode } from "@/lib/domain/currency";

export const dynamic = "force-dynamic";

function formatMoney(value: Decimal | number, currency: CurrencyCode) {
  return formatMoneyCurrency(value, currency);
}

type Props = {
  searchParams?: Promise<{
    range?: string;
    start?: string;
    end?: string;
    view?: string;
    offers?: string;
    metric?: string;
    compareType?: string;
    offerId?: string;
    viewMode?: string;
    groupBy?: string;
    spreadsheetOffer?: string;
  }>;
};

function parseDateInput(value: string) {
  // "YYYY-MM-DD" -> Date (UTC midnight) para evitar shift de timezone
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function buildRangeFromSearchParams(
  searchParams: Props["searchParams"]
): Promise<{ range: DashboardRange; activeUi: Parameters<typeof DashboardFilters>[0]["active"] }> {
  const params = await searchParams;
  const start = params?.start;
  const end = params?.end;

  if (start && end) {
    const startDate = parseDateInput(start);
    const endDate = parseDateInput(end);
    if (startDate && endDate) {
      return {
        range: { type: "absolute", startDate, endDate },
        activeUi: { kind: "absolute", start, end }
      };
    }
  }

  const allowed = ["today", "7d", "30d", "3m", "6m", "12m"] as const;
  const raw = params?.range;
  const value = (allowed as readonly string[]).includes(raw ?? "") ? (raw as typeof allowed[number]) : "30d";
  return {
    range: { type: "relative", value },
    activeUi: { kind: "relative", value }
  };
}


export default async function WorkspaceDashboardPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = await requireActiveWorkspaceId();

  const params = await searchParams;
  const built = await buildRangeFromSearchParams(searchParams);

  // Obter filtro de oferta para modo planilha
  const selectedOfferId = params?.spreadsheetOffer && params.spreadsheetOffer !== "all" 
    ? params.spreadsheetOffer 
    : undefined;

  const currencyView = await getCurrencyViewMode("CONVERTED");

  const {
    kpis,
    dailySeries,
    cumulativeSeries,
    topOffers,
    comparison,
    resolvedRange,
    displayCurrency,
    baseCurrency
  } = await getWorkspaceDashboard({
    workspaceId,
    range: built.range,
    offerId: selectedOfferId,
    currencyView
  });

  const view =
    params?.view === "compare" || params?.view === "heatmap"
      ? (params.view as "compare" | "heatmap")
      : "main";

  const viewMode = params?.viewMode || "cards";

  const offerQuery = (() => {
    if (built.activeUi.kind === "absolute") {
      return `start=${encodeURIComponent(built.activeUi.start)}&end=${encodeURIComponent(built.activeUi.end)}`;
    }
    return `range=${encodeURIComponent(built.activeUi.value)}`;
  })();

  const offersList = await prisma.offer.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" }
  });

  // Fetch alerts for MainAlert
  const { getBusinessAlerts } = await import("@/lib/analytics/business-alerts");
  const alerts = await getBusinessAlerts({
    workspaceId,
    startDate: resolvedRange.startDate,
    endDate: resolvedRange.endDate
  });

  return (
    <section className="space-y-6 md:space-y-8">
      {/* HEADER - Mobile: compacto, Desktop: original */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            <span className="hidden md:inline">Visão executiva com ROI ponderado. Período: </span>
            <span className="font-medium text-foreground">
              {resolvedRange.startDate.toISOString().split("T")[0]} →{" "}
              {resolvedRange.endDate.toISOString().split("T")[0]}
            </span>
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <CurrencyViewSelector current={currencyView} baseCurrency={baseCurrency} />
          <DashboardFilters active={built.activeUi} userPlan={user.plan} />
          <ViewToggle />
          <div className="hidden md:block">
            <ExportButton
              action={exportDashboardCSV}
              formData={(() => {
                const fd = new FormData();
                if (built.activeUi.kind === "absolute") {
                  fd.append("start", built.activeUi.start);
                  fd.append("end", built.activeUi.end);
                } else {
                  fd.append("range", built.activeUi.value);
                }
                return fd;
              })()}
              filename={`dashboard-${resolvedRange.startDate.toISOString().split("T")[0]}-${resolvedRange.endDate.toISOString().split("T")[0]}.csv`}
              label="Exportar CSV"
            />
          </div>
        </div>
      </div>

      <WorkspaceDashboardViewToggle activeView={view === "main" ? "main" : view} />

      {view === "main" && (
        <>
          {/* SEÇÃO 1: KPIs PRINCIPAIS - Mobile: 1 coluna, Desktop: grid */}
          <DashboardSection>
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5" data-tour="dashboard-kpis">
              <MetricCard
                label="Investimento"
                value={formatMoney(kpis.investmentTotal, displayCurrency)}
                tooltip="Valor gasto em tráfego/mídia (sem taxas)"
              />
              <MetricCard
                label="Faturamento"
                value={formatMoney(kpis.revenueTotal, displayCurrency)}
                tooltip="Receita total das vendas"
              />
              <MetricCard
                label="Taxas"
                value={formatMoney(kpis.feeTotal, displayCurrency)}
                tooltip="Checkout + Gateway + Impostos"
                className="ring-1 ring-orange-500/20"
              />
              <MetricCard
                label="Lucro"
                value={formatMoney(kpis.profitTotal, displayCurrency)}
                delta={
                  comparison.delta.profitPct
                    ? {
                        value: comparison.delta.profitPct.toNumber(),
                        percentage: comparison.delta.profitPct.mul(100).toNumber()
                      }
                    : null
                }
                tooltip="Faturamento - (Investimento + Taxas)"
                className={!kpis.profitTotal.lessThan(0) ? "ring-1 ring-success-vibrant/20" : ""}
              />
              <MetricCard
                label="ROI real (ponderado)"
                value={`${kpis.roiWeighted.mul(100).toFixed(2)}%`}
                delta={
                  comparison.delta.roiPct
                    ? {
                        value: comparison.delta.roiPct.toNumber(),
                        percentage: comparison.delta.roiPct.mul(100).toNumber()
                      }
                    : null
                }
                tooltip="Faturamento ÷ (Investimento + Taxas)"
                className={!kpis.roiWeighted.lessThan(1) ? "ring-1 ring-primary/20" : ""}
              />
            </div>
          </DashboardSection>

          {/* SEÇÃO 2: ALERTA PRINCIPAL */}
          <DashboardSection>
            <MainAlert alerts={alerts} />
          </DashboardSection>

          {/* SEÇÃO 3: GRÁFICO OU PLANILHA - Condicional baseado no modo */}
          {viewMode === "spreadsheet" ? (
            <DashboardSection title="Dados do Dashboard">
              {dailySeries.length === 0 ? (
                <Card className="border-white/5 bg-card">
                  <CardContent className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Nenhum dado para este período
                      </p>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Comece criando uma oferta e adicionando lançamentos de performance diária.
                      </p>
                      <Link href="/app/offers">
                        <Button size="sm" variant="outline">
                          Criar oferta
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <DashboardSpreadsheetView
                  data={dailySeries}
                  offers={offersList}
                  kpis={{
                    investmentTotal: kpis.investmentTotal.toNumber(),
                    revenueTotal: kpis.revenueTotal.toNumber(),
                    salesTotal: kpis.salesTotal,
                    feeTotal: kpis.feeTotal.toNumber(),
                    profitTotal: kpis.profitTotal.toNumber(),
                    roiWeighted: kpis.roiWeighted.toNumber(),
                  }}
                  currency={displayCurrency}
                  startDate={resolvedRange.startDate.toISOString().split("T")[0]}
                  endDate={resolvedRange.endDate.toISOString().split("T")[0]}
                />
              )}
            </DashboardSection>
          ) : (
            <DashboardSection title="Evolução do Período">
              <Card className="border-white/5 bg-card">
                <CardContent className="p-4 md:p-6">
                {dailySeries.length === 0 ? (
                  <div className="flex min-h-[288px] flex-col items-center justify-center space-y-3 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhum dado para este período
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Comece criando uma oferta e adicionando lançamentos de performance diária.
                    </p>
                    <Link href="/app/offers">
                      <Button size="sm" variant="outline">
                        Criar oferta
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <WorkspaceDashboardChartPanel
                      workspaceId={workspaceId}
                      dailySeries={dailySeries}
                      cumulativeSeries={cumulativeSeries}
                      currency={displayCurrency}
                    />
                  </>
                )}
                </CardContent>
              </Card>
            </DashboardSection>
          )}

          {/* SEÇÃO 4: COMPARAÇÃO DE PERÍODOS (Relatórios Avançados) */}
          {hasFeature(user.plan, "advanced_reports") ? (
            <DashboardSection title="Comparação de Períodos">
              <PeriodComparisonControls
                currentType={(params?.compareType === "today" || params?.compareType === "7d" || params?.compareType === "30d") ? params.compareType : "30d"}
              />
              <PeriodComparisonSection
                workspaceId={workspaceId}
                comparisonType={(params?.compareType === "today" || params?.compareType === "7d" || params?.compareType === "30d") ? params.compareType : "30d"}
                currency={displayCurrency}
              />
            </DashboardSection>
          ) : (
            <DashboardSection title="Comparação de Períodos">
              <FeatureLock
                feature="advanced_reports"
                requiredPlan="PRO"
                title="Comparação de Períodos"
                description="Compare períodos (MoM, YoY) e veja sua evolução ao longo do tempo. Disponível no plano PRO."
                workspaceId={workspaceId}
              />
            </DashboardSection>
          )}

          {/* SEÇÃO 5: TOP OFERTAS - Mobile: cards, Desktop: tabela */}
          <DashboardSection title="Top Ofertas">
            <Card className="border-white/5 bg-card">
              <CardContent className="p-0">
                {topOffers.length === 0 ? (
                  <div className="px-4 md:px-6 py-8 md:py-12 text-center">
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Sem dados no período selecionado.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop: tabela */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Oferta</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faturamento</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fee</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lucro</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {topOffers.map((o) => (
                            <tr key={o.offerId} className="transition-colors hover:bg-white/5">
                              <td className="px-6 py-4">
                                <Link
                                  className="font-medium text-foreground hover:text-primary transition-colors"
                                  href={`/app/offers/${o.offerId}/dashboard?${offerQuery}`}
                                >
                                  {o.offerName}
                                </Link>
                              </td>
                              <td className="px-6 py-4 text-foreground">{formatMoney(o.revenue, displayCurrency)}</td>
                              <td className="px-6 py-4 text-foreground">{formatMoney(o.fee, displayCurrency)}</td>
                              <td className={`px-6 py-4 font-semibold ${o.profit >= 0 ? "text-success-vibrant" : "text-destructive-vibrant"}`}>
                                {formatMoney(o.profit, displayCurrency)}
                              </td>
                              <td className="px-6 py-4">
                                <SoftBadge variant={o.roi >= 1 ? "success" : "danger"}>
                                  {(o.roi * 100).toFixed(2)}%
                                </SoftBadge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile: cards */}
                    <div className="md:hidden divide-y divide-white/5">
                      {topOffers.map((o) => (
                        <div key={o.offerId} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              className="font-medium text-sm text-foreground hover:text-primary transition-colors flex-1 min-w-0"
                              href={`/app/offers/${o.offerId}/dashboard?${offerQuery}`}
                            >
                              {o.offerName}
                            </Link>
                            <SoftBadge variant={o.roi >= 1 ? "success" : "danger"} className="shrink-0">
                              {(o.roi * 100).toFixed(2)}%
                            </SoftBadge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Faturamento</div>
                              <div className="font-medium text-foreground">{formatMoney(o.revenue, displayCurrency)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Fee</div>
                              <div className="font-medium text-foreground">{formatMoney(o.fee, displayCurrency)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Lucro</div>
                              <div className={`font-semibold ${o.profit >= 0 ? "text-success-vibrant" : "text-destructive-vibrant"}`}>
                                {formatMoney(o.profit, displayCurrency)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/5 px-4 md:px-6 py-3 md:py-4">
                      <Link
                        href="/app/offers"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Ver todas as ofertas →
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </DashboardSection>
        </>
      )}

      {view === "compare" && (
        <CompareSection
          workspaceId={workspaceId}
          startDate={resolvedRange.startDate}
          endDate={resolvedRange.endDate}
          offersList={offersList}
          searchParams={searchParams}
          currency={displayCurrency}
        />
      )}

      {view === "heatmap" && (
        <HeatmapSection
          workspaceId={workspaceId}
          startDate={resolvedRange.startDate}
          endDate={resolvedRange.endDate}
          offersList={offersList}
          searchParams={searchParams}
          offerQuery={offerQuery}
          currency={displayCurrency}
        />
      )}
    </section>
  );
}

async function CompareSection(props: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
  offersList: Array<{ id: string; name: string }>;
  searchParams: Props["searchParams"];
  currency: CurrencyCode;
}) {
  const params = await props.searchParams;
  const metric =
    params?.metric === "revenue" ||
    params?.metric === "profit" ||
    params?.metric === "roi"
      ? (params.metric as "revenue" | "profit" | "roi")
      : "profit";

  const selectedOfferIdsRaw = (params?.offers ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const fallback = props.offersList.slice(0, 2).map((o) => o.id);
  const selectedOfferIds = selectedOfferIdsRaw.length ? selectedOfferIdsRaw : fallback;

  const comparison = await getWorkspaceComparisonDashboard({
    workspaceId: props.workspaceId,
    offerIds: selectedOfferIds,
    startDate: props.startDate,
    endDate: props.endDate,
    metric
  });

  const colorByOffer = new Map<string, string>();
  for (const p of comparison.points) {
    for (const s of p.series) {
      colorByOffer.set(s.offerId, s.color);
    }
  }

  const lines = selectedOfferIds.map((id) => {
    const offer = props.offersList.find((o) => o.id === id);
    return {
      offerId: id,
      offerName: offer?.name ?? id,
      color: colorByOffer.get(id) ?? "hsl(var(--muted-foreground))"
    };
  });

  const chartData = comparison.points.map((p) => ({
    date: p.date,
    values: Object.fromEntries(p.series.map((s) => [s.offerId, s.value]))
  }));

  return (
    <Card>
      <CardHeader>Comparação entre ofertas</CardHeader>
      <CardContent className="space-y-4">
        <WorkspaceDashboardComparisonControls
          offers={props.offersList}
          initialOfferIds={selectedOfferIds}
          initialMetric={metric}
        />

        {comparison.points.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem dados no período (ou selecione ofertas).
          </p>
        ) : (
          <WorkspaceComparisonChart metric={metric} lines={lines} data={chartData} currency={props.currency} />
        )}
      </CardContent>
    </Card>
  );
}

async function HeatmapSection(props: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
  offersList: Array<{ id: string; name: string }>;
  searchParams: Props["searchParams"];
  offerQuery: string;
  currency: CurrencyCode;
}) {
  const params = await props.searchParams;
  const selectedOfferId = params?.offerId || undefined;

  const calendarData = await getWorkspaceCalendarData({
    workspaceId: props.workspaceId,
    startDate: props.startDate,
    endDate: props.endDate,
    offerId: selectedOfferId
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Calendário de Performance</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Visualize e compare o desempenho das ofertas por dia
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de oferta para modo fallback */}
        <WorkspaceCalendarOfferSelector
          offers={props.offersList}
          selectedOfferId={selectedOfferId}
          offerQuery={props.offerQuery}
        />

        {calendarData.days.length === 0 || calendarData.days.every((d) => d.offers.length === 0) ? (
          <p className="text-sm text-muted-foreground">
            Sem dados no período selecionado.
          </p>
        ) : (
          <WorkspaceCalendarHeatmap
            data={calendarData.days}
            offers={calendarData.offers}
            startDate={calendarData.resolvedRange.startDate}
            endDate={calendarData.resolvedRange.endDate}
            offerQuery={props.offerQuery}
            selectedOfferId={selectedOfferId}
            currency={props.currency}
          />
        )}
      </CardContent>
    </Card>
  );
}


