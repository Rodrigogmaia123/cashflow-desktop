"use client";

import * as React from "react";
import { formatLocalDate, parseLocalDate, formatShortDate } from "@/lib/utils/date-local";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

type DateRangePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  onApply?: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  maxDays?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function DateRangePicker({
  value,
  onChange,
  onApply,
  minDate,
  maxDate,
  maxDays,
  disabled,
  placeholder = "Selecionar período",
  className
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectionState, setSelectionState] = React.useState<{
    from: Date | null;
    to: Date | null;
    hoverDate: Date | null;
  }>({
    from: value?.from || null,
    to: value?.to || null,
    hoverDate: null
  });

  // Atualiza estado interno quando value externo muda
  React.useEffect(() => {
    if (value) {
      setSelectionState(prev => {
        const prevFromStr = prev.from ? formatLocalDate(prev.from) : null;
        const prevToStr = prev.to ? formatLocalDate(prev.to) : null;
        const newFromStr = value.from ? formatLocalDate(value.from) : null;
        const newToStr = value.to ? formatLocalDate(value.to) : null;

        // Só atualiza se realmente mudou
        if (prevFromStr !== newFromStr || prevToStr !== newToStr) {
          return {
            from: value.from,
            to: value.to,
            hoverDate: null
          };
        }
        return prev;
      });
    } else {
      setSelectionState(prev => {
        if (prev.from || prev.to) {
          return {
            from: null,
            to: null,
            hoverDate: null
          };
        }
        return prev;
      });
    }
  }, [value]);

  // Foca no mês da data inicial se existir
  React.useEffect(() => {
    if (value?.from) {
      setCurrentMonth(new Date(value.from));
    }
  }, [value?.from]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Preencher dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (maxDate && date > maxDate) return true;
    if (minDate && date < minDate) return true;
    // Desabilitar datas futuras por padrão
    if (!maxDate && date > today) return true;
    return false;
  };

  const isDateInRange = (date: Date, from: Date | null, to: Date | null, hoverDate: Date | null): boolean => {
    if (!from) return false;
    
    const dateStr = formatLocalDate(date);
    const fromStr = formatLocalDate(from);
    
    if (to) {
      const toStr = formatLocalDate(to);
      return dateStr >= fromStr && dateStr <= toStr;
    }
    
    if (hoverDate && hoverDate !== from) {
      const hoverStr = formatLocalDate(hoverDate);
      const start = fromStr < hoverStr ? fromStr : hoverStr;
      const end = fromStr > hoverStr ? fromStr : hoverStr;
      return dateStr >= start && dateStr <= end;
    }
    
    return dateStr === fromStr;
  };

  const isDateSelected = (date: Date, from: Date | null, to: Date | null): boolean => {
    if (!from) return false;
    const dateStr = formatLocalDate(date);
    const fromStr = formatLocalDate(from);
    if (to) {
      const toStr = formatLocalDate(to);
      return dateStr === fromStr || dateStr === toStr;
    }
    return dateStr === fromStr;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    const dateStr = formatLocalDate(date);
    const currentFromStr = selectionState.from ? formatLocalDate(selectionState.from) : null;
    const currentToStr = selectionState.to ? formatLocalDate(selectionState.to) : null;

    // Se clicar no mesmo dia que já está selecionado como from (e não tem to), mantém
    if (currentFromStr === dateStr && !currentToStr) {
      return;
    }

    // Se já tem from e to, reseta e começa nova seleção
    if (currentFromStr && currentToStr) {
      const newState = {
        from: date,
        to: null,
        hoverDate: null
      };
      setSelectionState(newState);
      onChange?.(newState);
      return;
    }

    // Se não tem from, define como from
    if (!currentFromStr) {
      const newState = {
        from: date,
        to: null,
        hoverDate: null
      };
      setSelectionState(newState);
      onChange?.(newState);
      return;
    }

    // Se tem from mas não to, define como to (e inverte se necessário)
    if (currentFromStr && !currentToStr) {
      let from = selectionState.from!;
      let to = date;

      // Se to < from, inverte
      if (date < from) {
        [from, to] = [to, from];
      }

      // Validação de maxDays
      if (maxDays) {
        const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (daysDiff > maxDays) {
          // Ajusta to para respeitar maxDays
          to = new Date(from);
          to.setDate(to.getDate() + maxDays - 1);
        }
      }

      const newState = {
        from,
        to,
        hoverDate: null
      };
      setSelectionState(newState);
      onChange?.(newState);
    }
  };

  const handleDateHover = (date: Date | null) => {
    if (!selectionState.from || selectionState.to) return;
    setSelectionState(prev => ({ ...prev, hoverDate: date }));
  };

  const handleApply = () => {
    if (!selectionState.from) return;

    const finalRange: DateRange = {
      from: selectionState.from,
      to: selectionState.to || selectionState.from
    };

    onApply?.(finalRange);
    setOpen(false);
  };

  const handleReset = () => {
    const newState = {
      from: null,
      to: null,
      hoverDate: null
    };
    setSelectionState(newState);
    onChange?.(newState);
  };

  const canApply = Boolean(selectionState.from);

  const displayText = React.useMemo(() => {
    if (!selectionState.from) return placeholder;
    
    if (selectionState.to && formatLocalDate(selectionState.from) !== formatLocalDate(selectionState.to)) {
      return `${formatShortDate(formatLocalDate(selectionState.from))} → ${formatShortDate(formatLocalDate(selectionState.to))}`;
    }
    
    return formatShortDate(formatLocalDate(selectionState.from));
  }, [selectionState.from, selectionState.to, placeholder]);

  const days = getDaysInMonth(currentMonth);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (!maxDate || next <= maxDate) {
      setCurrentMonth(next);
    }
  };

  // Handlers de teclado
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "Enter" && canApply) {
        const finalRange: DateRange = {
          from: selectionState.from!,
          to: selectionState.to || selectionState.from!
        };
        onApply?.(finalRange);
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, canApply, selectionState.from, selectionState.to, onApply]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 justify-start text-left font-normal",
            !selectionState.from && "text-muted-foreground",
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start" 
        side="bottom"
        sideOffset={8}
      >
        <div className="p-4">
          {/* Header do calendário */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={previousMonth}
              disabled={minDate && currentMonth <= new Date(minDate.getFullYear(), minDate.getMonth(), 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold text-sm">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
              disabled={maxDate && currentMonth >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendário */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="h-9" />;
              }

              const isDisabled = isDateDisabled(date);
              const isSelected = isDateSelected(date, selectionState.from, selectionState.to);
              const isInRange = isDateInRange(
                date,
                selectionState.from,
                selectionState.to,
                selectionState.hoverDate
              );
              const isToday = formatLocalDate(date) === formatLocalDate(today);
              const isStart = selectionState.from && formatLocalDate(date) === formatLocalDate(selectionState.from);
              const isEnd = selectionState.to && formatLocalDate(date) === formatLocalDate(selectionState.to);

              return (
                <button
                  key={formatLocalDate(date)}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateClick(date)}
                  onMouseEnter={() => handleDateHover(date)}
                  onMouseLeave={() => handleDateHover(null)}
                  className={cn(
                    "h-9 w-9 text-xs font-medium rounded-lg transition-all duration-150 relative",
                    "hover:bg-accent hover:text-accent-foreground",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                    isToday && !isSelected && "border border-primary/30",
                    isInRange && !isSelected && "bg-primary/10 text-primary",
                    isSelected && "bg-primary text-primary-foreground font-semibold shadow-md z-10",
                    // Bordas arredondadas para início e fim do range
                    isStart && !isEnd && "rounded-l-lg rounded-r-none",
                    isEnd && !isStart && "rounded-r-lg rounded-l-none",
                    isStart && isEnd && "rounded-full",
                    // Quando está no meio do range (não é start nem end)
                    isInRange && !isSelected && !isStart && !isEnd && "rounded-none"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer com botões */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!selectionState.from}
              className="h-8 text-xs"
            >
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!canApply}
              className="h-8 text-xs"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
