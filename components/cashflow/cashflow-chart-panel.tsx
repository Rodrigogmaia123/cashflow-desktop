"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CashflowChart, type CashflowChartPoint } from "@/components/charts/cashflow-chart";
import type { CurrencyCode } from "@/lib/domain/currency";

type Visible = {
  inflow: boolean;
  outflow: boolean;
  balance: boolean;
};

type Props = {
  data: CashflowChartPoint[];
  currency: CurrencyCode;
};

const defaultVisible: Visible = {
  inflow: true,
  outflow: true,
  balance: true
};

export function CashflowChartPanel({ data, currency }: Props) {
  const [visible, setVisible] = useState<Visible>(defaultVisible);
  // Mantém os dados anteriores para animação suave durante transições
  const previousDataRef = useRef<CashflowChartPoint[]>(data);
  const [displayData, setDisplayData] = useState<CashflowChartPoint[]>(data);

  // Atualiza os dados com um pequeno delay para manter a animação do gráfico anterior
  useEffect(() => {
    if (data.length > 0) {
      // Se os dados mudaram, atualiza após um pequeno delay para manter a animação
      const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
      if (dataChanged) {
        previousDataRef.current = displayData;
        // Delay mínimo para permitir que a animação do gráfico anterior continue
        const timer = setTimeout(() => {
          setDisplayData(data);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [data, displayData]);

  const safeVisible = useMemo(() => {
    const any = Object.values(visible).some(Boolean);
    return any ? visible : defaultVisible;
  }, [visible]);

  function toggle(key: keyof Visible) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={safeVisible.inflow ? "accent" : "outline"}
            onClick={() => toggle("inflow")}
          >
            Entradas
          </Button>
          <Button
            type="button"
            size="sm"
            variant={safeVisible.outflow ? "destructive" : "outline"}
            onClick={() => toggle("outflow")}
          >
            Saídas
          </Button>
          <Button
            type="button"
            size="sm"
            variant={safeVisible.balance ? "default" : "outline"}
            onClick={() => toggle("balance")}
          >
            Saldo
          </Button>
        </div>
      </div>

      <div className="transition-opacity duration-300 ease-in-out">
        <CashflowChart data={displayData} visible={safeVisible} currency={currency} />
      </div>
    </div>
  );
}


