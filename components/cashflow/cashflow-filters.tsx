"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/billing/plans";
import { hasFeature } from "@/lib/plans/features";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { parseLocalDate, formatLocalDate } from "@/lib/utils/date-local";
import { replaceAndRefresh } from "@/lib/navigation/replace-and-refresh";
import { PersistedUrlPrefs } from "@/components/ui/persisted-url-prefs";
import { prefKey } from "@/lib/ui/local-prefs";

type Props = {
  active: { kind: "relative"; value: string } | { kind: "absolute"; start: string; end: string };
  userPlan: Plan;
  workspaceId: string;
};

const CASHFLOW_URL_KEYS = [
  "range",
  "start",
  "end",
  "expenseCategories",
  "incomeCategories",
  "paymentMethods",
  "paymentBrands",
  "viewMode",
  "groupBy",
  "spreadsheetOffer"
] as const;

const ALL_QUICK_RANGES = [
  { value: "month", label: "Mês" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "12m", label: "12m" }
] as const;

// FREE: mês atual e até 30 dias
const FREE_QUICK_RANGES = [
  { value: "month", label: "Mês" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" }
] as const;

function isActiveQuick(active: Props["active"], value: string) {
  return active.kind === "relative" && active.value === value;
}

export function CashflowFilters({ active, userPlan, workspaceId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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

  // Sincroniza dateRange quando active muda
  React.useEffect(() => {
    setDateRange(initialRange);
  }, [initialRange]);

  const minDate = useMemo(() => {
    if (!hasHistoricalAnalysis) {
      const min = new Date();
      min.setDate(min.getDate() - 30);
      min.setHours(0, 0, 0, 0);
      return min;
    }
    return undefined;
  }, [hasHistoricalAnalysis]);

  function goToQuick(value: string) {
    startTransition(() => {
      const sp = new URLSearchParams(searchParams?.toString());
      sp.delete("start");
      sp.delete("end");
      sp.set("range", value);
      replaceAndRefresh(router, `/app/cashflow?${sp.toString()}`);
    });
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

    startTransition(() => {
      const sp = new URLSearchParams(searchParams?.toString());
      sp.delete("range");
      sp.set("start", formatLocalDate(range.from!));
      sp.set("end", formatLocalDate(range.to || range.from!));
      replaceAndRefresh(router, `/app/cashflow?${sp.toString()}`);
    });
  }

  return (
    <div className="space-y-3 rounded-md border bg-card p-3">
      <PersistedUrlPrefs
        storageKey={prefKey("url", "cashflow", workspaceId)}
        keys={CASHFLOW_URL_KEYS}
        pathname="/app/cashflow"
      />
      <div className="flex flex-wrap items-center gap-2">
        {quickRanges.map((r) => (
          <Button
            key={r.value}
            type="button"
            size="sm"
            variant={isActiveQuick(active, r.value) ? "default" : "outline"}
            onClick={() => goToQuick(r.value)}
          >
            {r.label}
          </Button>
        ))}
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          onApply={handleDateRangeApply}
          minDate={minDate}
          maxDays={hasHistoricalAnalysis ? undefined : 30}
          placeholder="Selecionar período"
          disabled={isPending}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        {!hasHistoricalAnalysis && (
          <span className="text-primary font-medium">
            Plano FREE: análise limitada aos últimos 30 dias.{" "}
          </span>
        )}
        A URL é a fonte de verdade. Os filtros apenas navegam — os cálculos acontecem no servidor.
      </p>
    </div>
  );
}


