import { logMetric } from "./metrics";
import { persistMetric } from "./metric-writer";
import type { MetricLevel } from "./metrics";

function shouldPersistMetrics(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.OBS_METRICS_PERSIST === "true"
  );
}

function extractContext(meta?: Record<string, unknown>): {
  workspaceId?: string;
  offerId?: string;
  action?: string;
} {
  if (!meta) {
    return {};
  }

  return {
    workspaceId:
      typeof meta.workspaceId === "string" ? meta.workspaceId : undefined,
    offerId: typeof meta.offerId === "string" ? meta.offerId : undefined,
    action: typeof meta.action === "string" ? meta.action : undefined,
  };
}

export async function measure<T>(
  name: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;
    const level: MetricLevel =
      duration > 1500 ? "ERROR" : duration > 500 ? "WARN" : "INFO";

    const metricData = {
      name,
      durationMs: Math.round(duration),
      level,
      meta,
      timestamp: Date.now(),
    };

    logMetric(metricData);

    // Persistência não-bloqueante
    if (shouldPersistMetrics()) {
      const context = extractContext(meta);
      void persistMetric({
        name,
        durationMs: Math.round(duration),
        level,
        success: true,
        workspaceId: context.workspaceId,
        offerId: context.offerId,
        action: context.action,
        metadata: meta,
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    const metricData = {
      name,
      durationMs: Math.round(duration),
      level: "ERROR" as MetricLevel,
      meta: {
        ...meta,
        error: error instanceof Error ? error.message : String(error),
      },
      timestamp: Date.now(),
    };

    logMetric(metricData);

    // Persistência não-bloqueante para erros também
    if (shouldPersistMetrics()) {
      const context = extractContext(meta);
      void persistMetric({
        name,
        durationMs: Math.round(duration),
        level: "ERROR",
        success: false,
        workspaceId: context.workspaceId,
        offerId: context.offerId,
        action: context.action,
        metadata: {
          ...meta,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    throw error;
  }
}
