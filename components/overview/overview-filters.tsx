"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import type { Plan } from "@/lib/billing/plans";
import { hasFeature } from "@/lib/plans/features";
import { UpgradeModal } from "@/components/plans/upgrade-modal";
import { trackFeatureLocked } from "@/lib/analytics/conversion";
import { FEATURE_MESSAGES } from "@/lib/plans/features";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { parseLocalDate, formatLocalDate } from "@/lib/utils/date-local";

type Props = {
  active: { kind: "relative"; value: string } | { kind: "absolute"; start: string; end: string };
  userPlan: Plan;
};

const ALL_QUICK_RANGES = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "custom", label: "Custom" }
] as const;

// FREE: apenas até 30 dias
const FREE_QUICK_RANGES = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" }
] as const;

export function OverviewFilters({ active, userPlan }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    if (value === "custom") {
      // Se FREE tentar usar custom, abre modal
      if (!hasHistoricalAnalysis) {
        trackFeatureLocked({
          feature: "historical_analysis",
          source: "overview_range_selector",
          plan: userPlan,
          requiredPlan: "PRO",
        });
        setIsModalOpen(true);
        return;
      }
      return;
    }

    startTransition(() => {
      const sp = new URLSearchParams(searchParams?.toString());
      sp.delete("start");
      sp.delete("end");
      sp.set("range", value);
      router.replace(`/app/overview?${sp.toString()}`, { scroll: false });
    });
  }

  function handleDateRangeApply(range: DateRange) {
    if (!range.from) return;

    // Validação para FREE: bloqueia períodos customizados > 30 dias
    if (!hasHistoricalAnalysis && range.from && range.to) {
      const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysDiff > 30) {
        // Track evento
        trackFeatureLocked({
          feature: "historical_analysis",
          source: "overview_custom_range",
          plan: userPlan,
          requiredPlan: "PRO",
        });
        setIsModalOpen(true);
        return;
      }
    }

    startTransition(() => {
      const sp = new URLSearchParams(searchParams?.toString());
      sp.delete("range");
      sp.set("start", formatLocalDate(range.from!));
      sp.set("end", formatLocalDate(range.to || range.from!));
      router.replace(`/app/overview?${sp.toString()}`, { scroll: false });
    });
  }

  const activeValue = active.kind === "relative" ? active.value : "custom";

  return (
    <>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
        {/* Mobile: scroll horizontal para pills */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 min-w-max md:min-w-0">
            <SegmentedControl
              options={quickRanges}
              value={active.kind === "relative" ? (quickRanges.some(r => r.value === active.value) ? active.value : "30d") : (hasHistoricalAnalysis ? "custom" : "30d")}
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
              disabled={isPending}
            />
          </div>
        )}

        {/* FREE: mostra tooltip sobre limite */}
        {!hasHistoricalAnalysis && (
          <div className="hidden md:flex items-center">
            <p className="text-xs text-muted-foreground">
              Análise histórica completa disponível no plano{" "}
              <button
                onClick={() => {
                  trackFeatureLocked({
                    feature: "historical_analysis",
                    source: "overview_tooltip",
                    plan: userPlan,
                    requiredPlan: "PRO",
                  });
                  setIsModalOpen(true);
                }}
                className="text-primary hover:underline font-medium"
              >
                Pro
              </button>
            </p>
          </div>
        )}
      </div>

      <UpgradeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        feature="historical_analysis"
        requiredPlan="PRO"
        title={FEATURE_MESSAGES.historical_analysis.title}
        description={FEATURE_MESSAGES.historical_analysis.description}
      />
    </>
  );
}

