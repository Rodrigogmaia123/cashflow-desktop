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
import type { RevocationsDataPoint } from "@/app/app/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  data: RevocationsDataPoint[];
};

const MONTH_NAMES = [
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

export function RevocationsChart({ data }: Props) {
  const hasRevocations = data.some((point) => point.count > 0);

  if (!data || data.length === 0 || !hasRevocations) {
    return (
      <Card>
        <CardHeader className="text-sm font-medium text-muted-foreground">
          Revogações por mês (6 meses)
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              Sem revogações
            </p>
            <p className="text-xs text-muted-foreground">
              Nenhuma chave revogada no período
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const monthIndex = parseInt(month, 10) - 1;
    return `${MONTH_NAMES[monthIndex]}/${year.slice(2)}`;
  };

  return (
    <Card>
      <CardHeader className="text-sm font-medium text-muted-foreground">
        Revogações por mês (6 meses)
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
              <YAxis tickMargin={8} fontSize={11} allowDecimals={false} />
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
                      <span
                        key="value"
                        className="text-sm font-semibold text-red-400"
                      >
                        {value} revoga{value !== 1 ? "ções" : "ção"}
                      </span>,
                      "Total",
                    ];
                  }
                  return String(value);
                }}
              />
              <Bar
                dataKey="count"
                name="Revogações"
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
