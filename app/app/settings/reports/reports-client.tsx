"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteReportAction } from "./actions";
import { FileText, Plus, Trash2, Calendar, Eye, Sparkles } from "lucide-react";
import { ReportPreviewModal } from "./report-preview-modal";
import { ReportsEmptyState } from "./reports-empty-state";
import { SaveReportForm } from "./save-report-form";
import { LoadReportButton } from "./load-report-button";
import type { ReportType, ReportVisualization } from "@/lib/prisma-enums";

interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  type: ReportType;
  filters: string;
  visualization: ReportVisualization;
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    name: string;
  };
}

interface ReportsClientProps {
  initialReports: SavedReport[];
}

function getReportTypeLabel(type: ReportType): { label: string; color: string } {
  switch (type) {
    case "CASHFLOW":
      return { label: "Fluxo de Caixa", color: "bg-green-500/20 text-green-500 border-green-500/30" };
    case "BY_CATEGORY":
      return { label: "Por Categoria", color: "bg-purple-500/20 text-purple-500 border-purple-500/30" };
    case "BY_PERIOD":
      return { label: "Por Período", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" };
    default:
      return { label: "Personalizado", color: "bg-primary/20 text-primary border-primary/30" };
  }
}

function getVisualizationLabel(visualization: ReportVisualization): string {
  switch (visualization) {
    case "TABLE":
      return "Tabela";
    case "LINE_CHART":
      return "Gráfico de Linha";
    case "BAR_CHART":
      return "Gráfico de Barras";
    default:
      return "Tabela";
  }
}

function getPeriodFromFilters(filters: string): string {
  try {
    const parsed = JSON.parse(filters);
    if (parsed.start && parsed.end) {
      const start = new Date(parsed.start).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      const end = new Date(parsed.end).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
      return `${start} - ${end}`;
    }
    if (parsed.range) {
      const rangeLabels: Record<string, string> = {
        "7d": "Últimos 7 dias",
        "30d": "Últimos 30 dias",
        "3m": "Últimos 3 meses",
        "6m": "Últimos 6 meses",
        "12m": "Últimos 12 meses",
      };
      return rangeLabels[parsed.range] || parsed.range;
    }
  } catch {
    // Se não conseguir parsear, retorna padrão
  }
  return "Período não especificado";
}

export function ReportsClient({ initialReports }: ReportsClientProps) {
  const [reports, setReports] = useState(initialReports);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [previewReport, setPreviewReport] = useState<SavedReport | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este relatório?")) {
      return;
    }

    const formData = new FormData();
    formData.append("id", id);

    try {
      await deleteReportAction(formData);
      setReports(reports.filter((r) => r.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao excluir relatório");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner informativo */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-4 px-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">
                ✨ Relatórios Personalizados
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Salve e carregue suas configurações de relatórios favoritas. Os filtros e visualizações serão aplicados automaticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário salvar relatório */}
      {showSaveForm && (
        <SaveReportForm
          onClose={() => setShowSaveForm(false)}
          onSuccess={() => {
            setShowSaveForm(false);
            // Recarrega a página para atualizar a lista
            window.location.reload();
          }}
        />
      )}

      {/* Botão para mostrar formulário */}
      {!showSaveForm && (
        <Button
          onClick={() => setShowSaveForm(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Salvar Relatório Atual
        </Button>
      )}

      {/* Lista de relatórios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Meus Relatórios</h3>
          {reports.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {reports.length} {reports.length === 1 ? "relatório salvo" : "relatórios salvos"}
            </span>
          )}
        </div>
        
        {reports.length === 0 ? (
          <ReportsEmptyState onSaveReport={() => setShowSaveForm(true)} />
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const reportType = getReportTypeLabel(report.type);
              const period = getPeriodFromFilters(report.filters);
              const visualizationLabel = getVisualizationLabel(report.visualization);
              
              return (
                <Card key={report.id} className="transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <CardContent className="py-4 px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {report.name}
                            </p>
                            <Badge className={`${reportType.color} text-xs`}>
                              {reportType.label}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-xs">
                              {visualizationLabel}
                            </Badge>
                          </div>
                          {report.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {report.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{period}</span>
                            </div>
                            <span>•</span>
                            <span>
                              Criado em {new Date(report.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <LoadReportButton reportId={report.id} reportName={report.name} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewReport(report)}
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de preview */}
      {previewReport && (
        <ReportPreviewModal
          open={!!previewReport}
          onOpenChange={(open) => !open && setPreviewReport(null)}
          report={previewReport}
        />
      )}
    </div>
  );
}

