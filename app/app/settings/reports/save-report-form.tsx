"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { saveReportAction } from "./actions";
import { Plus, X } from "lucide-react";

interface SaveReportFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type ReportType = "CASHFLOW" | "BY_CATEGORY" | "BY_PERIOD";
type ReportVisualization = "TABLE" | "LINE_CHART" | "BAR_CHART";

export function SaveReportForm({ onClose, onSuccess }: SaveReportFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ReportType>("CASHFLOW");
  const [visualization, setVisualization] = useState<ReportVisualization>("TABLE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Por favor, informe um nome para o relatório");
      return;
    }

    // Captura filtros atuais da URL
    const range = searchParams.get("range");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // Constrói objeto de filtros
    const filters: {
      range?: string;
      start?: string;
      end?: string;
      categories?: string[];
      transactionType?: "income" | "expense" | "both";
    } = {};

    if (range) {
      filters.range = range;
    }

    if (start && end) {
      filters.start = start;
      filters.end = end;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("description", description.trim());
        formData.append("type", type);
        formData.append("filters", JSON.stringify(filters));
        formData.append("visualization", visualization);

        await saveReportAction(formData);
        
        if (onSuccess) {
          onSuccess();
        }
        
        onClose();
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao salvar relatório");
      }
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Salvar Relatório Personalizado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Salve esta configuração para uso futuro
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nome do Relatório <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fluxo mensal sem taxas"
              className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que este relatório mostra..."
              className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-2">
              Tipo de Relatório
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="CASHFLOW">Fluxo de Caixa</option>
              <option value="BY_CATEGORY">Por Categoria</option>
              <option value="BY_PERIOD">Por Período</option>
            </select>
          </div>

          <div>
            <label htmlFor="visualization" className="block text-sm font-medium mb-2">
              Visualização
            </label>
            <select
              id="visualization"
              value={visualization}
              onChange={(e) => setVisualization(e.target.value as ReportVisualization)}
              className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="TABLE">Tabela</option>
              <option value="LINE_CHART">Gráfico de Linha</option>
              <option value="BAR_CHART">Gráfico de Barras</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              {isPending ? "Salvando..." : "Salvar Relatório"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

