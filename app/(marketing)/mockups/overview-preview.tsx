"use client";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Mockup da Tela de Overview / Resumo Executivo
 * 
 * Mostra:
 * - Insights destacados
 * - Alertas e indicadores positivos
 * - Cards de resumo
 */
export function OverviewPreview() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Resumo Executivo
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da saúde financeira do negócio
          </p>
        </div>

        {/* Alert Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-success/30 bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/20">
                  <span className="text-xl">✓</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-sm font-semibold text-success">
                    Meta de Receita Atingida
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Você ultrapassou a meta do mês em 12,5%. Continue assim!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/20">
                  <span className="text-xl">⚠</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-sm font-semibold text-warning">
                    Atenção: Despesas em Alta
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Despesas de marketing aumentaram 8% este mês. Revise seus
                    investimentos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  Saúde Financeira
                </div>
                <div className="text-2xl font-bold text-success">85%</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-card-hover">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-success to-success-vibrant"
                  style={{ width: "85%" }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Baseado em receita, lucro e ROI
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  Crescimento Mensal
                </div>
                <div className="text-2xl font-bold text-accent">+18,7%</div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Receita</span>
                  <span className="text-success">+12,5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Lucro</span>
                  <span className="text-success">+18,7%</span>
                </div>
                <div className="flex justify-between">
                  <span>ROI</span>
                  <span className="text-success">+5,3%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  Próximas Ações
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">
                    Revisar campanhas de marketing
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-muted-foreground">
                    Analisar performance de ofertas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                  <span className="text-muted-foreground">
                    Otimizar despesas operacionais
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Ticket Médio
              </div>
              <div className="text-xl font-bold">R$ 497,00</div>
              <div className="mt-1 text-xs text-success">+8,2% vs anterior</div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Taxa de Conversão
              </div>
              <div className="text-xl font-bold">3,8%</div>
              <div className="mt-1 text-xs text-success">+0,5% vs anterior</div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                CAC (Custo de Aquisição)
              </div>
              <div className="text-xl font-bold">R$ 42,50</div>
              <div className="mt-1 text-xs text-destructive">+2,1% vs anterior</div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                LTV (Lifetime Value)
              </div>
              <div className="text-xl font-bold">R$ 1.247,00</div>
              <div className="mt-1 text-xs text-success">+12,3% vs anterior</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

