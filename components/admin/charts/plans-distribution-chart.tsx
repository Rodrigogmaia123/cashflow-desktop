"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  type TooltipProps,
} from "recharts";
import type { PlansDistributionDataPoint } from "@/app/app/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  data: PlansDistributionDataPoint[];
};

// Cores para cada plano (consistente com design system)
const PLAN_COLORS: Record<string, string> = {
  FREE: "#6B7280", // gray
  PRO: "#C7F000", // primary/yellow
  BUSINESS: "#A855F7", // purple
};

/**
 * Tooltip customizado para o gráfico de distribuição de planos
 */
function PlansTooltip(props: TooltipProps<any, any>) {
  const { active, payload } = props;
  
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload as PlansDistributionDataPoint;
  
  if (!data) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="text-[11px] font-medium text-muted-foreground">
        Plano {data.plan}
      </div>
      <div className="mt-1 flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Usuários</span>
        <span className="font-medium">{data.count}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Percentual</span>
        <span className="font-medium">{data.percentage}%</span>
      </div>
    </div>
  );
}

/**
 * Gráfico de distribuição de planos (donut chart)
 * Snapshot atual
 */
export function PlansDistributionChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="text-sm font-medium text-muted-foreground">
          Distribuição de Planos
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dados formatados para o Recharts
  const chartData = data.map((item) => ({
    ...item,
    fill: PLAN_COLORS[item.plan] || "#6B7280",
  }));

  return (
    <Card>
      <CardHeader className="text-sm font-medium text-muted-foreground">
        Distribuição de Planos (Atual)
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={(props) => <PlansTooltip {...props} />} />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="plan"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                stroke="transparent"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.plan}
                    fill={entry.fill}
                    fillOpacity={0.85}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(value) => {
                  const item = data.find((d) => d.plan === value);
                  return `${value} (${item?.percentage || 0}%)`;
                }}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legenda adicional com contagens */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
          {data.map((item) => (
            <div key={item.plan} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: PLAN_COLORS[item.plan] }}
              />
              <span className="text-muted-foreground">
                {item.plan}: {item.count} usuários
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

