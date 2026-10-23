"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

type Props = {
  data: number[];
  isPositive: boolean;
  className?: string;
  color?: string;
};

/**
 * Sparkline compacta para mostrar tendência de ROI
 * Verde para positivo, vermelho para negativo
 */
export function OfferSparkline({ data, isPositive, className, color }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className={`h-8 w-16 flex items-center justify-center ${className || ""}`}>
        <span className="text-[10px] text-muted-foreground">—</span>
      </div>
    );
  }

  // Normalizar dados para o gráfico (0-100 scale)
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const normalizedData = data.map((value) => ({
    value: ((value - min) / range) * 100
  }));

  const stroke = color ?? (isPositive ? "#c7f156" : "#f08a7a");

  return (
    <div className={`h-8 w-16 ${className || ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalizedData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

