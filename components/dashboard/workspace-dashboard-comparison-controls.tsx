"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Metric = "revenue" | "profit" | "roi";

type OfferOption = { id: string; name: string };

type Props = {
  offers: OfferOption[];
  initialOfferIds: string[];
  initialMetric: Metric;
};

export function WorkspaceDashboardComparisonControls({
  offers,
  initialOfferIds,
  initialMetric
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState<string[]>(initialOfferIds);
  const [metric, setMetric] = useState<Metric>(initialMetric);

  const canApply = useMemo(() => selected.length >= 1, [selected.length]);

  function toggleOffer(id: string) {
    setSelected((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }

  function apply() {
    if (!canApply) return;
    const sp = new URLSearchParams(searchParams?.toString());
    sp.set("view", "compare");
    sp.set("offers", selected.join(","));
    sp.set("metric", metric);
    router.push(`/app/dashboard?${sp.toString()}`);
  }

  function clear() {
    setSelected([]);
  }

  return (
    <div className="space-y-3 rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Modo comparação</div>
          <p className="text-[11px] text-muted-foreground">
            Compare até 3 ofertas em uma métrica (dados prontos do backend).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={clear}>
            Limpar
          </Button>
          <Button type="button" size="sm" onClick={apply} disabled={!canApply}>
            Aplicar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1 md:col-span-2">
          <div className="text-[11px] font-medium text-muted-foreground">
            Ofertas (máx. 3)
          </div>
          <div className="flex flex-wrap gap-2">
            {offers.map((o) => {
              const active = selected.includes(o.id);
              return (
                <Button
                  key={o.id}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => toggleOffer(o.id)}
                  title={active ? "Remover" : "Adicionar"}
                >
                  {o.name}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Métrica
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="revenue">Faturamento</option>
            <option value="profit">Lucro</option>
            <option value="roi">ROI</option>
          </select>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Dica: se nada aparecer, selecione 1–3 ofertas e clique em “Aplicar”.
      </p>
    </div>
  );
}


