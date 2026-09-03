"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  active: { kind: "relative"; value: string } | { kind: "absolute"; start: string; end: string };
};

const quickRanges = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "12m", label: "12m" }
] as const;

function isActiveQuick(active: Props["active"], value: string) {
  return active.kind === "relative" && active.value === value;
}

export function WorkspaceDashboardFilters({ active }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [start, setStart] = useState(active.kind === "absolute" ? active.start : "");
  const [end, setEnd] = useState(active.kind === "absolute" ? active.end : "");

  const canApply = useMemo(() => Boolean(start && end), [start, end]);

  function goToQuick(value: string) {
    const sp = new URLSearchParams(searchParams?.toString());
    sp.delete("start");
    sp.delete("end");
    sp.set("range", value);
    router.push(`/app/dashboard?${sp.toString()}`);
  }

  function applyCustom() {
    if (!canApply) return;
    const sp = new URLSearchParams(searchParams?.toString());
    sp.delete("range");
    sp.set("start", start);
    sp.set("end", end);
    router.push(`/app/dashboard?${sp.toString()}`);
  }

  return (
    <div className="space-y-3 rounded-md border bg-card p-3">
      <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Data início
          </label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Data fim
          </label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex md:justify-end">
          <Button type="button" size="sm" onClick={applyCustom} disabled={!canApply}>
            Aplicar período
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        A URL é a fonte de verdade. Os filtros apenas navegam — os cálculos
        acontecem no servidor.
      </p>
    </div>
  );
}


