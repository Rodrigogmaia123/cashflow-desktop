"use client";

import { cn } from "@/lib/utils";
import { parseLocalDate, formatBrazilianDate, formatLocalDate } from "@/lib/utils/date-local";
import { useState, useMemo } from "react";
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
function getDayColorByROI(roi: number | null | undefined): string {
  if (roi === null || roi === undefined || Number.isNaN(Number(roi))) {
    return "bg-[#16221c] text-[#9ca9a1]";
  }
  const roiValue = Number(roi);
  if (roiValue < 1) return "bg-[#b4413a] text-[#f3f7f4]";
  if (roiValue <= 1.5) return "bg-[#c9a227] text-[#0a0f0c]";
  return "bg-[#3da56a] text-[#0a0f0c]";
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
    <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-[22px]">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">Atividade mensal</h2>
          <p className="text-xs text-[#64706a]">Intensidade de performance por dia</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPreviousMonth}
            className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-white/10 bg-[#16221c] text-foreground"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="min-w-[110px] text-center font-display text-[13px] font-medium capitalize">
            {MONTHS[currentMonth]} {currentYear}
          </div>
          <button
            onClick={goToNextMonth}
            className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-white/10 bg-[#16221c] text-foreground"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3">

        {!hasDataInMonth ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Nenhuma atividade registrada neste mês
            </p>
          </div>
        ) : (
          <>
            {/* Header dos dias da semana */}
            <div className="mb-1.5 grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-center font-mono text-[11px] font-medium text-[#64706a]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthData.days.map(({ date, value, roi }, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth;
                const hasData = (value !== null && value !== undefined) || (roi !== null && roi !== undefined);
                const isEmpty = !hasData;
                const colorClass = isCurrentMonth ? getDayColorByROI(hasData ? roi : null) : "bg-transparent text-transparent";

                return (
                  <div
                    key={index}
                    className={cn(
                      "aspect-square rounded-lg p-1 font-mono text-[11px] font-medium",
                      colorClass,
                      isCurrentMonth && "cursor-pointer"
                    )}
                    onMouseEnter={(e) => isCurrentMonth && handleDayHover(date, value, roi, e)}
                    onMouseLeave={handleDayLeave}
                    title={isEmpty && isCurrentMonth ? "Sem atividade neste dia" : undefined}
                  >
                    {isCurrentMonth ? date.getDate() : ""}
                  </div>
                );
              })}
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-[18px] text-xs text-[#9ca9a1]">
              <span className="inline-flex items-center"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#b4413a]" />&lt; 1,0</span>
              <span className="inline-flex items-center"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#c9a227]" />1,0–1,5</span>
              <span className="inline-flex items-center"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#3da56a]" />&gt; 1,5</span>
              <span className="inline-flex items-center"><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#16221c]" />Sem dado</span>
            </div>
          </>
        )}
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="pointer-events-none fixed z-50 min-w-[150px] rounded-xl border border-white/15 bg-[#16221c] px-3 py-2.5 font-mono text-xs shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]"
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
    </section>
  );
}

