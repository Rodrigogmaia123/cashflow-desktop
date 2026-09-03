"use client";

import { useEffect, useMemo, useState } from "react";
import type { OfferDashboardSeriesPoint } from "@/lib/analytics/dashboard";
import { Button } from "@/components/ui/button";
import {
  OfferPerformanceChart,
  type OfferChartMetricId
} from "@/components/charts/offer-performance-chart";
import type { CurrencyCode } from "@/lib/domain/currency";

type Mode = "daily" | "cumulative";

type Props = {
  offerId: string;
  dailySeries: OfferDashboardSeriesPoint[];
  cumulativeSeries: OfferDashboardSeriesPoint[];
  currency: CurrencyCode;
};

type ChartState = {
  mode: Mode;
  focus: OfferChartMetricId;
  shown: Record<OfferChartMetricId, boolean>;
  // ordem de ativação (para limitar a 2-3 métricas visíveis)
  order: OfferChartMetricId[];
};

const MAX_SHOWN = 3;

const defaultState: ChartState = {
  mode: "cumulative",
  focus: "revenue",
  shown: {
    revenue: true,
    profit: false,
    investment: false,
    fee: false,
    roi: false,
    sales: false,
    taxes: false
  },
  order: ["revenue"]
};

const metricButtons: Array<{ id: OfferChartMetricId; label: string }> = [
  { id: "investment", label: "Investimento" },
  { id: "revenue", label: "Faturamento" },
  { id: "fee", label: "Fee" },
  { id: "profit", label: "Lucro" },
  { id: "roi", label: "ROI" },
  { id: "sales", label: "Vendas" },
  { id: "taxes", label: "Taxas" }
];

function storageKey(offerId: string) {
  return `cashflowpro:offer-dashboard:chartState:${offerId}`;
}

export function OfferDashboardChartPanel({
  offerId,
  dailySeries,
  cumulativeSeries,
  currency
}: Props) {
  const [state, setState] = useState<ChartState>(defaultState);

  // opcional: persistir toggles por oferta
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(offerId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ChartState>;
      setState((prev) => ({
        ...prev,
        ...parsed,
        shown: { ...prev.shown, ...(parsed.shown ?? {}) }
      }));
    } catch {
      // ignore
    }
  }, [offerId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(offerId), JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [offerId, state]);

  const data = useMemo(
    () => (state.mode === "daily" ? dailySeries : cumulativeSeries),
    [state.mode, dailySeries, cumulativeSeries]
  );

  function shownCount(shown: ChartState["shown"]) {
    return Object.values(shown).filter(Boolean).length;
  }

  function selectMetric(metric: OfferChartMetricId) {
    setState((prev) => {
      const isShown = prev.shown[metric];
      const count = shownCount(prev.shown);

      // Se já está visível:
      if (isShown) {
        // Se é o foco, um clique "desliga" (se não for a última visível)
        if (prev.focus === metric) {
          if (count <= 1) return prev; // não deixa ficar com 0 métricas

          const nextShown = { ...prev.shown, [metric]: false };
          const nextOrder = prev.order.filter((m) => m !== metric);
          const nextFocus = (nextOrder[nextOrder.length - 1] ?? "revenue") as OfferChartMetricId;

          return {
            ...prev,
            focus: nextFocus,
            shown: nextShown,
            order: nextOrder.length ? nextOrder : [nextFocus]
          };
        }

        // Se está visível mas não é foco, vira foco (sem mudar visibilidade)
        const nextOrder = [...prev.order.filter((m) => m !== metric), metric];
        return { ...prev, focus: metric, order: nextOrder };
      }

      // Se não está visível: habilita e vira foco
      let nextShown = { ...prev.shown, [metric]: true };
      let nextOrder = [...prev.order.filter((m) => prev.shown[m]), metric];

      // Limita a 2–3 métricas visíveis no mesmo gráfico
      while (shownCount(nextShown) > MAX_SHOWN) {
        const candidate = nextOrder.find((m) => m !== metric);
        if (!candidate) break;
        nextShown = { ...nextShown, [candidate]: false };
        nextOrder = nextOrder.filter((m) => m !== candidate);
      }

      return {
        ...prev,
        focus: metric,
        shown: nextShown,
        order: nextOrder
      };
    });
  }

  function reset() {
    setState(defaultState);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={state.mode === "cumulative" ? "default" : "outline"}
            onClick={() => setState((p) => ({ ...p, mode: "cumulative" }))}
          >
            Acumulado
          </Button>
          <Button
            type="button"
            size="sm"
            variant={state.mode === "daily" ? "default" : "outline"}
            onClick={() => setState((p) => ({ ...p, mode: "daily" }))}
          >
            Diário
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {metricButtons.map((m) => (
            <Button
              key={m.id}
              type="button"
              size="sm"
              variant={state.focus === m.id ? "default" : "outline"}
              className={!state.shown[m.id] ? "opacity-60" : undefined}
              onClick={() => selectMetric(m.id)}
              title={
                state.shown[m.id]
                  ? state.focus === m.id
                    ? "Clique para ocultar"
                    : "Clique para focar"
                  : "Clique para exibir e focar"
              }
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <OfferPerformanceChart data={data} shown={state.shown} focus={state.focus} currency={currency} />

      <p className="text-[11px] text-muted-foreground">
        1 métrica em foco (linha forte). As demais visíveis ficam em baixa
        opacidade. O tooltip mostra apenas as métricas visíveis. Nenhum cálculo
        é feito no client.
      </p>
    </div>
  );
}


