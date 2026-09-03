import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import type { BusinessAlert } from "./business-alerts";
import { getWorkspaceDashboard } from "./dashboard";
import { getWorkspaceCashflow } from "./cashflow";
import { startOfDay, addDaysUTC, endOfDay } from "./date-range-utils";
import { measure } from "@/lib/observability/measure";

export type BusinessHealthScore = {
  score: number; // 0-100
  label: "Saudável" | "Atenção" | "Risco";
  description: string;
};

function calculateScore(params: {
  netProfit: Decimal;
  roi: Decimal;
  alerts: BusinessAlert[];
  revenueTrend: number | null; // delta percentual
}): BusinessHealthScore {
  let score = 100;

  // Penaliza lucro negativo (peso alto)
  if (params.netProfit.lessThan(0)) {
    score -= 40;
  } else if (params.netProfit.lessThan(100)) {
    // Lucro muito baixo
    score -= 10;
  }

  // Penaliza ROI baixo
  const roiValue = params.roi.toNumber();
  if (roiValue < 1) {
    // ROI negativo ou abaixo de 100%
    score -= 30;
  } else if (roiValue < 1.2) {
    // ROI entre 100% e 120%
    score -= 10;
  }

  // Penaliza alertas críticos
  const criticalCount = params.alerts.filter((a) => a.level === "CRITICAL").length;
  score -= criticalCount * 20;

  // Penaliza alertas de warning
  const warningCount = params.alerts.filter((a) => a.level === "WARNING").length;
  score -= warningCount * 5;

  // Bonus/penalidade por tendência de receita
  if (params.revenueTrend !== null) {
    if (params.revenueTrend < -20) {
      // Queda acentuada
      score -= 15;
    } else if (params.revenueTrend < -10) {
      // Queda moderada
      score -= 5;
    } else if (params.revenueTrend > 10) {
      // Crescimento
      score += 5;
    }
  }

  // Garante que o score está entre 0 e 100
  score = Math.max(0, Math.min(100, score));

  // Determina label baseado no score
  let label: "Saudável" | "Atenção" | "Risco";
  let description: string;

  if (score >= 70) {
    label = "Saudável";
    description = "Seu negócio está em boa saúde financeira. Continue monitorando.";
  } else if (score >= 40) {
    label = "Atenção";
    description = "Alguns indicadores precisam de atenção. Revise seus processos.";
  } else {
    label = "Risco";
    description = "Atenção urgente necessária. Considere revisar estratégia e custos.";
  }

  return {
    score,
    label,
    description
  };
}

export async function getBusinessHealthScore(params: {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
}): Promise<BusinessHealthScore> {
  return measure(
    "analytics.businessHealthScore",
    async () => {
      const startDate = startOfDay(params.startDate);
      const endDate = endOfDay(params.endDate);

      // Buscar dados em paralelo
      const [dashboardData, cashflowData] = await Promise.all([
        getWorkspaceDashboard({
          workspaceId: params.workspaceId,
          range: { type: "absolute", startDate, endDate }
        }),
        getWorkspaceCashflow({
          workspaceId: params.workspaceId,
          startDate,
          endDate
        })
      ]);

      // Calcular tendência de receita (comparação com período anterior)
      const previousRange = {
        startDate: startOfDay(addDaysUTC(startDate, -30)),
        endDate: endOfDay(addDaysUTC(startDate, -1))
      };

      let revenueTrend: number | null = null;
      try {
        const previousCashflow = await getWorkspaceCashflow({
          workspaceId: params.workspaceId,
          startDate: previousRange.startDate,
          endDate: previousRange.endDate
        });

        const currentRevenue = cashflowData.kpis.totalRevenue.toNumber();
        const previousRevenue = previousCashflow.kpis.totalRevenue.toNumber();

        if (previousRevenue > 0) {
          revenueTrend = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        }
      } catch (error) {
        // Ignora erros ao calcular tendência
        void error;
      }

      // Buscar alertas (reutilizando a lógica existente)
      const { getBusinessAlerts } = await import("./business-alerts");
      let alerts: Awaited<ReturnType<typeof getBusinessAlerts>> = [];
      try {
        alerts = await getBusinessAlerts({
          workspaceId: params.workspaceId,
          startDate,
          endDate
        });
      } catch (error) {
        // Ignora erros ao buscar alertas
        void error;
      }

      return calculateScore({
        netProfit: cashflowData.kpis.netProfit,
        roi: dashboardData.kpis.roiWeighted,
        alerts,
        revenueTrend
      });
    },
    {
      workspaceId: params.workspaceId
    }
  );
}
