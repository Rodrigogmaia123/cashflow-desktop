"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, PieChart, BarChart3, Plus } from "lucide-react";

interface ReportsEmptyStateProps {
  onSaveReport: () => void;
}

export function ReportsEmptyState({ onSaveReport }: ReportsEmptyStateProps) {
  const examples = [
    {
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      title: "Fluxo de caixa mensal",
      description: "Acompanhe entradas e saídas por mês"
    },
    {
      icon: <PieChart className="h-5 w-5 text-primary" />,
      title: "Relatório por categoria",
      description: "Análise detalhada por tipo de transação"
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      title: "Comparativo entre períodos",
      description: "Compare performance de diferentes meses"
    }
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="py-12 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          {/* Ícone e título */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Crie relatórios sob medida para analisar seu negócio do seu jeito
              </h3>
              <p className="text-sm text-muted-foreground">
                Salve configurações de relatórios personalizados e acesse-os rapidamente quando precisar
              </p>
            </div>
          </div>

          {/* Exemplos */}
          <div className="grid gap-3 pt-4">
            {examples.map((example, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-card-secondary/30 text-left"
              >
                <div className="flex-shrink-0 mt-0.5">{example.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{example.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{example.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button
              onClick={onSaveReport}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Salvar relatório atual
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Você já pode salvar configurações. Em breve será possível carregá-los automaticamente.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

