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
import type { EditionsDistributionDataPoint } from "@/app/app/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  data: EditionsDistributionDataPoint[];
};

const EDITION_COLORS: Record<string, string> = {
  pro: "#C7F000",
  pessoal: "#A855F7",
};

function EditionsTooltip(props: TooltipProps<any, any>) {
  const { active, payload } = props;

  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as EditionsDistributionDataPoint;
  if (!point) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="text-[11px] font-medium text-muted-foreground">
        {point.label}
      </div>
      <div className="mt-1 flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Chaves</span>
        <span className="font-medium">{point.count}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-6">
        <span className="text-muted-foreground">Percentual</span>
        <span className="font-medium">{point.percentage}%</span>
      </div>
    </div>
  );
}

export function EditionsDistributionChart({ data }: Props) {
  const hasData = data.some((item) => item.count > 0);

  if (!data || data.length === 0 || !hasData) {
    return (
      <Card>
        <CardHeader className="text-sm font-medium text-muted-foreground">
          Distribuição por edição
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    fill: EDITION_COLORS[item.edition] || "#6B7280",
  }));

  return (
    <Card>
      <CardHeader className="text-sm font-medium text-muted-foreground">
        Distribuição por edição (atual)
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={(props) => <EditionsTooltip {...props} />} />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                stroke="transparent"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.edition}
                    fill={entry.fill}
                    fillOpacity={0.85}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(value) => {
                  const item = data.find((d) => d.label === value);
                  return `${value} (${item?.percentage || 0}%)`;
                }}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
          {data.map((item) => (
            <div key={item.edition} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: EDITION_COLORS[item.edition] }}
              />
              <span className="text-muted-foreground">
                {item.label}: {item.count} chaves
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
