import { prisma } from "@/lib/db";
import type { MetricLevel } from "./metrics";

export type MetricEventInput = {
  name: string;
  durationMs: number;
  level: MetricLevel;
  success: boolean;
  workspaceId?: string;
  offerId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Sanitiza metadata removendo dados sensíveis e mantendo apenas valores seguros.
 */
function sanitizeMetadata(meta?: Record<string, unknown>): string | null {
  if (!meta || Object.keys(meta).length === 0) {
    return null;
  }

  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    // Apenas permite strings, números, booleans e objetos simples
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      // Não permite valores que possam ser sensíveis
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("token") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("key") ||
        lowerKey.includes("cookie") ||
        lowerKey.includes("header") ||
        lowerKey.includes("authorization")
      ) {
        continue;
      }

      safe[key] = value;
    }
    // Permite objetos simples (arrays, objetos planos) mas não profundos
    else if (Array.isArray(value) && value.length <= 10) {
      const safeArray = value
        .slice(0, 10)
        .filter(
          (v) =>
            typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean"
        );
      if (safeArray.length > 0) {
        safe[key] = safeArray;
      }
    } else if (
      typeof value === "object" &&
      value !== null &&
      Object.keys(value).length <= 5
    ) {
      const safeObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (
          typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean"
        ) {
          safeObj[k] = v;
        }
      }
      if (Object.keys(safeObj).length > 0) {
        safe[key] = safeObj;
      }
    }
  }

  return Object.keys(safe).length > 0 ? JSON.stringify(safe) : null;
}

/**
 * Verifica se a persistência de métricas está habilitada.
 */
function shouldPersistMetrics(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.OBS_METRICS_PERSIST === "true"
  );
}

/**
 * Persiste uma métrica no banco de dados de forma segura e não-bloqueante.
 */
export async function persistMetric(event: MetricEventInput): Promise<void> {
  if (!shouldPersistMetrics()) {
    return;
  }

  try {
    const metadataJson = sanitizeMetadata(event.metadata);

    await prisma.metricEvent.create({
      data: {
        name: event.name,
        durationMs: event.durationMs,
        level: event.level, // String no Prisma, mas validado como MetricLevel no TypeScript
        success: event.success,
        workspaceId: event.workspaceId ?? null,
        offerId: event.offerId ?? null,
        action: event.action ?? null,
        metadata: metadataJson,
      },
    });
  } catch (error) {
    // Falha silenciosa - nunca quebrar o fluxo da aplicação
    // Em dev, logamos para debug
    if (process.env.NODE_ENV === "development") {
      console.error("[METRIC_WRITER] Failed to persist metric:", error);
    }
  }
}
