"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ComparisonPeriodType = "today" | "7d" | "30d";

type PeriodComparisonToggleProps = {
  value: ComparisonPeriodType;
  onChange: (value: ComparisonPeriodType) => void;
};

const OPTIONS: Array<{ value: ComparisonPeriodType; label: string }> = [
  { value: "today", label: "Hoje vs Ontem" },
  { value: "7d", label: "7d vs 7d anteriores" },
  { value: "30d", label: "30d vs 30d anteriores" }
];

export function PeriodComparisonToggle({ value, onChange }: PeriodComparisonToggleProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          onClick={() => onChange(option.value)}
          className={cn(
            "text-xs",
            value === option.value && "bg-primary text-primary-foreground"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
