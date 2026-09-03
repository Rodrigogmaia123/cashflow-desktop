"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { closeOfferWeek, getOfferPeriodStatus } from "@/app/app/offers/[offerId]/actions";
import { addUtcDays, formatUtcShort, utcDateFromKey, utcKey } from "@/lib/utils/date-utc";

function todayKey() {
  return utcKey(new Date());
}

function defaultStartKey() {
  return utcKey(addUtcDays(utcDateFromKey(todayKey()), -6));
}

function formatRangeLabel(start: string, end: string) {
  try {
    return `${formatUtcShort(utcDateFromKey(start))}–${formatUtcShort(utcDateFromKey(end))}`;
  } catch {
    return `${start} → ${end}`;
  }
}

export function WeeklyCloseForm({
  offerId,
  currency = "BRL"
}: {
  offerId: string;
  currency?: string;
}) {
  const router = useRouter();
  const [periodStart, setPeriodStart] = useState(defaultStartKey);
  const [periodEnd, setPeriodEnd] = useState(todayKey);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    existingDates: string[];
    blocked: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      setStatus(null);
      return;
    }

    getOfferPeriodStatus(offerId, periodStart, periodEnd)
      .then((result) => {
        if (!cancelled) {
          setError(null);
          setStatus({
            existingDates: result.existingDates,
            blocked: result.blocked
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus(null);
          setError(err instanceof Error ? err.message : "Não foi possível conferir o período.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [offerId, periodStart, periodEnd]);

  const blocked = status?.blocked ?? false;
  const rangeLabel = formatRangeLabel(periodStart, periodEnd);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Fechamento semanal</h2>
        <p className="text-xs text-muted-foreground">
          Opcional. Escolha o início e o fim — pode ser 21 a 24, uns dias ou a semana inteira.
          Os totais entram como um lançamento no último dia. Se algum dia do intervalo já tiver
          diário, use o formulário de cima — este não mistura os dois.
        </p>
      </div>

      <form
        className="grid gap-3 text-xs sm:text-sm md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          startTransition(async () => {
            try {
              await closeOfferWeek(fd);
              router.refresh();
              setPeriodStart(defaultStartKey());
              setPeriodEnd(todayKey());
            } catch (err) {
              setError(err instanceof Error ? err.message : "Falha ao fechar o período.");
            }
          });
        }}
      >
        <input type="hidden" name="offerId" value={offerId} />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Início</label>
          <input
            type="date"
            name="periodStart"
            required
            value={periodStart || ""}
            onChange={(ev) => {
              const next = ev.target.value;
              if (!next) return;
              setPeriodStart(next);
              if (periodEnd && next > periodEnd) setPeriodEnd(next);
            }}
            className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Fim</label>
          <input
            type="date"
            name="periodEnd"
            required
            value={periodEnd || ""}
            onChange={(ev) => {
              const next = ev.target.value;
              if (!next) return;
              setPeriodEnd(next);
              if (periodStart && next < periodStart) setPeriodStart(next);
            }}
            className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <p className="md:col-span-2 text-[11px] text-muted-foreground">
          Período {rangeLabel}. O total entra no último dia do intervalo.
        </p>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Investimento ({currency})
          </label>
          <input
            name="investment"
            type="number"
            step="0.01"
            min={0}
            required
            disabled={blocked || pending}
            className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Faturamento ({currency})
          </label>
          <input
            name="revenue"
            type="number"
            step="0.01"
            min={0}
            required
            disabled={blocked || pending}
            className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-[11px] font-medium text-muted-foreground">Vendas</label>
          <input
            name="sales"
            type="number"
            min={0}
            step={1}
            required
            disabled={blocked || pending}
            className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>
        {blocked && (
          <p className="md:col-span-2 text-xs text-amber-400">
            Esse período já tem diário
            {status?.existingDates?.length
              ? ` (${status.existingDates
                  .map((key) => {
                    try {
                      return formatUtcShort(utcDateFromKey(key));
                    } catch {
                      return key;
                    }
                  })
                  .join(", ")})`
              : ""}
            . Não fecha em lote para não somar duas vezes.
          </p>
        )}
        {error && <p className="md:col-span-2 text-xs text-destructive">{error}</p>}
        <div className="md:col-span-2">
          <Button type="submit" size="sm" className="w-full" disabled={blocked || pending}>
            {pending ? "Salvando..." : "Fechar período"}
          </Button>
        </div>
      </form>
    </div>
  );
}
