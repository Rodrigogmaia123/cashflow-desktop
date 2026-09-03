"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { getAnnualPlanConfig, formatMonthlyEquivalent, formatAnnualSavings } from "@/lib/billing/annual";
import type { Plan } from "@/lib/billing/plans";

interface BillingIntervalToggleProps {
  plan: Plan;
  interval: "month" | "year";
  onIntervalChange: (interval: "month" | "year") => void;
  className?: string;
}

/**
 * Toggle para selecionar intervalo de cobrança (mensal vs anual)
 * Destaca desconto anual com badge visual
 */
export function BillingIntervalToggle({
  plan,
  interval,
  onIntervalChange,
  className = "",
}: BillingIntervalToggleProps) {
  const annualConfig = getAnnualPlanConfig(plan);

  // Se for FREE ou não tem plano anual, não mostra toggle
  if (plan === "FREE" || annualConfig.annualPrice === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-2 mb-6 ${className}`}>
      <Button
        variant={interval === "month" ? "default" : "outline"}
        size="sm"
        onClick={() => onIntervalChange("month")}
        className={interval === "month" ? "" : "opacity-70"}
      >
        Mensal
      </Button>

      <Button
        variant={interval === "year" ? "default" : "outline"}
        size="sm"
        onClick={() => onIntervalChange("year")}
        className={`relative ${
          interval === "year"
            ? "bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
            : "opacity-70"
        }`}
      >
        <Sparkles className="w-4 h-4 mr-1.5" />
        Anual
        <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold bg-white/20">
          {annualConfig.discountPercentage}% OFF
        </span>
      </Button>
    </div>
  );
}

/**
 * Badge mostrando economia anual
 */
export function AnnualSavingsBadge({ plan }: { plan: Plan }) {
  const annualConfig = getAnnualPlanConfig(plan);

  if (plan === "FREE" || annualConfig.savingsAmount === 0) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs">
      <Sparkles className="w-3 h-3 text-primary" />
      <span className="text-primary font-medium">
        Economize {formatAnnualSavings(annualConfig.savingsAmount)}/ano
      </span>
    </div>
  );
}

