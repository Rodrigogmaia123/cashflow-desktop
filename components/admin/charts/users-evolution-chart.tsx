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
import type { LicensesEvolutionDataPoint } from "@/app/app/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  data: LicensesEvolutionDataPoint[];
};

export function LicensesEvolutionChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="text-sm font-medium text-muted-foreground">
          Evolução de chaves (30 dias)
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              Sem dados disponíveis
            </p>
            <p className="text-xs text-muted-foreground">
              Os dados aparecem quando houver chaves emitidas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split("-");
    return `${day}/${month}`;
  };

  return (
    <Card>
      <CardHeader className="text-sm font-medium text-muted-foreground">
        Evolução de chaves (30 dias)
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
                      <span
                        key="value"
                        className="text-sm font-semibold text-primary"
                      >
                        {value.toLocaleString("pt-BR")} chaves
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
                name="Total de chaves"
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
