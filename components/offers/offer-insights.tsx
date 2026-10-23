"use client";

import { cn } from "@/lib/utils";
import type { BusinessAlert } from "@/lib/analytics/business-alerts";

type OfferInsightsProps = {
  alerts: BusinessAlert[];
};

function getAlertStyles(level: BusinessAlert["level"]) {
  switch (level) {
    case "CRITICAL":
    case "WARNING":
      return "border-[rgba(228,193,92,0.5)] bg-[rgba(228,193,92,0.07)]";
    case "INFO":
      return "border-[rgba(172,147,255,0.28)] bg-[rgba(172,147,255,0.06)]";
  }
}

function getBadgeStyles(level: BusinessAlert["level"]) {
  if (level === "INFO") {
    return "border-[rgba(172,147,255,0.5)] text-[#ac93ff]";
  }
  return "border-[rgba(228,193,92,0.6)] text-[#e4c15c]";
}

export function OfferInsights({ alerts }: OfferInsightsProps) {
  // Limitar a 3 insights visíveis
  const visibleAlerts = alerts.slice(0, 3);

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-[22px]">
      <h2 className="font-display text-base font-semibold">Insights inteligentes</h2>
      <p className="mb-3.5 mt-1 text-xs text-[#64706a]">Alertas e comparações automáticas</p>
      <div>
        {visibleAlerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "mt-2.5 flex gap-3 rounded-xl border px-4 py-3 first:mt-0",
              getAlertStyles(alert.level)
            )}
          >
            <span className={cn(
              "grid h-[22px] w-[22px] flex-none place-items-center rounded-full border font-mono text-xs font-semibold",
              getBadgeStyles(alert.level)
            )}>
              {alert.level === "INFO" ? "i" : "!"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-medium text-foreground">{alert.title}</div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[#9ca9a1]">{alert.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

