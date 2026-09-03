"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "./segmented-control";
import type { Plan } from "@/lib/billing/plans";
import { hasFeature } from "@/lib/plans/features";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { parseLocalDate, formatLocalDate } from "@/lib/utils/date-local";

type Props = {
  active: { kind: "relative"; value: string } | { kind: "absolute"; start: string; end: string };
  userPlan: Plan;
};

const ALL_QUICK_RANGES = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "12m", label: "12m" }
] as const;

// FREE: apenas até 30 dias
const FREE_QUICK_RANGES = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" }
] as const;

export function DashboardFilters({ active, userPlan }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // FREE: apenas até 30 dias
  const hasHistoricalAnalysis = hasFeature(userPlan, "historical_analysis");
  const quickRanges = hasHistoricalAnalysis ? ALL_QUICK_RANGES : FREE_QUICK_RANGES;

  // Converte active para DateRange
  const initialRange: DateRange = useMemo(() => {
    if (active.kind === "absolute" && active.start && active.end) {
      return {
        from: parseLocalDate(active.start),
        to: parseLocalDate(active.end)
      };
    }
    return { from: null, to: null };
  }, [active]);

  const [dateRange, setDateRange] = useState<DateRange>(initialRange);

  // Limita máximo de data para FREE
  const maxDate = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }, []);

  const minDate = useMemo(() => {
    if (!hasHistoricalAnalysis) {
      const min = new Date();
      min.setDate(min.getDate() - 30);
      min.setHours(0, 0, 0, 0);
      return min;
    }
    return undefined;
  }, [hasHistoricalAnalysis]);

  function handleRangeChange(value: string) {
    if (value === "custom") return;
    const sp = new URLSearchParams(searchParams?.toString());
    sp.delete("start");
    sp.delete("end");
    sp.set("range", value);
    router.push(`/app/dashboard?${sp.toString()}`);
  }

  function handleDateRangeApply(range: DateRange) {
    if (!range.from) return;

    // Validação para FREE: bloqueia períodos customizados > 30 dias
    if (!hasHistoricalAnalysis && range.from && range.to) {
      const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysDiff > 30) {
        alert("No plano FREE, você pode visualizar apenas os últimos 30 dias. Faça upgrade para PRO para acessar análise histórica ilimitada.");
        return;
      }
    }

    const sp = new URLSearchParams(searchParams?.toString());
    sp.delete("range");
    sp.set("start", formatLocalDate(range.from));
    sp.set("end", formatLocalDate(range.to || range.from));
    router.push(`/app/dashboard?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
      {/* Mobile: scroll horizontal para pills */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 min-w-max md:min-w-0">
          <SegmentedControl
            options={quickRanges}
            value={active.kind === "relative" ? (quickRanges.some(r => r.value === active.value) ? active.value : "30d") : "30d"}
            onChange={handleRangeChange}
          />
        </div>
      </div>
      {/* Desktop: DateRangePicker custom (apenas PRO+) */}
      {hasHistoricalAnalysis && (
        <div className="hidden md:flex items-center">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            onApply={handleDateRangeApply}
            minDate={minDate}
            maxDate={maxDate}
            maxDays={hasHistoricalAnalysis ? undefined : 30}
            placeholder="Selecionar período"
          />
        </div>
      )}
    </div>
  );
}
