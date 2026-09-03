"use client";

import { cn } from "@/lib/utils";
import { parseLocalDate, formatBrazilianDate, formatLocalDate } from "@/lib/utils/date-local";
import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type ActivityDay = {
  date: string; // YYYY-MM-DD
  value: number; // lucro (para exibição no tooltip)
  roi: number; // ROI (para cálculo de cor)
};

type OfferActivityCalendarProps = {
  data: ActivityDay[];
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
 * Calcula a cor e estilo do heatmap baseado no ROI (Return on Investment)
 * Retorna objeto com classes CSS e estilo inline para opacidade dinâmica
 * - ROI < 1.0 → vermelho (prejuízo)
 * - 1.0 ≤ ROI ≤ 1.5 → amarelo (empate/leve ganho)
 * - ROI > 1.5 → verde (bom desempenho)
 * - Sem dado → cinza neutro
 */
function getDayColorByROI(roi: number | null | undefined): { className: string; style?: CSSProperties } {
  // Sem snapshot = cinza neutro visível
  if (roi === null || roi === undefined) {
    return { className: "bg-neutral-700/70 border-neutral-600/50" };
  }

  // Converter para número e tratar NaN
  const roiValue = Number(roi);
  if (isNaN(roiValue)) {
    return { className: "bg-neutral-700/70 border-neutral-600/50" };
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

// Removido - usar formatBrazilianDate do utilitário

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function OfferActivityCalendar({ data, currency }: OfferActivityCalendarProps) {
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

  // Criar mapa de dados por data (agora incluindo ROI)
  const dataMap = useMemo(() => {
    const map = new Map<string, { value: number; roi: number }>();
    for (const item of data) {
      map.set(item.date, { value: item.value, roi: item.roi });
    }
    return map;
  }, [data]);

  // Preparar dias do mês (cores baseadas em ROI)
  const monthData = useMemo(() => {
    const days: Array<{ date: Date; value: number | null; roi: number | null }> = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    // Adicionar dias vazios antes do primeiro dia do mês
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: new Date(currentYear, currentMonth, -firstDay + i + 1), value: null, roi: null });
    }

    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      // Formatar como YYYY-MM-DD sem conversão de timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dayStr = String(date.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${dayStr}`;
      const dayData = dataMap.get(dateKey);

      // Preservar valor e ROI
      if (dayData !== undefined) {
        days.push({ date, value: dayData.value, roi: dayData.roi });
      } else {
        days.push({ date, value: null, roi: null });
      }
    }

    // Adicionar dias vazios após o último dia do mês para completar semanas
    const totalCells = days.length;
    const remainingCells = 42 - totalCells; // 6 semanas * 7 dias
    for (let i = 0; i < remainingCells; i++) {
      const day = daysInMonth + i + 1;
      days.push({ date: new Date(currentYear, currentMonth, day), value: null, roi: null });
    }

    return { days };
  }, [currentYear, currentMonth, dataMap]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Tooltip state
  const [hoveredDay, setHoveredDay] = useState<{
    date: Date;
    value: number | null; // lucro (para exibição)
    roi: number | null; // ROI (para exibição)
    x: number;
    y: number;
  } | null>(null);

  const handleDayHover = (date: Date, value: number | null, roi: number | null, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredDay({
      date,
      value,
      roi,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleDayLeave = () => {
    setHoveredDay(null);
  };

  // Verificar se há dados no mês
  const hasDataInMonth = monthData.days.some((d) => d.value !== null || d.roi !== null);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-zinc-200 mb-0.5">
          Atividade Mensal
        </h3>
        <p className="text-xs text-muted-foreground">
          Intensidade de performance por dia
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
              {monthData.days.map(({ date, value, roi }, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth;
                
                // Determinar se tem dados (valor ou ROI)
                const hasData = (value !== null && value !== undefined) || (roi !== null && roi !== undefined);
                const isEmpty = !hasData;
                
                // Usar ROI para determinar a cor e estilo
                const colorConfig = getDayColorByROI(roi);
                
                // Determinar se é válido para interação
                const isValidValue = hasData && roi !== null && roi !== undefined && !isNaN(Number(roi));

                return (
                  <div
                    key={index}
                    className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-sm",
                      "transition-all duration-200 ease-out",
                      "relative flex items-start justify-start p-0.5",
                      "border",
                      isValidValue && "cursor-pointer hover:ring-1 hover:ring-white/20 hover:scale-[1.05]",
                      isEmpty && "cursor-pointer hover:bg-neutral-700 hover:border-neutral-500",
                      colorConfig.className,
                      !isCurrentMonth && "opacity-30"
                    )}
                    style={colorConfig.style}
                    onMouseEnter={(e) => handleDayHover(date, value, roi, e)}
                    onMouseLeave={handleDayLeave}
                    title={isEmpty && isCurrentMonth ? "Sem atividade neste dia" : undefined}
                  >
                    {isCurrentMonth && (
                      <span className={cn(
                        "text-[10px] font-normal leading-none",
                        hasData ? "text-zinc-300" : "text-zinc-400"
                      )}>
                        {date.getDate()}
                      </span>
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
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-neutral-700/70 border border-neutral-600/50" />
                <span className="text-[10px] text-muted-foreground">Sem dado</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 rounded-md border border-white/10 bg-zinc-900/95 backdrop-blur-sm px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 10}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          <div className="text-xs space-y-0.5">
            <div className="font-medium text-zinc-200">
              {formatBrazilianDate(formatLocalDate(hoveredDay.date))}
            </div>
            {hoveredDay.value !== null && hoveredDay.value !== undefined && !isNaN(Number(hoveredDay.value)) ? (
              <>
                <div className="text-zinc-400">
                  Lucro:{" "}
                  <span className={cn(
                    "font-medium",
                    Number(hoveredDay.value) > 0 ? "text-green-400" : Number(hoveredDay.value) < 0 ? "text-red-400" : "text-yellow-400"
                  )}>
                    {formatMoney(Number(hoveredDay.value), currency)}
                  </span>
                </div>
                {hoveredDay.roi !== null && hoveredDay.roi !== undefined && !isNaN(Number(hoveredDay.roi)) && (
                  <div className="text-zinc-400">
                    ROI:{" "}
                    <span className={cn(
                      "font-medium",
                      Number(hoveredDay.roi) >= 1.5 ? "text-green-400" : Number(hoveredDay.roi) >= 1.0 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {formatROI(Number(hoveredDay.roi))}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-zinc-500 italic">
                Sem atividade neste dia
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

