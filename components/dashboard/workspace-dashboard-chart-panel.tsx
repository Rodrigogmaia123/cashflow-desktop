"use client";

import { useEffect, useMemo, useState } from "react";
import {
  OfferPerformanceChart,
  type OfferChartMetricId,
  type PerformanceChartPoint
} from "@/components/charts/offer-performance-chart";
import type { CurrencyCode } from "@/lib/domain/currency";
import { cn } from "@/lib/utils";

type Mode = "daily" | "cumulative";

type ChartState = {
  mode: Mode;
  focus: OfferChartMetricId;
  shown: Record<OfferChartMetricId, boolean>;
  order: OfferChartMetricId[];
};

type Props = {
  workspaceId: string;
  dailySeries: PerformanceChartPoint[];
  cumulativeSeries: PerformanceChartPoint[];
  currency: CurrencyCode;
};

const MAX_SHOWN = 3;

const defaultState: ChartState = {
  mode: "daily",
  focus: "revenue",
  shown: {
    revenue: true,
    investment: true,
    profit: false,
    fee: false,
    roi: false,
    sales: false,
    taxes: false
  },
  order: ["revenue", "investment"]
};

const metricButtons: Array<{ id: OfferChartMetricId; label: string; color: string }> = [
  { id: "revenue", label: "Faturamento", color: "bg-[#c7f156]" },
  { id: "investment", label: "Investimento", color: "bg-[#ac93ff]" },
  { id: "profit", label: "Lucro", color: "bg-[#8fd37a]" },
  { id: "fee", label: "Fee", color: "bg-[#f0b35a]" },
  { id: "roi", label: "ROI", color: "bg-[#6aa7ff]" },
  { id: "sales", label: "Vendas", color: "bg-[#f08a7a]" },
  { id: "taxes", label: "Taxas", color: "bg-[#c9a227]" }
];

function storageKey(workspaceId: string) {
  return `cashflowpro:workspace-dashboard:chartState:${workspaceId}`;
}

export function WorkspaceDashboardChartPanel({
  workspaceId,
  dailySeries,
  cumulativeSeries,
  currency
}: Props) {
  const [state, setState] = useState<ChartState>(defaultState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(workspaceId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ChartState>;
      if (!parsed.shown || !parsed.order) return;
      setState((prev) => ({
        ...prev,
        ...parsed,
        shown: { ...prev.shown, ...parsed.shown },
        order: parsed.order?.length ? parsed.order : prev.order
      }));
    } catch {
      // ignore
    }
  }, [workspaceId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [workspaceId, state]);

  const data = useMemo(
    () => (state.mode === "daily" ? dailySeries : cumulativeSeries),
    [state.mode, dailySeries, cumulativeSeries]
  );

  const visibleCount = Object.values(state.shown).filter(Boolean).length;
  const pair =
    visibleCount === 2 && state.shown.revenue && state.shown.investment;

  function selectMetric(metric: OfferChartMetricId) {
    setState((prev) => {
      const isShown = prev.shown[metric];
      const count = Object.values(prev.shown).filter(Boolean).length;

      if (isShown) {
        if (prev.focus === metric) {
          if (count <= 1) return prev;
          const nextShown = { ...prev.shown, [metric]: false };
          const nextOrder = prev.order.filter((item) => item !== metric);
          const nextFocus = (nextOrder[nextOrder.length - 1] ?? "revenue") as OfferChartMetricId;
          return { ...prev, focus: nextFocus, shown: nextShown, order: nextOrder.length ? nextOrder : [nextFocus] };
        }
        return { ...prev, focus: metric, order: [...prev.order.filter((item) => item !== metric), metric] };
      }

      let nextShown = { ...prev.shown, [metric]: true };
      let nextOrder = [...prev.order.filter((item) => prev.shown[item]), metric];
      while (Object.values(nextShown).filter(Boolean).length > MAX_SHOWN) {
        const candidate = nextOrder.find((item) => item !== metric);
        if (!candidate) break;
        nextShown = { ...nextShown, [candidate]: false };
        nextOrder = nextOrder.filter((item) => item !== candidate);
      }
      return { ...prev, focus: metric, shown: nextShown, order: nextOrder };
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold">Evolução do período</h2>
        <div className="flex rounded-[10px] border border-white/10 bg-[#121c17] p-[3px]">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, mode: "cumulative" }))}
            className={state.mode === "cumulative"
              ? "rounded-md bg-[#25332b] px-2.5 py-1 text-[13px] font-medium text-foreground"
              : "px-2.5 py-1 text-[13px] font-medium text-[#9ca9a1]"}
          >
            Acumulado
          </button>
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, mode: "daily" }))}
            className={state.mode === "daily"
              ? "rounded-md bg-[#25332b] px-2.5 py-1 text-[13px] font-medium text-foreground"
              : "px-2.5 py-1 text-[13px] font-medium text-[#9ca9a1]"}
          >
            Diário
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {metricButtons.map((metric) => {
          const active = state.shown[metric.id];
          const focused = state.focus === metric.id;
          return (
            <button
              key={metric.id}
              type="button"
              onClick={() => selectMetric(metric.id)}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
                active
                  ? "border-white/15 bg-white/[0.06] text-foreground"
                  : "border-white/10 text-[#64706a]",
                focused && "ring-1 ring-[#ac93ff]"
              )}
              title={active ? (focused ? "Clique para ocultar" : "Clique para focar") : "Clique para exibir"}
            >
              <i className={cn("mr-1.5 inline-block h-[9px] w-[9px] rounded-[3px]", metric.color, !active && "opacity-40")} />
              {metric.label}
            </button>
          );
        })}
      </div>

      <OfferPerformanceChart
        data={data}
        shown={state.shown}
        focus={state.focus}
        currency={currency}
        variant={pair ? "pair" : "default"}
      />
    </div>
  );
}
