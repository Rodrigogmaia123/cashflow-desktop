"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MRREvolutionDataPoint } from "@/app/app/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  data: MRREvolutionDataPoint[];
};

/**
 * Gráfico de evolução de MRR (Monthly Recurring Revenue)
 * Últimos 6 meses
 */
export function MRREvolutionChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="text-sm font-medium text-muted-foreground">
          Evolução de MRR (6 meses)
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <svg
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Sem dados disponíveis
            </p>
            <p className="text-xs text-muted-foreground">
              Os dados aparecerão quando houver assinaturas ativas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formata mês para exibição (MMM/YY)
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]}/${year.slice(2)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="text-sm font-medium text-muted-foreground">
        Evolução de MRR (6 meses)
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="month"
                tickMargin={8}
                fontSize={11}
                tickFormatter={formatMonth}
              />
              <YAxis
                tickMargin={8}
                fontSize={11}
                tickFormatter={(v) => `R$ ${Number(v).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                labelFormatter={(label) => (
                  <span className="text-xs font-semibold text-foreground">
                    {formatMonth(label as string)}
                  </span>
                )}
                formatter={(value: unknown) => {
                  if (typeof value === "number") {
                    return [
                      <span key="value" className="text-sm font-semibold text-purple-400">
                        {formatCurrency(value)}
                      </span>,
                      "MRR",
                    ];
                  }
                  return String(value);
                }}
              />
              <Line
                type="monotone"
                dataKey="mrr"
                name="MRR"
                stroke="#A855F7"
                strokeWidth={2.5}
                dot={{ fill: "#A855F7", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

