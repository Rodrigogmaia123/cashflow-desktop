"use client";

import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  Target
} from "lucide-react";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type OfferKPICardsProps = {
  investment: number;
  revenue: number;
  profit: number;
  roi: number;
  currency: CurrencyCode;
};

function formatROI(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

type KPICardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  isPositive?: boolean;
  isNegative?: boolean;
};

function KPICard({ label, value, icon, isPositive, isNegative }: KPICardProps) {
  const valueColor = isPositive
    ? "text-accent"
    : isNegative
      ? "text-destructive-vibrant"
      : "text-foreground";

  return (
    <div className="rounded-lg bg-card border border-white/5 p-4 transition-all hover:border-white/10 hover:bg-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-muted-foreground opacity-60">{icon}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
          </div>
          <div className={cn("text-2xl font-bold tracking-tight", valueColor)}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfferKPICards({
  investment,
  revenue,
  profit,
  roi,
  currency
}: OfferKPICardsProps) {
  const isProfitPositive = profit >= 0;
  const isROIPositive = roi >= 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        label="Investimento"
        value={formatMoney(investment, currency)}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KPICard
        label="Receita"
        value={formatMoney(revenue, currency)}
        icon={<ArrowUpRight className="h-4 w-4" />}
      />
      <KPICard
        label="Lucro"
        value={formatMoney(profit, currency)}
        icon={
          isProfitPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )
        }
        isPositive={isProfitPositive}
        isNegative={!isProfitPositive}
      />
      <KPICard
        label="ROI"
        value={formatROI(roi)}
        icon={<Target className="h-4 w-4" />}
        isPositive={isROIPositive}
      />
    </div>
  );
}
