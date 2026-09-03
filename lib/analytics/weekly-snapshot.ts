import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getWorkspaceDashboard } from "./dashboard";
import { getWorkspaceCashflow } from "./cashflow";
import { startOfDay, addDaysUTC, endOfDay } from "./date-range-utils";
import { measure } from "@/lib/observability/measure";
import { formatMoney } from "@/lib/domain/currency";

export type WeeklySnapshotItem = {
  icon: string;
  title: string;
  value: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
};

export type WeeklySnapshot = {
  items: WeeklySnapshotItem[];
};

export async function getWeeklySnapshot(params: {
  workspaceId: string;
  includeOfferMetrics?: boolean;
}): Promise<WeeklySnapshot> {
  return measure(
    "analytics.weeklySnapshot",
    async () => {
      const now = new Date();
      const endDate = endOfDay(now);
      const startDate = startOfDay(addDaysUTC(now, -7)); // Última semana

      const previousWeekStart = startOfDay(addDaysUTC(startDate, -7));
      const previousWeekEnd = endOfDay(addDaysUTC(startDate, -1));

      const [currentWeek, previousWeek] = await Promise.all([
        getWorkspaceCashflow({
          workspaceId: params.workspaceId,
          startDate,
          endDate
        }),
        getWorkspaceCashflow({
          workspaceId: params.workspaceId,
          startDate: previousWeekStart,
          endDate: previousWeekEnd
        }).catch(() => null) // Se não houver dados anteriores, ignora
      ]);

      const items: WeeklySnapshotItem[] = [];

      // 1. Receita semanal
      const currentRevenue = currentWeek.kpis.totalRevenue.toNumber();
      const previousRevenue = previousWeek?.kpis.totalRevenue.toNumber() ?? 0;
      const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : null;

      const currency = currentWeek.displayCurrency;

      items.push({
        icon: "💰",
        title: "Receita da semana",
        value: formatMoney(currentRevenue, currency),
        trend: revenueTrend !== null
          ? {
              direction: revenueTrend > 5 ? "up" : revenueTrend < -5 ? "down" : "neutral",
              percentage: Math.abs(revenueTrend)
            }
          : undefined
      });

      // 2. Lucro semanal
      const currentProfit = currentWeek.kpis.netProfit.toNumber();
      const previousProfit = previousWeek?.kpis.netProfit.toNumber() ?? 0;
      const profitTrend = previousProfit !== 0 ? ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100 : null;

      items.push({
        icon: currentProfit >= 0 ? "📈" : "📉",
        title: "Lucro da semana",
        value: formatMoney(currentProfit, currency),
        trend: profitTrend !== null
          ? {
              direction: profitTrend > 5 ? "up" : profitTrend < -5 ? "down" : "neutral",
              percentage: Math.abs(profitTrend)
            }
          : undefined
      });

      // 3. Número de ofertas ativas
      if (params.includeOfferMetrics !== false) {
      const activeOffers = await prisma.offer.count({
        where: {
          workspaceId: params.workspaceId,
          status: "ACTIVE"
        }
      });

      items.push({
        icon: "🎯",
        title: "Ofertas ativas",
        value: `${activeOffers} ${activeOffers === 1 ? "oferta" : "ofertas"}`
      });

      // 4. ROI semanal (usando dashboard)
      const dashboardData = await getWorkspaceDashboard({
        workspaceId: params.workspaceId,
        range: { type: "absolute", startDate, endDate }
      });

      const weeklyRoi = dashboardData.kpis.roiWeighted.toNumber();
      items.push({
        icon: weeklyRoi >= 1 ? "🚀" : "⚠️",
        title: "ROI da semana",
        value: `${(weeklyRoi * 100).toFixed(1)}%`
      });
      }

      return {
        items: items.slice(0, 4) // Máximo 4 items
      };
    },
    {
      workspaceId: params.workspaceId
    }
  );
}
