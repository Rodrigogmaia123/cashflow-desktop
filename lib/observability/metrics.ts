export type MetricLevel = "INFO" | "WARN" | "ERROR";

export interface PerformanceMetric {
  name: string;
  durationMs: number;
  level: MetricLevel;
  meta?: Record<string, unknown>;
  timestamp: number;
}

export function logMetric(metric: PerformanceMetric) {
  if (process.env.NODE_ENV !== "development") return;

  const color =
    metric.level === "ERROR"
      ? "\x1b[31m"
      : metric.level === "WARN"
      ? "\x1b[33m"
      : "\x1b[36m";

  console.log(
    `${color}[METRIC] ${metric.name} — ${metric.durationMs}ms\x1b[0m`,
    metric.meta ?? {}
  );
}
