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
import type { UsersEvolutionDataPoint } from "@/app/app/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  data: UsersEvolutionDataPoint[];
};

/**
 * Gráfico de evolução de usuários (últimos 30 dias)
 * Mostra total acumulado e novos usuários por dia
 */
export function UsersEvolutionChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="text-sm font-medium text-muted-foreground">
          Evolução de Usuários (30 dias)
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Sem dados disponíveis
            </p>
            <p className="text-xs text-muted-foreground">
              Os dados aparecerão quando houver usuários cadastrados
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formata data para exibição (DD/MM)
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}`;
  };

  return (
    <Card>
      <CardHeader className="text-sm font-medium text-muted-foreground">
        Evolução de Usuários (30 dias)
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
                dataKey="date"
                tickMargin={8}
                fontSize={11}
                tickFormatter={formatDate}
              />
              <YAxis tickMargin={8} fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  padding: "12px",
                }}
                labelFormatter={(label) => (
                  <span className="text-xs font-semibold text-foreground">
                    {formatDate(label as string)}
                  </span>
                )}
                formatter={(value: unknown) => {
                  if (typeof value === "number") {
                    return [
                      <span key="value" className="text-sm font-semibold text-primary">
                        {value.toLocaleString("pt-BR")} usuários
                      </span>,
                      "Total",
                    ];
                  }
                  return String(value);
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total de Usuários"
                stroke="#C7F000"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

