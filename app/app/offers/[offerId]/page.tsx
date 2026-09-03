import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserWorkspaceRole } from "@/lib/rbac/workspace-permissions";
import { hasPermission } from "@/lib/rbac/permissions";
import { calculateDailyMetrics } from "@/lib/domain/finance";
import { DailyPerformanceForm } from "./daily-performance-form";
import { WeeklyCloseForm } from "@/components/offers/weekly-close-form";
import { getOfferDashboard } from "@/lib/analytics/dashboard";
import { getBusinessAlerts } from "@/lib/analytics/business-alerts";
import { OfferHeroHeader } from "@/components/offers/offer-hero-header";
import { OfferKPICards } from "@/components/offers/offer-kpi-cards";
import { OfferHeroChart } from "@/components/offers/offer-hero-chart";
import { OfferInsights } from "@/components/offers/offer-insights";
import { OfferPerformanceTable } from "@/components/offers/offer-performance-table";
import { OfferActivityCalendar } from "@/components/offers/offer-activity-calendar";
import { PerformanceTableEditForm, PerformanceTableDeleteButton } from "@/components/offers/performance-table-actions";
import { UpdateFeeProfileForm } from "./update-fee-profile-form";
import { getOfferDailyHeatmap } from "@/lib/analytics/offer-heatmap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type OfferPageProps = {
  params: Promise<{
    offerId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function OfferDetailPage({ params }: OfferPageProps) {
  const workspaceId = await requireActiveWorkspaceId();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const offer = await prisma.offer.findFirst({
    where: {
      id: resolvedParams.offerId,
      workspaceId
    },
    include: {
      feeProfile: true
    }
  });

  if (!offer) {
    notFound();
  }

  // Buscar primeira e última data para período total
  const dateRange = await prisma.dailyPerformance.aggregate({
    where: { offerId: offer.id },
    _min: { date: true },
    _max: { date: true }
  });

  const startDate = dateRange._min.date || new Date();
  const endDate = dateRange._max.date || new Date();

  const [userRole, dashboardData, alerts, performances, heatmapData] = await Promise.all([
    getUserWorkspaceRole(workspaceId),
    // Usar período total (todas as datas disponíveis)
    dateRange._min.date && dateRange._max.date
      ? getOfferDashboard({
          workspaceId,
          offerId: offer.id,
          startDate,
          endDate
        })
      : // Se não houver dados, usar range padrão para evitar erro
        getOfferDashboard({
          workspaceId,
          offerId: offer.id,
          range: "30d"
        }),
    (async () => {
      try {
        if (!dateRange._min.date || !dateRange._max.date) {
          return [];
        }
        return await getBusinessAlerts({
          workspaceId,
          offerId: offer.id,
          startDate,
          endDate
        });
      } catch {
        return [];
      }
    })(),
    prisma.dailyPerformance.findMany({
      where: { offerId: offer.id },
      orderBy: { date: "desc" }
    }),
    // Buscar dados do heatmap
    dateRange._min.date && dateRange._max.date
      ? getOfferDailyHeatmap({
          workspaceId,
          offerId: offer.id,
          startDate,
          endDate
        })
      : Promise.resolve([])
  ]);

  // Verifica permissões usando RBAC
  const canCreate = userRole ? hasPermission(userRole, "create") : false;
  const canEdit = userRole ? hasPermission(userRole, "edit") : false;
  const canDelete = userRole ? hasPermission(userRole, "delete") : false;
  const canManageSettings = userRole ? hasPermission(userRole, "manage_settings") : false;

  // Buscar perfis de taxa disponíveis
  const feeProfiles = await prisma.feeProfile.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true }
  });

  // Serializar performances e calcular métricas no servidor
  const serializedPerformances = performances.map((p) => {
    const metrics = calculateDailyMetrics({
      investment: p.investment,
      revenue: p.revenue,
      sales: p.sales,
      checkoutPercentage: p.checkoutPercentageSnapshot,
      gatewayFeePerSale: p.gatewayFeePerSaleSnapshot,
      taxPercentage: p.taxPercentageSnapshot
    });

    return {
      id: p.id,
      sales: p.sales,
      comment: p.comment ?? null,
      date: p.date.toISOString().split("T")[0],
      investment: p.investment.toNumber(),
      revenue: p.revenue.toNumber(),
      checkoutPercentage: p.checkoutPercentageSnapshot.toNumber(),
      gatewayFeePerSale: p.gatewayFeePerSaleSnapshot.toNumber(),
      taxPercentage: p.taxPercentageSnapshot.toNumber(),
      offerId: offer.id,
      // Métricas calculadas no servidor
      profit: metrics.profit.toNumber(),
      roi: metrics.roi.toNumber(),
      ticketAverage: metrics.ticketAverage.toNumber()
    };
  });

  // Preparar dados do gráfico (investimento vs retorno)
  const chartData = dashboardData.dailySeries.map((point) => ({
    date: point.date,
    investment: point.investment,
    revenue: point.revenue
  }));

  // Preparar dados do calendário (incluindo lucro e ROI)
  const calendarData = heatmapData.map((day) => ({
    date: day.date,
    value: day.profit, // Lucro para exibição no tooltip
    roi: day.roi // ROI para cálculo de cor
  }));

  return (
    <section className="space-y-8">
      {/* 1️⃣ HEADER DA OFERTA (Hero silencioso) */}
      <div className="space-y-4">
        <OfferHeroHeader
          name={offer.name}
          status={offer.status}
          period={{
            startDate: dashboardData.resolvedRange.startDate,
            endDate: dashboardData.resolvedRange.endDate
          }}
          currentROI={dashboardData.kpis.roiWeighted.toNumber()}
        />

        {/* Configuração de Perfil de Taxa */}
        {canManageSettings && feeProfiles.length > 0 && (
          <Card className="border-white/5 bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Perfil de Taxa Ativo
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Perfil aplicado a novos registros. Lançamentos existentes mantêm suas taxas congeladas (snapshots).
                  </p>
                </div>
                {offer.feeProfile && (
                  <div className="text-xs text-muted-foreground">
                    Perfil atual: <span className="font-medium text-foreground">{offer.feeProfile.name}</span> —
                    Checkout:{" "}
                    <span className="font-medium">
                      {(offer.feeProfile.checkoutPercentage.toNumber() * 100).toFixed(2)}%
                    </span>
                    , Gateway:{" "}
                    <span className="font-medium">
                      {formatMoney(
                        offer.feeProfile.gatewayFeePerSale,
                        (offer.feeProfile.currency ?? offer.currency) as CurrencyCode
                      )}
                    </span>
                    , Imposto:{" "}
                    <span className="font-medium">
                      {(offer.feeProfile.taxPercentage.toNumber() * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
                <UpdateFeeProfileForm
                  offerId={offer.id}
                  feeProfiles={feeProfiles}
                  currentFeeProfileId={offer.feeProfileId}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 2️⃣ KPIs PRINCIPAIS */}
      <OfferKPICards
        investment={dashboardData.kpis.investmentTotal.toNumber()}
        revenue={dashboardData.kpis.revenueTotal.toNumber()}
        profit={dashboardData.kpis.profitTotal.toNumber()}
        roi={dashboardData.kpis.roiWeighted.toNumber()}
        currency={offer.currency as CurrencyCode}
      />

      {/* 3️⃣ GRÁFICO PRINCIPAL (Hero Chart) */}
      <OfferHeroChart data={chartData} currency={offer.currency as CurrencyCode} />

      {/* 4️⃣ INSIGHTS SECUNDÁRIOS */}
      {alerts.length > 0 && (
        <div className="rounded-lg bg-card border border-white/5 p-6">
          <OfferInsights alerts={alerts} />
        </div>
      )}

      {/* 5️⃣ CALENDÁRIO DE ATIVIDADE MENSAL */}
      {dateRange._min.date && dateRange._max.date && (
        <OfferActivityCalendar data={calendarData} currency={offer.currency as CurrencyCode} />
      )}

      {/* 6️⃣ HISTÓRICO / TABELA OPERACIONAL */}
      <OfferPerformanceTable
        performances={serializedPerformances}
        currency={offer.currency as CurrencyCode}
        canEdit={canEdit}
        canDelete={canDelete}
        editFormComponent={canEdit ? PerformanceTableEditForm : undefined}
        deleteButtonComponent={canDelete ? PerformanceTableDeleteButton : undefined}
      />

      {/* Formulário de lançamento (mantido para funcionalidade) */}
      {canCreate && (
        <Card className="border-white/5 bg-card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-1">
                  Lançar performance diária
                </h2>
                <p className="text-xs text-muted-foreground">
                  Adicione novos lançamentos para atualizar os dados da oferta
                </p>
              </div>
              <DailyPerformanceForm offerId={offer.id} currency={offer.currency} />
            </div>
          </CardContent>
        </Card>
      )}

      {canCreate && (
        <Card className="border-white/5 bg-card">
          <CardContent className="pt-6">
            <WeeklyCloseForm offerId={offer.id} currency={offer.currency} />
          </CardContent>
        </Card>
      )}

      {/* Link para dashboard completo */}
      <div className="text-center">
        <Link href={`/app/offers/${offer.id}/dashboard`}>
          <Button variant="outline" size="sm">
            Ver Dashboard Completo
          </Button>
        </Link>
      </div>
    </section>
  );
}


