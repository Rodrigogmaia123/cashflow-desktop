"use client";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Mockup do Dashboard de Performance por Oferta
 * 
 * Mostra:
 * - Comparação entre ofertas
 * - ROI por oferta
 * - Gráficos de barras e linhas
 */
export function OffersPreview() {
  const offers = [
    {
      name: "Curso Avançado",
      revenue: 127450,
      investment: 43280,
      profit: 84170,
      roi: 194.5,
      sales: 51,
    },
    {
      name: "E-book Premium",
      revenue: 48500,
      investment: 15200,
      profit: 33300,
      roi: 219.1,
      sales: 500,
    },
    {
      name: "Curso Básico",
      revenue: 89200,
      investment: 28100,
      profit: 61100,
      roi: 217.8,
      sales: 180,
    },
    {
      name: "Mentoria Individual",
      revenue: 156000,
      investment: 12500,
      profit: 143500,
      roi: 1148.0,
      sales: 12,
    },
  ];

  const maxRevenue = Math.max(...offers.map((o) => o.revenue));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Performance por Oferta
            </h1>
            <p className="text-sm text-muted-foreground">
              Análise comparativa de ROI e lucro
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

        {/* Offers Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {offers.map((offer, index) => (
            <Card key={index} className="border-white/10">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{offer.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {offer.sales} vendas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent">
                      {offer.roi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">ROI</div>
                  </div>
                </div>

                {/* Revenue Bar */}
                <div className="mb-4">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">Receita</span>
                    <span className="font-medium">
                      R${" "}
                      {offer.revenue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-card-hover">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{
                        width: `${(offer.revenue / maxRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">
                      Investimento
                    </div>
                    <div className="text-sm font-semibold text-destructive">
                      R${" "}
                      {offer.investment.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">
                      Lucro
                    </div>
                    <div className="text-sm font-semibold text-success">
                      R${" "}
                      {offer.profit.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Chart */}
        <Card className="border-white/10">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Comparação de ROI</h3>
              <p className="text-xs text-muted-foreground">
                Retorno sobre investimento por oferta
              </p>
            </div>

            <div className="space-y-4">
              {offers.map((offer, index) => (
                <div key={index}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{offer.name}</span>
                    <span className="text-sm font-bold text-accent">
                      {offer.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-card-hover">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60"
                      style={{
                        width: `${(offer.roi / 1200) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue vs Profit Chart */}
        <Card className="border-white/10">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Receita vs Lucro por Oferta
              </h3>
              <p className="text-xs text-muted-foreground">
                Comparação visual de performance
              </p>
            </div>

            <div className="h-64">
              <svg
                viewBox="0 0 800 200"
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                {/* Grid */}
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

                {/* Bars for each offer */}
                {offers.map((offer, i) => {
                  const x = 100 + i * 150;
                  const revenueHeight = (offer.revenue / maxRevenue) * 120;
                  const profitHeight = (offer.profit / maxRevenue) * 120;

                  return (
                    <g key={i}>
                      {/* Revenue bar */}
                      <rect
                        x={x - 30}
                        y={180 - revenueHeight}
                        width="30"
                        height={revenueHeight}
                        fill="hsl(var(--primary))"
                        rx="4"
                      />
                      {/* Profit bar */}
                      <rect
                        x={x}
                        y={180 - profitHeight}
                        width="30"
                        height={profitHeight}
                        fill="hsl(var(--success))"
                        rx="4"
                      />
                      {/* Offer name */}
                      <text
                        x={x - 15}
                        y="195"
                        textAnchor="middle"
                        fill="hsl(var(--muted-foreground))"
                        fontSize="10"
                      >
                        {offer.name.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Legend */}
                <g transform="translate(650, 20)">
                  <rect x="0" y="0" width="12" height="12" fill="hsl(var(--primary))" rx="2" />
                  <text x="18" y="10" fill="hsl(var(--foreground))" fontSize="11">
                    Receita
                  </text>
                  <rect x="0" y="20" width="12" height="12" fill="hsl(var(--success))" rx="2" />
                  <text x="18" y="30" fill="hsl(var(--foreground))" fontSize="11">
                    Lucro
                  </text>
                </g>
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

