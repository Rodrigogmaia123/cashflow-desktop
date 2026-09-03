import { prisma } from "@/lib/db";
import type { MetricLevel } from "./metrics";

export type AlertResult = {
  type: "ERROR_SPIKE" | "SLOW_ACTION";
  name: string;
  count: number;
  windowMinutes: number;
  avgDurationMs?: number;
};

/**
 * Avalia métricas recentes e retorna alertas determinísticos.
 */
export async function evaluateMetricAlerts(): Promise<AlertResult[]> {
  const alerts: AlertResult[] = [];
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  try {
    // Regra 1: ERROR_SPIKE - 3+ erros da mesma métrica em 10 minutos
    const errorSpikes = await prisma.metricEvent.groupBy({
      by: ["name"],
      where: {
        level: "ERROR", // String no Prisma, mas valor válido de MetricLevel
        createdAt: {
          gte: tenMinutesAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    for (const spike of errorSpikes) {
      if (spike._count.id >= 3) {
        alerts.push({
          type: "ERROR_SPIKE",
          name: spike.name,
          count: spike._count.id,
          windowMinutes: 10,
        });
      }
    }

    // Regra 2: SLOW_ACTION - duração média > 1500ms nas últimas 10 execuções
    const recentMetrics = await prisma.metricEvent.findMany({
      where: {
        createdAt: {
          gte: tenMinutesAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1000, // Limite razoável para análise
    });

    // Agrupa por nome e calcula média das últimas execuções
    const metricsByName = new Map<
      string,
      { durations: number[]; count: number }
    >();

    for (const metric of recentMetrics) {
      const existing = metricsByName.get(metric.name) ?? {
        durations: [],
        count: 0,
      };

      // Apenas as últimas 10 execuções por métrica
      if (existing.count < 10) {
        existing.durations.push(metric.durationMs);
        existing.count++;
        metricsByName.set(metric.name, existing);
      }
    }

    for (const [name, data] of metricsByName.entries()) {
      if (data.durations.length >= 10) {
        const avgDuration =
          data.durations.reduce((sum, d) => sum + d, 0) /
          data.durations.length;

        if (avgDuration > 1500) {
          alerts.push({
            type: "SLOW_ACTION",
            name,
            count: data.durations.length,
            windowMinutes: 10,
            avgDurationMs: Math.round(avgDuration),
          });
        }
      }
    }

    return alerts;
  } catch (error) {
    console.error("[ALERTS] Failed to evaluate alerts:", error);
    return [];
  }
}

/**
 * Loga alertas no console (apenas em desenvolvimento).
 */
export function logAlerts(alerts: AlertResult[]): void {
  if (process.env.NODE_ENV !== "development" || alerts.length === 0) {
    return;
  }

  for (const alert of alerts) {
    const color = "\x1b[33m"; // yellow
    const reset = "\x1b[0m";

    if (alert.type === "ERROR_SPIKE") {
      console.log(
        `${color}[ALERT] ERROR_SPIKE — ${alert.name} (${alert.count} errors / ${alert.windowMinutes}m)${reset}`
      );
    } else if (alert.type === "SLOW_ACTION") {
      console.log(
        `${color}[ALERT] SLOW_ACTION — ${alert.name} (avg: ${alert.avgDurationMs}ms / ${alert.count} executions)${reset}`
      );
    }
  }
}
