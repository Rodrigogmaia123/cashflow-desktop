"use client";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Mockup do Dashboard Principal
 * 
 * Mostra:
 * - KPI cards (Revenue, Expenses, Profit, ROI)
 * - Line chart de cashflow
 * - Design premium e profissional
 */
export function DashboardPreview() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Visão Geral
            </h1>
            <p className="text-sm text-muted-foreground">
              Resumo financeiro do período
            </p>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg border border-white/10 bg-card px-3 py-1.5 text-sm text-foreground">
              <option>Últimos 30 dias</option>
              <option>Últimos 7 dias</option>
              <option>Este mês</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Receita Total
              </div>
              <div className="mb-1 text-2xl font-bold">R$ 127.450,00</div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-success">+12,5%</span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Despesas
              </div>
              <div className="mb-1 text-2xl font-bold">R$ 43.280,00</div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-destructive">-3,2%</span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Lucro Líquido
              </div>
              <div className="mb-1 text-2xl font-bold text-success">
                R$ 84.170,00
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-success">+18,7%</span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                ROI Médio
              </div>
              <div className="mb-1 text-2xl font-bold text-accent">
                194,5%
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-success">+5,3%</span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Card */}
        <Card className="border-white/10">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Fluxo de Caixa</h3>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Entradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Saídas</span>
                </div>
              </div>
            </div>

            {/* Mock Chart */}
            <div className="h-64 w-full">
              <svg
                viewBox="0 0 800 200"
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={40 + i * 40}
                    x2="800"
                    y2={40 + i * 40}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}

                {/* Income area */}
                <path
                  d="M 0,180 L 80,160 L 160,140 L 240,120 L 320,100 L 400,90 L 480,85 L 560,80 L 640,75 L 720,70 L 800,65 L 800,200 L 0,200 Z"
                  fill="url(#incomeGradient)"
                  opacity="0.3"
                />

                {/* Income line */}
                <path
                  d="M 0,180 L 80,160 L 160,140 L 240,120 L 320,100 L 400,90 L 480,85 L 560,80 L 640,75 L 720,70 L 800,65"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Expense area */}
                <path
                  d="M 0,200 L 80,195 L 160,190 L 240,185 L 320,175 L 400,165 L 480,160 L 560,155 L 640,150 L 720,145 L 800,140 L 800,200 L 0,200 Z"
                  fill="url(#expenseGradient)"
                  opacity="0.3"
                />

                {/* Expense line */}
                <path
                  d="M 0,200 L 80,195 L 160,190 L 240,185 L 320,175 L 400,165 L 480,160 L 560,155 L 640,150 L 720,145 L 800,140"
                  fill="none"
                  stroke="hsl(var(--destructive))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Data points */}
                {[
                  { x: 0, y: 180 },
                  { x: 80, y: 160 },
                  { x: 160, y: 140 },
                  { x: 240, y: 120 },
                  { x: 320, y: 100 },
                  { x: 400, y: 90 },
                  { x: 480, y: 85 },
                  { x: 560, y: 80 },
                  { x: 640, y: 75 },
                  { x: 720, y: 70 },
                  { x: 800, y: 65 },
                ].map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="hsl(var(--primary))"
                  />
                ))}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>01/01</span>
              <span>05/01</span>
              <span>10/01</span>
              <span>15/01</span>
              <span>20/01</span>
              <span>25/01</span>
              <span>30/01</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

