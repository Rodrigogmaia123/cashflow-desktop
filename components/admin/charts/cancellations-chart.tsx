"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CancellationsDataPoint } from "@/app/app/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  data: CancellationsDataPoint[];
};

/**
 * Gráfico de cancelamentos por mês
 * Últimos 6 meses
 */
export function CancellationsChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="text-sm font-medium text-muted-foreground">
          Cancelamentos por Mês (6 meses)
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Sem cancelamentos
            </p>
            <p className="text-xs text-muted-foreground">
              Nenhum cancelamento registrado no período
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

  return (
    <Card>
      <CardHeader className="text-sm font-medium text-muted-foreground">
        Cancelamentos por Mês (6 meses)
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="month"
                tickMargin={8}
                fontSize={11}
                tickFormatter={formatMonth}
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
                    {formatMonth(label as string)}
                  </span>
                )}
                formatter={(value: unknown) => {
                  if (typeof value === "number") {
                    return [
                      <span key="value" className="text-sm font-semibold text-red-400">
                        {value} cancelamento{value !== 1 ? "s" : ""}
                      </span>,
                      "Total",
                    ];
                  }
                  return String(value);
                }}
              />
              <Bar
                dataKey="count"
                name="Cancelamentos"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

