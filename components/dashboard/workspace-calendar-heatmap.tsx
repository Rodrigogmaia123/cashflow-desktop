"use client";

import { cn } from "@/lib/utils";
import { parseLocalDate, formatBrazilianDate, formatLocalDate } from "@/lib/utils/date-local";
import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { WorkspaceCalendarDay, WorkspaceCalendarDayOffer } from "@/lib/analytics/dashboard";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type WorkspaceCalendarHeatmapProps = {
  data: WorkspaceCalendarDay[];
  offers: Array<{ id: string; name: string }>;
  startDate: Date;
  endDate: Date;
  offerQuery: string;
  selectedOfferId?: string; // Para modo fallback
  currency: CurrencyCode;
};

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro"
];

/**
 * Calcula a cor e estilo do mini-bloco baseado no ROI (Return on Investment)
 * Retorna objeto com classes CSS e estilo inline para opacidade dinâmica
 * - ROI < 1.0 → vermelho (prejuízo)
 * - 1.0 ≤ ROI ≤ 1.5 → amarelo (empate/leve ganho)
 * - ROI > 1.5 → verde (bom desempenho)
 */
function getOfferBlockColorByROI(roi: number): { className: string; style: CSSProperties } {
  const roiValue = Number(roi);
  if (isNaN(roiValue)) {
    return {
      className: "border-neutral-600/50",
      style: { backgroundColor: "rgba(115, 115, 115, 0.3)" }
    };
  }

  // ROI < 1.0 → Vermelho (prejuízo)
  // Intensidade: quanto menor o ROI, mais intenso o vermelho
  // ROI 0.0 → alpha 0.8, ROI 0.99 → alpha 0.4
  if (roiValue < 1.0) {
    const intensity = Math.max(0.3, roiValue); // Evita vermelho invisível
    const alpha = 0.4 + (1.0 - intensity) * 0.4; // 0.4 a 0.8
    return {
      className: "border-red-600/50",
      style: { backgroundColor: `rgba(239, 68, 68, ${alpha})` }
    };
  }

  // 1.0 ≤ ROI ≤ 1.5 → Amarelo (empate/leve ganho)
  // Intensidade: ROI 1.0 → alpha 0.5, ROI 1.5 → alpha 0.9
  if (roiValue <= 1.5) {
    const intensity = (roiValue - 1.0) / 0.5; // 0.0 a 1.0
    const alpha = 0.5 + intensity * 0.4; // 0.5 a 0.9
    return {
      className: "border-yellow-500/50",
      style: { backgroundColor: `rgba(234, 179, 8, ${alpha})` }
    };
  }

  // ROI > 1.5 → Verde (bom desempenho)
  // Intensidade: ROI 1.5 → alpha 0.6, ROI ≥ 2.5 → alpha 1.0 (capado)
  const intensity = Math.min(1.0, (roiValue - 1.5) / 1.0); // 0.0 a 1.0 (capado em 1.0)
  const alpha = 0.6 + intensity * 0.4; // 0.6 a 1.0
  return {
    className: "border-green-600/50",
    style: { backgroundColor: `rgba(34, 197, 94, ${alpha})` }
  };
}

function formatROI(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function WorkspaceCalendarHeatmap({
  data,
  offers,
  startDate,
  endDate,
  offerQuery,
  selectedOfferId,
  currency
}: WorkspaceCalendarHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    // Iniciar com o mês atual ou o mês dos dados mais recentes
    if (data.length > 0) {
      const latestDate = parseLocalDate(data[data.length - 1].date);
      return new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    }
    return new Date();
  });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Criar mapa de dados por data
  const dataMap = useMemo(() => {
    const map = new Map<string, WorkspaceCalendarDayOffer[]>();
    for (const day of data) {
      // Se há uma oferta selecionada, filtrar apenas ela
      if (selectedOfferId) {
        const filteredOffers = day.offers.filter((o) => o.offerId === selectedOfferId);
        if (filteredOffers.length > 0) {
          map.set(day.date, filteredOffers);
        }
      } else {
        map.set(day.date, day.offers);
      }
    }
    return map;
  }, [data, selectedOfferId]);

  // Preparar dias do mês
  const monthData = useMemo(() => {
    const days: Array<{ date: Date; offers: WorkspaceCalendarDayOffer[] }> = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    // Adicionar dias vazios antes do primeiro dia do mês
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: new Date(currentYear, currentMonth, -firstDay + i + 1), offers: [] });
    }

    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dayStr = String(date.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${dayStr}`;
      const dayOffers = dataMap.get(dateKey) ?? [];

      days.push({ date, offers: dayOffers });
    }

    // Adicionar dias vazios após o último dia do mês para completar semanas
    const totalCells = days.length;
    const remainingCells = 42 - totalCells; // 6 semanas * 7 dias
    for (let i = 0; i < remainingCells; i++) {
      const day = daysInMonth + i + 1;
      days.push({ date: new Date(currentYear, currentMonth, day), offers: [] });
    }

    return { days };
  }, [currentYear, currentMonth, dataMap]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Calcular totais do dia
  const getDayTotals = (offers: WorkspaceCalendarDayOffer[]) => {
    const totalLucro = offers.reduce((sum, o) => sum + o.lucro, 0);
    const totalFaturamento = offers.reduce((sum, o) => sum + o.faturamento, 0);
    
    // ROI médio ponderado pelo faturamento
    // ROI ponderado = Σ faturamento_i / Σ (faturamento_i / ROI_i)
    // Mas se ROI_i = 0, precisamos tratar
    let roiPonderado = 0;
    if (totalFaturamento > 0) {
      const totalInvestimento = offers.reduce((sum, o) => {
        if (o.roi > 0) {
          return sum + o.faturamento / o.roi;
        }
        return sum;
      }, 0);
      
      if (totalInvestimento > 0) {
        roiPonderado = totalFaturamento / totalInvestimento;
      }
    }

    return { totalLucro, totalFaturamento, roiPonderado };
  };

  // Verificar se há dados no mês
  const hasDataInMonth = monthData.days.some((d) => d.offers.length > 0);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-zinc-200 mb-0.5">
          Calendário de Performance
        </h3>
        <p className="text-xs text-muted-foreground">
          {selectedOfferId
            ? "Visualização focada em uma oferta"
            : "Comparação entre ofertas por dia"}
        </p>
      </div>

      <div className="rounded-lg bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 border border-white/5 p-3">
        {/* Navegação do mês */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded-sm hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="text-xs font-medium text-zinc-200 capitalize">
            {MONTHS[currentMonth]} de {currentYear}
          </div>

          <button
            onClick={goToNextMonth}
            className="p-1 rounded-sm hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {!hasDataInMonth ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Nenhuma atividade registrada neste mês
            </p>
          </div>
        ) : (
          <>
            {/* Header dos dias da semana */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthData.days.map(({ date, offers: dayOffers }, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth;
                const hasData = dayOffers.length > 0;
                
                // Calcular se está nas primeiras linhas (para tooltip abaixo)
                const weekIndex = Math.floor(index / 7);
                const isInFirstTwoWeeks = weekIndex < 2;

                return (
                  <div
                    key={index}
                    className={cn(
                      "w-full min-h-[3rem] sm:min-h-[3.5rem] rounded-sm",
                      "transition-all duration-200 ease-out",
                      "relative flex flex-col items-start justify-start p-0.5 gap-0.5",
                      "border",
                      hasData && "cursor-pointer hover:ring-1 hover:ring-white/20",
                      !hasData && "cursor-default",
                      !hasData && "bg-neutral-800/30 border-neutral-700/50",
                      !isCurrentMonth && "opacity-30",
                      hasData && "group"
                    )}
                  >
                    {/* Número do dia */}
                    {isCurrentMonth && (
                      <span
                        className={cn(
                          "text-[10px] font-normal leading-none mb-0.5",
                          hasData ? "text-zinc-300" : "text-zinc-400"
                        )}
                      >
                        {date.getDate()}
                      </span>
                    )}

                    {/* Mini-blocos das ofertas */}
                    {hasData && (
                      <div className="flex flex-col gap-0.5 w-full flex-1">
                        {dayOffers.map((offer) => {
                          const colorConfig = getOfferBlockColorByROI(offer.roi);
                          // No modo fallback (uma oferta selecionada), usar altura maior
                          const isFallbackMode = selectedOfferId !== undefined;
                          return (
                            <div
                              key={offer.offerId}
                              className="relative group/block"
                            >
                              <Link
                                href={`/app/offers/${offer.offerId}/dashboard?start=${formatLocalDate(date)}&end=${formatLocalDate(date)}`}
                                className={cn(
                                  "w-full rounded-sm border transition-all duration-150 block",
                                  "hover:scale-[1.05] hover:shadow-sm",
                                  isFallbackMode ? "h-4" : "h-3",
                                  colorConfig.className
                                )}
                                style={colorConfig.style}
                                onClick={(e) => e.stopPropagation()}
                              />
                              
                              {/* Tooltip para mini-bloco */}
                              <div
                                className={cn(
                                  "absolute z-50 rounded-md border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm px-3 py-2 shadow-lg",
                                  "pointer-events-none opacity-0 transition-opacity duration-150",
                                  "group-hover/block:opacity-100",
                                  "whitespace-nowrap",
                                  // Posicionamento: acima por padrão, abaixo nas primeiras semanas
                                  isInFirstTwoWeeks
                                    ? "top-full left-1/2 -translate-x-1/2 mt-2"
                                    : "bottom-full left-1/2 -translate-x-1/2 mb-2"
                                )}
                              >
                                {/* Seta do tooltip */}
                                <div
                                  className={cn(
                                    "absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                                    isInFirstTwoWeeks
                                      ? "bottom-full border-b-4 border-zinc-900"
                                      : "top-full border-t-4 border-zinc-900"
                                  )}
                                />
                                
                                <div className="text-xs space-y-0.5 relative z-10">
                                  <div className="font-medium text-zinc-200">{offer.offerName}</div>
                                  <div className="text-zinc-400">
                                    {formatBrazilianDate(formatLocalDate(date))}
                                  </div>
                                  <div className="text-zinc-400">
                                    ROI:{" "}
                                    <span
                                      className={cn(
                                        "font-medium",
                                        offer.roi >= 1.5
                                          ? "text-green-400"
                                          : offer.roi >= 1.0
                                            ? "text-yellow-400"
                                            : "text-red-400"
                                      )}
                                    >
                                      {formatROI(offer.roi)}
                                    </span>
                                  </div>
                                  <div className="text-zinc-400">
                                    Lucro:{" "}
                                    <span
                                      className={cn(
                                        "font-medium",
                                        offer.lucro > 0
                                          ? "text-green-400"
                                          : offer.lucro < 0
                                            ? "text-red-400"
                                            : "text-yellow-400"
                                      )}
                                    >
                                      {formatMoney(offer.lucro, currency)}
                                    </span>
                                  </div>
                                  <div className="text-zinc-400">
                                    Faturamento: <span className="font-medium">{formatMoney(offer.faturamento, currency)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Tooltip para dia completo (apenas quando há apenas 1 oferta ou quando hover no dia sem hover em blocos) */}
                    {hasData && dayOffers.length === 1 && (
                      <div
                        className={cn(
                          "absolute z-40 rounded-md border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm px-3 py-2 shadow-lg",
                          "pointer-events-none opacity-0 transition-opacity duration-150",
                          "group-hover:opacity-100 group-hover/block:opacity-0",
                          "whitespace-nowrap",
                          // Posicionamento: acima por padrão, abaixo nas primeiras semanas
                          isInFirstTwoWeeks
                            ? "top-full left-1/2 -translate-x-1/2 mt-2"
                            : "bottom-full left-1/2 -translate-x-1/2 mb-2"
                        )}
                      >
                        {/* Seta do tooltip */}
                        <div
                          className={cn(
                            "absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent",
                            isInFirstTwoWeeks
                              ? "bottom-full border-b-4 border-zinc-900"
                              : "top-full border-t-4 border-zinc-900"
                          )}
                        />
                        
                        <div className="text-xs space-y-0.5 relative z-10">
                          <div className="font-medium text-zinc-200">
                            {formatBrazilianDate(formatLocalDate(date))}
                          </div>
                          {(() => {
                            const totals = getDayTotals(dayOffers);
                            return (
                              <>
                                <div className="text-zinc-400">
                                  Total do dia: <span className="font-medium">{formatMoney(totals.totalLucro, currency)}</span>
                                </div>
                                <div className="text-zinc-400">
                                  ROI médio ponderado:{" "}
                                  <span
                                    className={cn(
                                      "font-medium",
                                      totals.roiPonderado >= 1.5
                                        ? "text-green-400"
                                        : totals.roiPonderado >= 1.0
                                          ? "text-yellow-400"
                                          : "text-red-400"
                                    )}
                                  >
                                    {formatROI(totals.roiPonderado)}
                                  </span>
                                </div>
                                <div className="text-zinc-400 text-[10px] pt-1 border-t border-white/10">
                                  1 oferta
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legenda baseada em ROI */}
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm border border-red-600/50"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.6)" }}
                />
                <span className="text-[10px] text-muted-foreground">ROI &lt; 1.0</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm border border-yellow-500/50"
                  style={{ backgroundColor: "rgba(234, 179, 8, 0.7)" }}
                />
                <span className="text-[10px] text-muted-foreground">1.0 ≤ ROI ≤ 1.5</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-sm border border-green-600/50"
                  style={{ backgroundColor: "rgba(34, 197, 94, 0.8)" }}
                />
                <span className="text-[10px] text-muted-foreground">ROI &gt; 1.5</span>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

