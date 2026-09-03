import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { getOfferDashboard } from "@/lib/analytics/dashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OfferDashboardFilters } from "@/components/dashboard/offer-dashboard-filters";
import { OfferDashboardChartPanel } from "@/components/dashboard/offer-dashboard-chart-panel";
import { ExportButton } from "@/components/exports/export-button";
import { exportOfferCSV } from "@/app/app/exports/actions";
import { PeriodComparisonSection } from "@/components/comparison/period-comparison-section";
import { PeriodComparisonControls } from "@/components/comparison/period-comparison-controls";
import { MainAlert } from "@/components/dashboard/main-alert";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { SoftBadge } from "@/components/dashboard/soft-badge";
import { getBusinessAlerts } from "@/lib/analytics/business-alerts";
import { getPeriodComparison } from "@/lib/analytics/period-comparison";
import { getComparisonDateRanges } from "@/lib/analytics/period-comparison-ranges";
import { formatMoney as formatMoneyCurrency, type CurrencyCode } from "@/lib/domain/currency";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ offerId: string }>;
  searchParams?: Promise<{ range?: string; start?: string; end?: string; compareType?: string }>;
};

function formatMoney(value: Decimal | number, currency: CurrencyCode) {
  return formatMoneyCurrency(value, currency);
}


function parseDateInput(value: string) {
  // "YYYY-MM-DD" -> Date (UTC midnight) para evitar shift de timezone
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function buildOfferRangeFromSearchParams(searchParams: Props["searchParams"]): Promise<{
  params: Pick<Parameters<typeof getOfferDashboard>[0], "range" | "startDate" | "endDate">;
  activeUi: Parameters<typeof OfferDashboardFilters>[0]["active"];
}> {
  const params = await searchParams;
  const start = params?.start;
  const end = params?.end;

  if (start && end) {
    const startDate = parseDateInput(start);
    const endDate = parseDateInput(end);
    if (startDate && endDate) {
      return {
        params: { startDate, endDate },
        activeUi: { kind: "absolute", start, end }
      };
    }
  }

  const allowed = ["day", "today", "7d", "30d", "3m", "6m", "12m"] as const;
  const raw = params?.range;
  const valueRaw = (allowed as readonly string[]).includes(raw ?? "")
    ? (raw as typeof allowed[number])
    : "30d";
  const value = valueRaw === "today" ? "day" : valueRaw;

  return {
    params: { range: value },
    activeUi: { kind: "relative", value }
  };
}

export default async function OfferDashboardPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = await requireActiveWorkspaceId();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const offer = await prisma.offer.findFirst({
    where: { id: resolvedParams.offerId, workspaceId }
  });

  if (!offer) notFound();

  const offerCurrency = offer.currency as CurrencyCode;
  const built = await buildOfferRangeFromSearchParams(searchParams);

  const { kpis, dailySeries, cumulativeSeries, resolvedRange } = await getOfferDashboard({
    workspaceId,
    offerId: offer.id,
    ...built.params
  });

  const comparisonType = (resolvedSearchParams?.compareType === "today" || resolvedSearchParams?.compareType === "7d" || resolvedSearchParams?.compareType === "30d") ? resolvedSearchParams.compareType : "30d";
  
  const [alerts, comparison] = await Promise.all([
    getBusinessAlerts({
      workspaceId,
      offerId: offer.id,
      startDate: resolvedRange.startDate,
      endDate: resolvedRange.endDate
    }),
    (async () => {
      try {
        const dateRanges = getComparisonDateRanges(comparisonType);
        return await getPeriodComparison({
          workspaceId,
          offerId: offer.id,
          current: dateRanges.current,
          previous: dateRanges.previous
        });
      } catch {
        return null;
      }
    })()
  ]);

  function getStatusVariant(status: string): "success" | "warning" | "danger" {
    if (status === "ACTIVE") return "success";
    if (status === "PAUSED") return "warning";
    return "danger";
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Dashboard da Oferta
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {offer.name} • <SoftBadge variant={getStatusVariant(offer.status)}>{offer.status}</SoftBadge>
          </p>
          <p className="text-xs text-muted-foreground">
            Centro de decisão da oferta (histórico imutável via snapshots). Período:{" "}
            <span className="font-medium">
              {resolvedRange.startDate.toISOString().split("T")[0]} →{" "}
              {resolvedRange.endDate.toISOString().split("T")[0]}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            action={exportOfferCSV}
            formData={(() => {
              const fd = new FormData();
              fd.append("offerId", offer.id);
              if (built.activeUi.kind === "absolute") {
                fd.append("startDate", built.activeUi.start);
                fd.append("endDate", built.activeUi.end);
              } else {
                fd.append("range", built.activeUi.value);
              }
              return fd;
            })()}
            filename={`oferta-${offer.name}-${resolvedRange.startDate.toISOString().split("T")[0]}-${resolvedRange.endDate.toISOString().split("T")[0]}.csv`}
          />
          <Link href={`/app/offers/${offer.id}`}>
            <Button size="sm" variant="outline">Voltar</Button>
          </Link>
        </div>
      </div>

      <OfferDashboardFilters offerId={offer.id} active={built.activeUi} />

      {/* SEÇÃO 1: KPIs PRINCIPAIS */}
      <DashboardSection>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Investimento"
            value={formatMoney(kpis.investmentTotal, offerCurrency)}
            tooltip="Total do período"
          />
          <MetricCard
            label="Faturamento"
            value={formatMoney(kpis.revenueTotal, offerCurrency)}
            tooltip="Total do período"
          />
          <MetricCard
            label="Vendas"
            value={kpis.salesTotal.toLocaleString("pt-BR")}
            tooltip="Total do período"
          />
          <MetricCard
            label="Fee"
            value={formatMoney(kpis.feeTotal, offerCurrency)}
            tooltip="Somando fees diárias (snapshots)"
          />
          <MetricCard
            label="Lucro"
            value={formatMoney(kpis.profitTotal, offerCurrency)}
            delta={
              comparison?.profit.deltaPct !== undefined
                ? {
                    value: comparison.profit.delta,
                    percentage: comparison.profit.deltaPct
                  }
                : null
            }
            tooltip="Revenue - (Investimento + Fees)"
            className={!kpis.profitTotal.lessThan(0) ? "ring-1 ring-success-vibrant/20" : ""}
          />
          <MetricCard
            label="ROI real"
            value={`${kpis.roiWeighted.mul(100).toFixed(2)}%`}
            delta={
              comparison?.roi.deltaPct !== undefined
                ? {
                    value: comparison.roi.delta,
                    percentage: comparison.roi.deltaPct
                  }
                : null
            }
            tooltip="Receita / (Investimento + Fee)"
            className={!kpis.roiWeighted.lessThan(1) ? "ring-1 ring-primary/20" : ""}
          />
        </div>
      </DashboardSection>

      {/* SEÇÃO 2: ALERTA PRINCIPAL */}
      <DashboardSection>
        <MainAlert alerts={alerts} />
      </DashboardSection>

      {/* SEÇÃO 3: GRÁFICO PRINCIPAL */}
      <DashboardSection title="Evolução do Período">
        <Card className="border-white/5 bg-card">
          <CardContent className="p-6">
            <OfferDashboardChartPanel
              offerId={offer.id}
              dailySeries={dailySeries}
              cumulativeSeries={cumulativeSeries}
              currency={offerCurrency}
            />
          </CardContent>
        </Card>
      </DashboardSection>

      {/* SEÇÃO 4: COMPARAÇÃO DE PERÍODOS */}
      <DashboardSection title="Comparação de Períodos">
        <PeriodComparisonControls
          currentType={comparisonType}
        />
        <PeriodComparisonSection
          workspaceId={workspaceId}
          offerId={offer.id}
          comparisonType={comparisonType}
          currency={offerCurrency}
        />
      </DashboardSection>
    </section>
  );
}


