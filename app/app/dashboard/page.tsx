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
import { PeriodEquation } from "@/components/dashboard/period-equation";
import { MainAlert } from "@/components/dashboard/main-alert";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
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
import type { CurrencyViewMode } from "@/lib/domain/currency-view";
import { formatMoney as formatMoneyCurrency, type CurrencyCode } from "@/lib/domain/currency";

export const dynamic = "force-dynamic";

function formatMoney(value: Decimal | number, currency: CurrencyCode) {
  return formatMoneyCurrency(value, currency);
}

function formatTableAmount(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TopOffersCard({
  offers,
  offerQuery,
  periodDays
}: {
  offers: Array<{ offerId: string; offerName: string; revenue: number; profit: number; roi: number }>;
  offerQuery: string;
  periodDays: number;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-4 md:p-[22px]">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">Top ofertas · {periodDays} dias</h2>
        <Link href="/app/offers" className="text-[13px] font-medium text-[#ac93ff]">
          Ver todas →
        </Link>
      </div>
      {offers.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#64706a]">Sem dados no período selecionado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="pb-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">Oferta</th>
                <th className="pb-2.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">Fatur.</th>
                <th className="pb-2.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">Lucro</th>
                <th className="pb-2.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">ROI</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.offerId}>
                  <td className="py-2 pr-3 text-left">
                    <Link className="text-foreground hover:text-[#ac93ff]" href={`/app/offers/${offer.offerId}/dashboard?${offerQuery}`}>
                      {offer.offerName}
                    </Link>
                  </td>
                  <td className="py-2 text-right font-mono text-[#f3f7f4]">{formatTableAmount(offer.revenue)}</td>
                  <td className={`py-2 text-right font-mono ${offer.profit >= 0 ? "text-[#8fd37a]" : "text-[#f08a7a]"}`}>
                    {formatTableAmount(offer.profit)}
                  </td>
                  <td className="py-2 text-right">
                    <span className="inline-block rounded-full bg-[rgba(172,147,255,0.2)] px-2 py-0.5 font-mono text-[11px] font-medium text-[#c9bcff]">
                      {(offer.roi * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
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

  const allowed = ["today", "7d", "30d", "month", "3m", "6m", "12m"] as const;
  const raw = params?.range;
  const value = (allowed as readonly string[]).includes(raw ?? "") ? (raw as typeof allowed[number]) : "month";
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
    endDate: resolvedRange.endDate,
    currencyView
  });

  return (
    <section className="space-y-6 md:space-y-8">
      {/* HEADER - Mobile: compacto, Desktop: original */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        <div className="space-y-1 md:space-y-2">
          <h1 className="font-display text-[28px] font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-[13px] text-muted-foreground">
            <span className="hidden md:inline">Período </span>
            <span className="font-medium text-foreground">
              {resolvedRange.startDate.toISOString().split("T")[0]} →{" "}
              {resolvedRange.endDate.toISOString().split("T")[0]}
            </span>
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <CurrencyViewSelector current={currencyView} baseCurrency={baseCurrency} />
          <DashboardFilters active={built.activeUi} userPlan={user.plan} workspaceId={workspaceId} />
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
            <div data-tour="dashboard-kpis">
              <PeriodEquation
                revenue={formatMoney(kpis.revenueTotal, displayCurrency)}
                investment={formatMoney(kpis.investmentTotal, displayCurrency)}
                fees={formatMoney(kpis.feeTotal, displayCurrency)}
                profit={formatMoney(kpis.profitTotal, displayCurrency)}
                roi={`${kpis.roiWeighted.mul(100).toFixed(2)}%`}
                sales={kpis.salesTotal}
                profitDeltaPct={
                  comparison.delta.profitPct
                    ? comparison.delta.profitPct.mul(100).toNumber()
                    : null
                }
                roiDeltaPct={
                  comparison.delta.roiPct
                    ? comparison.delta.roiPct.mul(100).toNumber()
                    : null
                }
                topOffer={
                  topOffers[0] && kpis.revenueTotal.greaterThan(0)
                    ? {
                        name: topOffers[0].offerName,
                        revenue: formatMoney(topOffers[0].revenue, displayCurrency),
                        sharePct: (topOffers[0].revenue / kpis.revenueTotal.toNumber()) * 100,
                      }
                    : null
                }
                offersHref={`/app/offers?${offerQuery}`}
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
            <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-4 md:p-[22px]">
                {dailySeries.length === 0 ? (
                  <div className="flex min-h-[288px] flex-col items-center justify-center space-y-3 text-center">
                    <h2 className="font-display text-base font-semibold">Evolução do período</h2>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhum dado para este período
                    </p>
                    <p className="max-w-md text-xs text-muted-foreground">
                      Comece criando uma oferta e adicionando lançamentos de performance diária.
                    </p>
                    <Link href="/app/offers">
                      <Button size="sm" variant="outline">
                        Criar oferta
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <WorkspaceDashboardChartPanel
                    workspaceId={workspaceId}
                    dailySeries={dailySeries}
                    cumulativeSeries={cumulativeSeries}
                    currency={displayCurrency}
                  />
                )}
              </section>
              <TopOffersCard
                offers={topOffers}
                offerQuery={offerQuery}
                periodDays={Math.max(1, Math.round((resolvedRange.endDate.getTime() - resolvedRange.startDate.getTime()) / 86400000) + 1)}
              />
            </div>
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
                currencyView={currencyView}
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
          currencyView={currencyView}
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
          currencyView={currencyView}
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
  currencyView: CurrencyViewMode;
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
    metric,
    currencyView: props.currencyView
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
  currencyView: CurrencyViewMode;
}) {
  const params = await props.searchParams;
  const selectedOfferId = params?.offerId || undefined;

  const calendarData = await getWorkspaceCalendarData({
    workspaceId: props.workspaceId,
    startDate: props.startDate,
    endDate: props.endDate,
    offerId: selectedOfferId,
    currencyView: props.currencyView
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


