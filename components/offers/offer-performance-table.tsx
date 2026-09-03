"use client";

import { cn } from "@/lib/utils";
import { formatShortDate, parseLocalDate } from "@/lib/utils/date-local";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type DailyPerformance = {
  id: string;
  date: string;
  investment: number;
  revenue: number;
  sales: number;
  checkoutPercentage: number;
  gatewayFeePerSale: number;
  taxPercentage: number;
  comment?: string | null;
  offerId: string;
  // Métricas já calculadas no servidor
  profit: number;
  roi: number;
  ticketAverage: number;
};

type OfferPerformanceTableProps = {
  performances: DailyPerformance[];
  currency: CurrencyCode;
  canEdit?: boolean;
  canDelete?: boolean;
  editFormComponent?: React.ComponentType<{ perf: DailyPerformance }>;
  deleteButtonComponent?: React.ComponentType<{ perf: DailyPerformance }>;
};

// Removido - usar formatShortDate do utilitário

function formatROI(roi: number): string {
  return `${(roi * 100).toFixed(2)}%`;
}

function getROIColor(roi: number): string {
  if (roi >= 1.5) return "bg-accent/20 border-accent/40";
  if (roi >= 1.0) return "bg-accent/10 border-accent/30";
  if (roi >= 0.5) return "bg-warning/10 border-warning/30";
  return "bg-destructive-soft/30 border-destructive-vibrant/30";
}

function getProfitColor(profit: number): string {
  if (profit > 0) return "text-accent";
  if (profit < 0) return "text-destructive-vibrant";
  return "text-foreground";
}

// Componente de indicador de anotação
function NoteIndicator({ comment }: { comment: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; side: 'right' | 'left' } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar se está montado (para SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePosition = () => {
    if (!dotRef.current) return null;
    
    const rect = dotRef.current.getBoundingClientRect();
    const tooltipWidth = 240;
    const gap = 8;
    const viewportPadding = 8;
    
    // Posição vertical: centro da bolinha
    const top = rect.top + rect.height / 2;
    
    // Posição horizontal preferencial: à direita da bolinha
    let left = rect.right + gap;
    let side: 'right' | 'left' = 'right';
    
    // Verificar se cabe à direita
    const viewportWidth = window.innerWidth;
    if (left + tooltipWidth > viewportWidth - viewportPadding) {
      // Não cabe à direita, colocar à esquerda
      left = rect.left - tooltipWidth - gap;
      side = 'left';
      
      // Se também não cabe à esquerda, ajustar para não sair da viewport
      if (left < viewportPadding) {
        left = viewportPadding;
      }
    }
    
    // Garantir que não saia da viewport pela direita
    if (left + tooltipWidth > viewportWidth - viewportPadding) {
      left = viewportWidth - tooltipWidth - viewportPadding;
    }
    
    return { top, left, side };
  };

  // Atualizar posição no scroll e resize
  useEffect(() => {
    if (!isHovered || !mounted || !dotRef.current) return;

    const updatePosition = () => {
      const position = calculatePosition();
      if (position) {
        setTooltipPosition(position);
      }
    };

    // Atualizar imediatamente
    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isHovered, mounted]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    const position = calculatePosition();
    if (position) {
      setTooltipPosition(position);
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Delay de 120ms para evitar flicker
      timeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 120);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltip(false);
    setTooltipPosition(null);
    // Limpar timeout se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Suporte para mobile (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    handleMouseEnter();
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    // Delay para permitir que o usuário veja o tooltip
    setTimeout(() => {
      setIsHovered(false);
      setTooltipPosition(null);
    }, 2000);
  };

  // Verificar se o texto é longo (mais de ~200 caracteres ou mais de 5 linhas)
  const textLines = comment.split('\n');
  const isLongText = comment.length > 200;
  const hasManyLines = textLines.length > 5;
  const showMoreIndicator = isLongText || hasManyLines;

  // Renderizar tooltip via portal
  const tooltipContent = mounted && showTooltip && tooltipPosition && (
    createPortal(
      <div
        className="fixed z-[9999] bg-card border border-white/10 shadow-card backdrop-blur-sm pointer-events-none transition-opacity duration-150"
        style={{
          width: "240px",
          minWidth: "180px",
          borderRadius: "10px",
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: "translateY(-50%)",
          opacity: showTooltip ? 1 : 0,
        }}
      >
        <div className="px-3 pt-2.5 pb-2.5">
          {/* Título */}
          <div className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-2">
            Anotação
          </div>
          
          {/* Texto com limite de 5 linhas */}
          <div
            className="text-xs text-foreground leading-relaxed break-words"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
              maxHeight: "calc(1.5rem * 5)"
            }}
          >
            {comment}
          </div>
          
          {/* Indicador de texto completo (quando truncado) */}
          {showMoreIndicator && (
            <>
              <div className="h-px bg-white/5 my-2 mt-2.5" />
              <div className="text-[10px] text-muted-foreground/50 italic pt-0.5">
                Clique na linha para ver mais
              </div>
            </>
          )}
        </div>
        
        {/* Seta do tooltip */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2"
          style={{
            width: 0,
            height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            ...(tooltipPosition.side === 'right'
              ? {
                  left: "-6px",
                  borderRight: "6px solid hsl(var(--card))"
                }
              : {
                  right: "-6px",
                  borderLeft: "6px solid hsl(var(--card))"
                })
          }}
        />
      </div>,
      document.body
    )
  );

  return (
    <>
      <div
        className="relative inline-flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bolinha indicadora */}
        <div
          ref={dotRef}
          className="w-1.5 h-1.5 rounded-full bg-accent cursor-pointer transition-opacity hover:opacity-80 flex-shrink-0"
          style={{
            boxShadow: "0 0 3px rgba(199, 240, 0, 0.5), 0 0 6px rgba(199, 240, 0, 0.25)"
          }}
          aria-label="Anotação disponível"
        />
      </div>
      {tooltipContent}
    </>
  );
}

function PerformanceRow({
  perf,
  currency,
  canEdit,
  canDelete,
  EditFormComponent,
  DeleteButtonComponent
}: {
  perf: DailyPerformance;
  currency: CurrencyCode;
  canEdit?: boolean;
  canDelete?: boolean;
  EditFormComponent?: React.ComponentType<{ perf: DailyPerformance }>;
  DeleteButtonComponent?: React.ComponentType<{ perf: DailyPerformance }>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const profit = perf.profit;
  const roi = perf.roi;
  const ticketAverage = perf.ticketAverage;
  const hasActions = canEdit || canDelete || perf.comment;
  const hasNote = perf.comment && perf.comment.trim().length > 0;

  return (
    <>
      <tr
        className="transition-colors hover:bg-card-hover/50 group cursor-pointer"
        onClick={() => hasActions && setIsExpanded(!isExpanded)}
      >
        <td className="px-4 py-3 text-sm font-medium text-foreground">
          <div className="flex items-center gap-1.5">
            {formatShortDate(perf.date)}
            {hasNote && (
              <NoteIndicator comment={perf.comment!} />
            )}
            {hasActions && (
              <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-right text-foreground">
          {formatMoney(perf.investment, currency)}
        </td>
        <td className="px-4 py-3 text-sm text-right text-foreground">
          {formatMoney(perf.revenue, currency)}
        </td>
        <td className="px-4 py-3 text-sm text-right text-muted-foreground">
          {perf.sales.toLocaleString("pt-BR")}
        </td>
        <td className={cn("px-4 py-3 text-sm text-right font-medium", getProfitColor(profit))}>
          {formatMoney(profit, currency)}
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end">
            <div
              className={cn(
                "inline-flex items-center justify-center px-2.5 py-1 rounded border text-xs font-semibold",
                getROIColor(roi),
                roi >= 1.0 ? "text-accent" : roi >= 0.5 ? "text-warning" : "text-destructive-vibrant"
              )}
            >
              {formatROI(roi)}
            </div>
          </div>
        </td>
      </tr>
      {isExpanded && hasActions && (
        <tr>
          <td colSpan={6} className="px-4 py-4 bg-card-hover/30 border-t border-white/5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">Ticket Médio</div>
                  <div className="font-medium">{formatMoney(ticketAverage, currency)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Taxas (snapshot)</div>
                  <div className="font-medium">
                    Checkout {(perf.checkoutPercentage * 100).toFixed(2)}% • Gateway {formatMoney(perf.gatewayFeePerSale, currency)} • Imposto {(perf.taxPercentage * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
              
              {perf.comment && perf.comment.trim().length > 0 && (
                <div className="rounded-md border border-white/5 bg-card/50 px-3 py-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Comentário</div>
                  <div className="text-xs text-foreground whitespace-pre-wrap">{perf.comment}</div>
                </div>
              )}

              {(canEdit || canDelete) && (
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  {canEdit && EditFormComponent && <EditFormComponent perf={perf} />}
                  {canDelete && DeleteButtonComponent && <DeleteButtonComponent perf={perf} />}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type PeriodFilter = "7d" | "15d" | "30d" | "all";
type ResultFilter = "all" | "profit" | "loss";
type SortBy = "date-desc" | "profit-desc" | "roi-desc";

export function OfferPerformanceTable({
  performances,
  currency,
  canEdit,
  canDelete,
  editFormComponent: EditFormComponent,
  deleteButtonComponent: DeleteButtonComponent
}: OfferPerformanceTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("30d");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");

  // Filtrar e ordenar performances
  const filteredPerformances = useMemo(() => {
    let filtered = [...performances];

    // Filtro de período
    if (periodFilter !== "all") {
      const days = periodFilter === "7d" ? 7 : periodFilter === "15d" ? 15 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter((perf) => {
        const perfDate = parseLocalDate(perf.date);
        return perfDate >= cutoffDate;
      });
    }

    // Filtro de resultado
    if (resultFilter === "profit") {
      filtered = filtered.filter((perf) => perf.profit > 0);
    } else if (resultFilter === "loss") {
      filtered = filtered.filter((perf) => perf.profit <= 0);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "profit-desc":
          return b.profit - a.profit;
        case "roi-desc":
          return b.roi - a.roi;
        case "date-desc":
        default:
          // Ordenar por data (mais recente primeiro)
          const dateA = parseLocalDate(a.date);
          const dateB = parseLocalDate(b.date);
          return dateB.getTime() - dateA.getTime();
      }
    });

    return filtered;
  }, [performances, periodFilter, resultFilter, sortBy]);

  if (performances.length === 0) {
    return (
      <div className="rounded-lg bg-card border border-white/5 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum lançamento diário ainda para esta oferta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com título e botão de colapsar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Histórico Operacional
          </h3>
          <p className="text-xs text-muted-foreground">
            Performance diária com análise de ROI e lucro. Clique em uma linha para ver detalhes e ações.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expandir tabela" : "Colapsar tabela"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filtros */}
      {!isCollapsed && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/5">
          {/* Filtro de Período */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className="h-8 rounded-md border border-white/10 bg-card px-3 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="15d">Últimos 15 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Todos</option>
          </select>

          {/* Filtro de Resultado */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
            className="h-8 rounded-md border border-white/10 bg-card px-3 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Todos</option>
            <option value="profit">Apenas lucro</option>
            <option value="loss">Apenas prejuízo</option>
          </select>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-8 rounded-md border border-white/10 bg-card px-3 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="date-desc">Data ↓</option>
            <option value="profit-desc">Maior lucro</option>
            <option value="roi-desc">Maior ROI</option>
          </select>
        </div>
      )}

      {/* Tabela */}
      {!isCollapsed && (
        <div className="rounded-lg bg-card border border-white/5 overflow-hidden transition-all duration-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-card-hover/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Investimento
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Receita
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vendas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lucro
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPerformances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhum registro encontrado para os filtros selecionados.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPerformances.map((perf) => (
                    <PerformanceRow
                      key={perf.id}
                      perf={perf}
                      currency={currency}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      EditFormComponent={EditFormComponent}
                      DeleteButtonComponent={DeleteButtonComponent}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

