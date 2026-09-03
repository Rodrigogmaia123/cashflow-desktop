"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, BarChart3, TrendingUp, PieChart } from "lucide-react";

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: {
    id: string;
    name: string;
    description: string | null;
    type: ReportType;
    filters: string;
    visualization: ReportVisualization;
    createdAt: Date;
  };
}

import type { ReportType, ReportVisualization } from "@/lib/prisma-enums";

function getReportTypeLabel(type: ReportType): { label: string; icon: React.ReactNode } {
  switch (type) {
    case "CASHFLOW":
      return {
        label: "Fluxo de Caixa",
        icon: <TrendingUp className="h-4 w-4" />
      };
    case "BY_CATEGORY":
      return {
        label: "Por Categoria",
        icon: <PieChart className="h-4 w-4" />
      };
    case "BY_PERIOD":
      return {
        label: "Por Período",
        icon: <Calendar className="h-4 w-4" />
      };
    default:
      return {
        label: "Relatório Personalizado",
        icon: <FileText className="h-4 w-4" />
      };
  }
}

export function ReportPreviewModal({ open, onOpenChange, report }: ReportPreviewModalProps) {
  const reportType = getReportTypeLabel(report.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{report.name}</DialogTitle>
              <DialogDescription className="mt-1">
                Preview do relatório salvo
              </DialogDescription>
            </div>
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
              🧪 Preview
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações do relatório */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              {reportType.icon}
              <span className="font-medium text-foreground">{reportType.label}</span>
            </div>

            {report.description && (
              <div className="rounded-lg border border-white/5 bg-card-secondary/50 p-4">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {report.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Criado em {new Date(report.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </div>
          </div>

          {/* Preview visual estático */}
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
              <div className="space-y-4">
                {/* Mock de gráfico */}
                <div className="flex items-end justify-between gap-2 h-32">
                  {[65, 80, 45, 90, 70, 85, 95].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary/30"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                
                {/* Mock de métricas */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-lg font-semibold text-foreground">R$ 45.230</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Média</p>
                    <p className="text-lg font-semibold text-foreground">R$ 6.461</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Crescimento</p>
                    <p className="text-lg font-semibold text-green-500">+12.5%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagem sobre interatividade */}
            <div className="rounded-lg border border-primary/20 bg-background/50 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                ✨ Este relatório será totalmente interativo em breve
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Em breve você poderá carregar este relatório automaticamente com dados atualizados,
                aplicar filtros dinâmicos e exportar os resultados.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

