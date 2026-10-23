"use client";

import { useMemo } from "react";
import Link from "next/link";
import { OfferSparkline } from "@/components/offers/offer-sparkline";
import { WeeklyPerformanceDots } from "@/components/offers/weekly-performance-dots";
import { OfferActionsTrigger } from "@/components/offers/offer-actions-trigger";
import type { OfferWithMetrics } from "./actions";
import { Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";
import { calculateROIForPeriod } from "@/lib/domain/offer-metrics-client";
import { getOfferCountryOption } from "@/lib/domain/offer-country";
import { formatMoney } from "@/lib/domain/currency";
import { prefKey, useLocalPref } from "@/lib/ui/local-prefs";

type Props = {
  offers: OfferWithMetrics[];
  canEdit: boolean;
  canDelete: boolean;
  workspaceId: string;
};

type PeriodFilter = "7d" | "30d" | "all";
type StatusFilter = "all" | "ACTIVE" | "PAUSED" | "DEAD";
type SortBy = "worst-roi" | "best-roi" | "name";

type OffersListPrefs = {
  scanMode: boolean;
  periodFilter: PeriodFilter;
  statusFilter: StatusFilter;
  sortBy: SortBy;
};

export function OffersList({ offers, canEdit, canDelete, workspaceId }: Props) {
  const [prefs, setPrefs] = useLocalPref<OffersListPrefs>(prefKey("offers-list", workspaceId), {
    scanMode: false,
    periodFilter: "30d",
    statusFilter: "all",
    sortBy: "worst-roi"
  });
  const { scanMode, periodFilter, statusFilter, sortBy } = prefs;

  // Filtrar e ordenar ofertas
  const filteredAndSorted = useMemo(() => {
    let filtered = [...offers];

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      
      if (sortBy === "worst-roi") {
        const roiA = a.metrics.roiGeneral ?? -Infinity;
        const roiB = b.metrics.roiGeneral ?? -Infinity;
        return roiA - roiB;
      }
      
      if (sortBy === "best-roi") {
        const roiA = a.metrics.roiGeneral ?? -Infinity;
        const roiB = b.metrics.roiGeneral ?? -Infinity;
        return roiB - roiA;
      }
      
      return 0;
    });

    return filtered;
  }, [offers, statusFilter, sortBy]);

  const periodDays = periodFilter === "7d" ? 7 : periodFilter === "30d" ? 30 : 999;

  const selectClass =
    "h-8 rounded-lg border border-white/10 bg-[#0d1612] px-2.5 text-xs text-foreground outline-none [color-scheme:dark] focus:border-[#ac93ff]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={scanMode ? "default" : "outline"}
          size="sm"
          onClick={() => setPrefs((prev) => ({ ...prev, scanMode: !prev.scanMode }))}
          className="text-xs"
        >
          <Scan className="mr-1.5 h-3 w-3" />
          Modo Scan
        </Button>
        <select
          aria-label="Período"
          value={periodFilter}
          onChange={(e) => setPrefs((prev) => ({ ...prev, periodFilter: e.target.value as PeriodFilter }))}
          className={selectClass}
        >
          <option value="7d">7 dias</option>
          <option value="30d">30 dias</option>
          <option value="all">Todo período</option>
        </select>
        <select
          aria-label="Estado"
          value={statusFilter}
          onChange={(e) => setPrefs((prev) => ({ ...prev, statusFilter: e.target.value as StatusFilter }))}
          className={selectClass}
        >
          <option value="all">Todos os estados</option>
          <option value="ACTIVE">Ativas</option>
          <option value="PAUSED">Pausadas</option>
          <option value="DEAD">Inativas</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-[#9ca9a1]">
          Ordenar por
          <select
            aria-label="Ordenar por"
            value={sortBy}
            onChange={(e) => setPrefs((prev) => ({ ...prev, sortBy: e.target.value as SortBy }))}
            className={selectClass}
          >
            <option value="worst-roi">Pior ROI</option>
            <option value="best-roi">Melhor ROI</option>
            <option value="name">Nome</option>
          </select>
        </label>
        <span className="ml-auto text-xs text-[#64706a]">
          {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "oferta" : "ofertas"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#9ca9a1]">
        <span className="inline-flex items-center"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#b4413a]" />&lt; 1,0</span>
        <span className="inline-flex items-center"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#c9a227]" />1,0–1,5</span>
        <span className="inline-flex items-center"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#3da56a]" />&gt; 1,5</span>
        <span className="inline-flex items-center"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#3a463f]" />Sem dado</span>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className={cn(surface, "px-6 py-10 text-center text-sm text-[#9ca9a1]")}>
          Nenhuma oferta encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filteredAndSorted.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              scanMode={scanMode}
              periodDays={periodDays}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function roiCardTone(roi: number | null) {
  if (roi === null) {
    return {
      card: "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]",
      inset: "border-white/10",
      value: "text-[#9ca9a1]",
      spark: "#64706a"
    };
  }
  if (roi < 1) {
    return {
      card: "border-[rgba(180,65,58,0.55)] bg-[linear-gradient(180deg,rgba(180,65,58,0.18),rgba(180,65,58,0.05))]",
      inset: "border-[rgba(180,65,58,0.35)]",
      value: "text-[#f08a7a]",
      spark: "#f08a7a"
    };
  }
  if (roi <= 1.5) {
    return {
      card: "border-[rgba(201,162,39,0.55)] bg-[linear-gradient(180deg,rgba(201,162,39,0.16),rgba(201,162,39,0.04))]",
      inset: "border-[rgba(201,162,39,0.35)]",
      value: "text-[#e3c15a]",
      spark: "#c9a227"
    };
  }
  return {
    card: "border-[rgba(61,165,106,0.55)] bg-[linear-gradient(180deg,rgba(61,165,106,0.18),rgba(61,165,106,0.05))]",
    inset: "border-[rgba(61,165,106,0.35)]",
    value: "text-[#8fd37a]",
    spark: "#3da56a"
  };
}

type OfferCardProps = {
  offer: OfferWithMetrics;
  scanMode: boolean;
  periodDays: number;
  canEdit: boolean;
  canDelete: boolean;
};

function OfferCard({ offer, scanMode, periodDays, canEdit, canDelete }: OfferCardProps) {
  const { metrics } = offer;
  const countryOption = getOfferCountryOption(offer.country);
  
  // Recalcular ROI geral baseado no período selecionado
  const roiGeneral = useMemo(() => {
    if (periodDays <= 7) {
      return metrics.roi7d;
    }
    if (periodDays <= 30) {
      return metrics.roi30d;
    }
    // Para "all" ou períodos maiores, recalcular usando dados brutos
    if (periodDays >= 999) {
      // "all" - usar todos os dados disponíveis
      return calculateROIForPeriod(metrics.performances, 999);
    }
    // Período customizado - recalcular
    return calculateROIForPeriod(metrics.performances, periodDays);
  }, [metrics, periodDays]);

  const tone = roiCardTone(roiGeneral);

  const trendIsPositive = metrics.trendData.length >= 2
    ? metrics.trendData[metrics.trendData.length - 1] >= metrics.trendData[0]
    : true;

  const statusConfig = {
    ACTIVE: { label: "Ativa", color: "border-[rgba(143,211,122,0.45)] text-[#8fd37a]" },
    PAUSED: { label: "Pausada", color: "border-[rgba(201,162,39,0.45)] text-[#c9a227]" },
    DEAD: { label: "Inativa", color: "border-[rgba(240,138,122,0.45)] text-[#f08a7a]" }
  };

  const status = statusConfig[offer.status];

  return (
    <article className={cn("relative rounded-2xl border", tone.card, scanMode ? "p-3" : "p-4")}>
      <Link href={`/app/offers/${offer.id}`} className="block cursor-pointer">
        <div className={scanMode ? "space-y-2" : "space-y-4"}>
          <div className="flex items-center gap-2">
            {countryOption && (
              <span
                className="inline-flex h-[22px] shrink-0 items-center rounded-md border border-white/20 px-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#f3f7f4]"
                title={countryOption.label}
              >
                {countryOption.code}
              </span>
            )}
            <h3 className={cn("min-w-0 flex-1 truncate font-semibold", scanMode ? "text-sm" : "text-[15px]")}>
              {offer.name}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-md border border-white/20 px-2 py-0.5 text-[10px] font-medium text-[#f3f7f4]">
                {offer.currency}
              </span>
              <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium", status.color)}>
                {status.label}
              </span>
              {(canEdit || canDelete) && (
                <OfferActionsTrigger
                  offerId={offer.id}
                  offerName={offer.name}
                  offerStatus={offer.status}
                  offerCountry={offer.country}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              )}
            </div>
          </div>
          {!scanMode && (metrics.roi7d !== null || metrics.roi30d !== null) && (
            <div className="-mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              {metrics.roi7d !== null && <span>7d: {metrics.roi7d.toFixed(2)}x</span>}
              {metrics.roi30d !== null && <span>30d: {metrics.roi30d.toFixed(2)}x</span>}
            </div>
          )}

          {/* ROI Geral (Protagonista) */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {roiGeneral !== null ? (
                <div className={cn("rounded-xl border bg-black/20", tone.inset, scanMode ? "px-2.5 py-2" : "px-3 py-3")}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64706a]">ROI Geral</div>
                  <div className={cn("mt-0.5 font-display font-semibold leading-none", scanMode ? "text-xl" : "text-[28px]", tone.value)}>
                    {roiGeneral.toFixed(2).replace(".", ",")}x
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-[#64706a]">
                  Sem dados suficientes
                </div>
              )}
            </div>
            
            {/* Sparkline (Tendência Visual) */}
            {metrics.trendData.length > 0 && (
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <OfferSparkline
                  data={metrics.trendData}
                  isPositive={trendIsPositive}
                  color={tone.spark}
                />
                {/* Indicadores dos últimos 7 dias */}
                {!scanMode && (
                  <WeeklyPerformanceDots days={metrics.trendData} />
                )}
              </div>
            )}
          </div>

          {/* Faturamento Total (só se existir) */}
          {!scanMode && metrics.totalRevenue !== null && (
            <div className="text-xs text-muted-foreground">
              Faturamento total:{" "}
              <span className="font-medium text-foreground">
                {formatMoney(metrics.totalRevenue, offer.currency)}
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

