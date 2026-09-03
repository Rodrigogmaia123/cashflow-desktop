"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { OfferSparkline } from "@/components/offers/offer-sparkline";
import { WeeklyPerformanceDots } from "@/components/offers/weekly-performance-dots";
import { OfferActionsTrigger } from "@/components/offers/offer-actions-trigger";
import { OfferActionsMenuPortal } from "@/components/offers/offer-actions-menu-portal";
import type { OfferWithMetrics } from "./actions";
import { Scan, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateROIForPeriod } from "@/lib/domain/offer-metrics-client";
import { getOfferCountryOption } from "@/lib/domain/offer-country";
import { formatMoney } from "@/lib/domain/currency";

type Props = {
  offers: OfferWithMetrics[];
  canEdit: boolean;
  canDelete: boolean;
};

type PeriodFilter = "7d" | "30d" | "all";
type StatusFilter = "all" | "ACTIVE" | "PAUSED" | "DEAD";
type SortBy = "worst-roi" | "best-roi" | "name";

export function OffersList({ offers, canEdit, canDelete }: Props) {
  const [scanMode, setScanMode] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("30d");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("worst-roi");

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

  return (
    <div className="space-y-4">
      {/* Controles: Modo Scan, Filtros e Ordenação */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Modo Scan */}
          <div className="flex items-center gap-2">
            <Button
              variant={scanMode ? "default" : "outline"}
              size="sm"
              onClick={() => setScanMode(!scanMode)}
              className="text-xs"
            >
              <Scan className="h-3 w-3 mr-1.5" />
              Modo Scan
            </Button>
          </div>

          {/* Filtro de Período */}
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="text-xs rounded-md border px-2 py-1 bg-background"
            >
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="all">Todo período</option>
            </select>
          </div>

          {/* Filtro de Estado */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-xs rounded-md border px-2 py-1 bg-background"
            >
              <option value="all">Todos os estados</option>
              <option value="ACTIVE">Ativas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="DEAD">Inativas</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="text-xs rounded-md border px-2 py-1 bg-background"
            >
              <option value="worst-roi">Pior ROI</option>
              <option value="best-roi">Melhor ROI</option>
              <option value="name">Nome</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid de Cards */}
      {filteredAndSorted.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma oferta encontrada com os filtros selecionados.
          </p>
        </Card>
      ) : (
        <div className={`grid gap-4 ${scanMode ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
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

  const hasData = roiGeneral !== null;
  const isPositive = roiGeneral !== null && roiGeneral >= 1.0;
  
  // Determinar tendência (comparar últimos valores)
  const trendIsPositive = metrics.trendData.length >= 2
    ? metrics.trendData[metrics.trendData.length - 1] >= metrics.trendData[0]
    : true;

  const statusConfig = {
    ACTIVE: { label: "Ativa", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    PAUSED: { label: "Pausada", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    DEAD: { label: "Inativa", color: "bg-red-500/20 text-red-400 border-red-500/30" }
  };

  const status = statusConfig[offer.status];

  return (
    <Card
      className={`transition-all hover:shadow-lg hover:-translate-y-0.5 relative ${
        scanMode ? "p-3" : "p-4 md:p-6"
      }`}
    >
      {/* Menu de Ações (canto superior direito) */}
      {(canEdit || canDelete) && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <OfferActionsTrigger
            offerId={offer.id}
            offerName={offer.name}
            offerStatus={offer.status}
            offerCountry={offer.country}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      )}

      <Link href={`/app/offers/${offer.id}`} className="block cursor-pointer">
        <div className={scanMode ? "space-y-2" : "space-y-4"}>
          {/* Header: Nome e Status */}
          <div className="flex items-start justify-between gap-2 pr-8">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${scanMode ? "text-sm" : "text-base"}`}>
                {countryOption && (
                  <span
                    className="mr-1.5 inline-block align-middle text-[1.05em] leading-none"
                    title={countryOption.label}
                    aria-label={countryOption.label}
                  >
                    {countryOption.flag}
                  </span>
                )}
                {offer.name}
              </h3>
              {/* ROI 7d e 30d (contexto secundário) */}
              {!scanMode && (
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {metrics.roi7d !== null && (
                    <span>7d: {metrics.roi7d.toFixed(2)}x</span>
                  )}
                  {metrics.roi30d !== null && (
                    <span>30d: {metrics.roi30d.toFixed(2)}x</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-white/10 bg-white/5 text-muted-foreground whitespace-nowrap">
                {offer.currency}
              </span>
              {/* Status Badge */}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium border ${status.color} whitespace-nowrap`}
              >
                {status.label}
              </span>
            </div>
          </div>

          {/* ROI Geral (Protagonista) */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {hasData ? (
                <div
                  className={`${scanMode ? "p-2" : "p-4"} rounded-lg border-2 ${
                    isPositive
                      ? "bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/30"
                      : "bg-muted/50 border-muted"
                  }`}
                >
                  <div className={`text-muted-foreground ${scanMode ? "text-[10px]" : "text-xs"} mb-0.5`}>
                    ROI Geral
                  </div>
                  <div className={`font-bold ${scanMode ? "text-lg" : "text-2xl"} ${isPositive ? "text-yellow-400" : "text-foreground"}`}>
                    {roiGeneral.toFixed(2)}x
                  </div>
                </div>
              ) : (
                <div
                  className={`${scanMode ? "p-2" : "p-4"} rounded-lg border border-muted bg-muted/30`}
                >
                  <div className={`text-muted-foreground ${scanMode ? "text-[10px]" : "text-xs"}`}>
                    Sem dados suficientes
                  </div>
                </div>
              )}
            </div>
            
            {/* Sparkline (Tendência Visual) */}
            {metrics.trendData.length > 0 && (
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <OfferSparkline
                  data={metrics.trendData}
                  isPositive={trendIsPositive}
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
    </Card>
  );
}

