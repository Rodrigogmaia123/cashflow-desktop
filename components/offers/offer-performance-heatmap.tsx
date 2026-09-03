"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import type { HeatmapDay } from "@/lib/analytics/offer-heatmap";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type OfferPerformanceHeatmapProps = {
  data: HeatmapDay[];
  startDate: Date;
  endDate: Date;
  currency: CurrencyCode;
};

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const INTENSITY_COLORS: Record<0 | 1 | 2 | 3 | 4 | 5, string> = {
  0: "bg-[#1F2937]", // Sem dados / negativo
  1: "bg-[#2E2E2E]", // Muito baixo
  2: "bg-[#4ADE80]", // Baixo (verde suave)
  3: "bg-[#A3E635]", // Médio (verde-lima)
  4: "bg-[#C084FC]", // Alto (violeta)
  5: "bg-[#9333EA]" // Muito alto (violeta profundo)
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatROI(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0 = Sunday, 6 = Saturday
}

function generateCalendarDays(startDate: Date, endDate: Date, dataMap: Map<string, HeatmapDay>) {
  const days: Array<{ date: Date; data?: HeatmapDay }> = [];
  
  // Ajustar startDate para começar no domingo da semana
  const start = new Date(startDate);
  const dayOfWeek = getDayOfWeek(start);
  start.setDate(start.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  // Ajustar endDate para terminar no sábado da semana
  const end = new Date(endDate);
  const endDayOfWeek = getDayOfWeek(end);
  const daysToAdd = 6 - endDayOfWeek;
  end.setDate(end.getDate() + daysToAdd);
  end.setHours(23, 59, 59, 999);

  const current = new Date(start);
  while (current <= end) {
    const dateKey = current.toISOString().split("T")[0];
    const data = dataMap.get(dateKey);
    days.push({
      date: new Date(current),
      data
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function Tooltip({
  day,
  x,
  y,
  currency
}: {
  day: HeatmapDay;
  x: number;
  y: number;
  currency: CurrencyCode;
}) {
  return (
    <div
      className="fixed z-50 rounded-lg border bg-card px-4 py-3 shadow-lg backdrop-blur-sm pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y - 10}px`,
        transform: "translate(-50%, -100%)"
      }}
    >
      <div className="space-y-2 text-xs">
        <div className="font-semibold text-foreground">
          📅 {formatDate(day.date)}
        </div>
        <div className="space-y-1 text-muted-foreground">
          <div className="flex items-center justify-between gap-4">
            <span>💰 Receita:</span>
            <span className="font-medium text-foreground">{formatMoney(day.revenue, currency)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>📉 Investimento:</span>
            <span className="font-medium text-foreground">{formatMoney(day.investment, currency)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>📈 Lucro:</span>
            <span className={cn("font-medium", day.profit >= 0 ? "text-accent" : "text-destructive-vibrant")}>
              {formatMoney(day.profit, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>🔥 ROI:</span>
            <span className="font-medium text-foreground">{formatROI(day.roi)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfferPerformanceHeatmap({
  data,
  startDate,
  endDate,
  currency
}: OfferPerformanceHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);

  // Criar mapa para acesso rápido aos dados
  const dataMap = new Map<string, HeatmapDay>();
  for (const day of data) {
    dataMap.set(day.date, day);
  }

  const calendarDays = generateCalendarDays(startDate, endDate, dataMap);

  // Agrupar em semanas
  const weeks: Array<Array<{ date: Date; data?: HeatmapDay }>> = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const handleDayHover = (day: HeatmapDay | undefined, event: React.MouseEvent) => {
    if (!day) {
      setHoveredDay(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredDay({
      day,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleDayLeave = () => {
    setHoveredDay(null);
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg bg-card border border-white/5 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Ainda não há dados suficientes para gerar o mapa de atividade.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Atividade da Oferta
        </h3>
        <p className="text-xs text-muted-foreground">
          Intensidade de lucro por dia
        </p>
      </div>

      <div className="rounded-lg bg-card border border-white/5 p-6">
        {/* Grid do calendário */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header dos dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Semanas */}
            <div className="space-y-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map(({ date, data: dayData }, dayIndex) => {
                    const dateKey = date.toISOString().split("T")[0];
                    const intensity = dayData?.intensity ?? 0;
                    
                    // Verificar se a data está no range (comparar apenas datas, não horas)
                    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                    const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                    const isInRange = dateOnly >= startOnly && dateOnly <= endOnly;

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={cn(
                          "aspect-square rounded-md transition-all duration-200 ease-in-out",
                          "flex items-center justify-center",
                          dayData && "cursor-pointer hover:scale-110 hover:shadow-lg",
                          dayData
                            ? INTENSITY_COLORS[intensity]
                            : "bg-[#1F2937] opacity-30",
                          intensity >= 4 && dayData && "shadow-lg shadow-primary/20"
                        )}
                        onMouseEnter={(e) => handleDayHover(dayData, e)}
                        onMouseLeave={handleDayLeave}
                        title={
                          dayData
                            ? `${formatDate(dateKey)} - Lucro: ${formatMoney(dayData.profit, currency)}`
                            : undefined
                        }
                      >
                        {isInRange && (
                          <span className="text-[10px] font-medium text-white/80">
                            {date.getDate()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">Menos</span>
          <div className="flex gap-1">
            {([0, 1, 2, 3, 4, 5] as const).map((intensity) => (
              <div
                key={intensity}
                className={cn(
                  "w-3 h-3 rounded-sm",
                  INTENSITY_COLORS[intensity]
                )}
                title={
                  intensity === 0
                    ? "Sem dados / Negativo"
                    : intensity === 1
                      ? "Muito baixo"
                      : intensity === 2
                        ? "Baixo"
                        : intensity === 3
                          ? "Médio"
                          : intensity === 4
                            ? "Alto"
                            : "Muito alto"
                }
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">Mais</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <Tooltip
          day={hoveredDay.day}
          x={hoveredDay.x}
          y={hoveredDay.y}
          currency={currency}
        />
      )}
    </div>
  );
}

